from fastapi import APIRouter, Depends
from sqlmodel import Session
from ..models import CommandWrapper
from ..database import get_session, FlightPlan
import uuid, datetime
# This imports the same simulator object 
from ..simulator import drone_sim

router = APIRouter()

# COMMAND: Sends an immediate instruction to the backend
@router.post("/api/v1/command")
async def post_commands(wrapper : CommandWrapper, session: Session = Depends(get_session)):

    command_data = wrapper.command

    print(f"DEBUG: Command Received: {command_data.name}")
    print(f"DEBUG: Payload: {command_data}")

    # Default message
    message = f"Received {command_data.name} successfully"

    if command_data.name == "ACTIVATE_FLIGHT_PLAN" and command_data.flight_plan_id:
        plan = session.get(FlightPlan, command_data.flight_plan_id)
        if plan:
            print(f"DEBUG: Plan Found: {plan.name}. activating...")
            # Sort the waypoints
            sorted_wps = sorted(plan.waypoints, key=lambda w: w.order)
            
            # This updates the state inside 'simulator.py'
            drone_sim.activate_mission(sorted_wps, plan_id=str(plan.id))

            # Update the message so the UI shows something cool
            message = f"Mission '{plan.name}' activated. Takeoff initialized."
        else:
            print(f"DEBUG: Plan ID {command_data.flight_plan_id} NOT FOUND in DB.")
            message = "Error: Flight Plan not found in database."

    elif command_data.name == "START_MISSION":
        drone_sim.start_mission()
        message = "Mission execution started."

    elif command_data.name == "STOP_MISSION":
        drone_sim.is_flying = False
        message = "Mission paused. Drone hovering."

    elif command_data.name == "ABORT_MISSION":
        drone_sim.is_flying = False
        drone_sim.active_waypoints = []
        message = "Mission aborted. Drone hovering."

    elif command_data.name == "LAND":
        drone_sim.is_flying = False
        drone_sim.alt = 0 
        message = "Landing initiated."

    elif command_data.name == "RETURN_TO_HOME":
        drone_sim.return_to_home()
        message = "Returning to Home. Original plan will be restored upon arrival."

    else:
        print("DEBUG: Condition failed. Either name mismatch or no ID.")


    # Generate a server-side ID for this command
    command_id = str(uuid.uuid4())
    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    print(f"Processing COMMAND: {command_data.name}, ID: {command_id}")

    return {
        "type": "COMMAND_RESPONSE",
        "status": "success",
        "message": message,
        "timestamp": date_string,
        "command_id": command_id,
        "data": command_data.model_dump(by_alias=True)
    }
