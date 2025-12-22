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
    print(f"DEBUG: Flight Plan ID in Payload: {command_data.flight_plan_id}")

    # Default message
    message = f"Received {command_data.name} successfully"

    if command_data.name == "ACTIVATE_FLIGHT_PLAN" and command_data.flight_plan_id:
        plan = session.get(FlightPlan, command_data.flight_plan_id)
        if plan:
            print(f"DEBUG: Plan Found: {plan.name}. activating...")
            # Sort the waypoints
            sorted_wps = sorted(plan.waypoints, key=lambda w: w.order)
            
            # This updates the state inside 'simulator.py'
            drone_sim.activate_mission(sorted_wps)

            # Update the message so the UI shows something cool
            message = f"Mission '{plan.name}' activated. Takeoff initialized."
        else:
            print(f"DEBUG: Plan ID {command_data.flight_plan_id} NOT FOUND in DB.")
            message = "Error: Flight Plan not found in database."
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
