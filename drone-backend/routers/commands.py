from fastapi import APIRouter, Depends
from sqlmodel import Session
from ..models import CommandWrapper
from ..database import get_session, FlightPlan

import uuid, datetime, asyncio

# This imports the same simulator object 
# from ..simulator import drone_sim

from ..bridge import drone_bridge, DroneError

router = APIRouter()

# COMMAND: Sends an immediate instruction to the backend
@router.post("/api/v1/command")
async def post_commands(wrapper : CommandWrapper, session: Session = Depends(get_session)):

    command_data = wrapper.command

    print(f"DEBUG: Command Received: {command_data.name}")
    print(f"DEBUG: Payload: {command_data}")

    # Default message
    message = f"Received {command_data.name} successfully"
    status = "success"

    try:
        if command_data.name == "ACTIVATE_FLIGHT_PLAN" and command_data.flight_plan_id:
            plan = session.get(FlightPlan, command_data.flight_plan_id)
            if plan:
                print(f"DEBUG: Plan Found: {plan.name}. activating...")
                # Sort the waypoints
                sorted_wps = sorted(plan.waypoints, key=lambda w: w.order)
                
                # This updates the state inside 'simulator.py'
                # drone_sim.activate_mission(sorted_wps, plan_id=str(plan.id))

                home_lat = command_data.home_lat
                home_lon = command_data.home_lon

                upload_success = drone_bridge.activate_mission(sorted_wps, plan_id=str(plan.id), home_lat=home_lat, home_lon=home_lon)

                if upload_success:
                    # Update the message so the UI shows something cool
                    message = f"Mission '{plan.name}' uploaded successfully to drone memory."
                else:
                    status = 'error'
                    print(f"DEBUG: Drone rejected the plan")
                    message = "Hardware Error: Drone rejected the mission upload"

            else:
                status = "error"
                print(f"DEBUG: Plan ID {command_data.flight_plan_id} NOT FOUND in DB.")
                message = f"Database Error: Flight Plan not found."

        elif command_data.name == "START_MISSION":
            # drone_sim.start_mission()


            print("DEBUG: Initiating automated pre-flight sequence...")

            drone_bridge.set_mode("GUIDED")
            await asyncio.sleep(1)

            drone_bridge.arm()
            await asyncio.sleep(2)

            drone_bridge.takeoff(15.0) # Takeoff to 15 m
            print("DEBUG: Taking off. Waiting for safe altitude...")
            await asyncio.sleep(7)

            drone_bridge.start_mission()
            message = "Mission execution started (Switched to AUTO mode)."

        elif command_data.name == "STOP_MISSION":
            # drone_sim.is_flying = False
            drone_bridge.pause_mission()
            message = "Mission paused. Drone is holding position (LOITER)."

        elif command_data.name == "ABORT_MISSION":
            # drone_sim.is_flying = False
            # drone_sim.active_waypoints = []
            drone_bridge.pause_mission()
            drone_bridge.clear_mission() # Wipes the waypoints stored in drone memory
            message = "Mission aborted and memory wiped. Drone is hovering in place."

        elif command_data.name == "LAND":
            # drone_sim.is_flying = False
            # drone_sim.alt = 0 
            drone_bridge.land()
            message = "Landing initiated."

        elif command_data.name == "RETURN_TO_HOME":
            # drone_sim.return_to_home()
            drone_bridge.return_to_home()
            message = "Returning to launch coordinates (RTL mode)."
        
        else:
                status = "error"
                message = f"Unknown command: {command_data.name}"
                print("DEBUG: Condition failed. Either name mismatch or missing parameters.")
    except DroneError as e:
        status = "error"
        message = f"Hardware comman failed: {str(e)}"
        print(f"DRONE ERROR executing {command_data.name}: {e}")
    except Exception as e:
        status = "error"
        message = f"Internal Server Error: {str(e)}"
        print(f"OTHER ERROR executing {command_data.name}: {e}")

    # Generate a server-side ID for this command
    command_id = str(uuid.uuid4())
    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    print(f"Processing COMMAND: {command_data.name}, ID: {command_id}, Status: {status}")

    return {
        "type": "COMMAND_RESPONSE",
        "status": status,
        "message": message,
        "timestamp": date_string,
        "command_id": command_id,
        "data": command_data.model_dump(by_alias=True)
    }
