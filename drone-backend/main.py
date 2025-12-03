# Run using fastapi dev *name*
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Allows the frontend to make requests to the backend
from pydantic import BaseModel, Field
import datetime # For time stamping
import uuid # For generating Ids

# Default port for Vite. Change if needed
VITE_PORT = 5173 

# Initialize backend router
app = FastAPI()

# List of origins that are allowed to make requests
origins = [
    f"http://localhost:{VITE_PORT}",
    f"http://127.0.0.1:{VITE_PORT}"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # List of allowed origins
    allow_credentials=True,      # Allow cookies/auth headers
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST)
    allow_headers=["*"],         # Allow all headers
)

# Model for immediate drone commands (HOVER, LAND, etc.)
class CommandPayload(BaseModel):
    name: str
    # Use Field alias so frontend can send camelCase "hoverDuration"
    hover_duration: int | None = Field(default=None, alias="hoverDuration")

# Model for drone settings updates
class DroneSettingsPayload(BaseModel):
    rthAltitude: int
    geofence_enabled: bool | None = Field(default=None, alias="geofenceEnabled")
    homeLatitude: float
    homeLongitude: float
    # Add other drone-specific settings

# Wrapper specifically for commands
class CommandWrapper(BaseModel):
    command: CommandPayload

# Wrapper specifically for settings
class SettingsWrapper(BaseModel):
    drone: DroneSettingsPayload

class FlightPlanWrapper(BaseModel):
    plan: FlightPlanModel

# Define what a single waypoint looks like
class WaypointModel(BaseModel):
    # ID might not exist yet if it's brand new
    id: str 
    latitude: float
    longitude: float
    altitude: float = 100
    action: str = "PASS_THROUGH" 
    # Use Field to allow frontend to send camelCase "hoverDuration"
    # but have Python see snake_case "hover_duration"
    hover_duration: int | None = Field(default=None, alias="hoverDuration")
    # Allow population by field name for alias to work correctly
    class Config:
        populate_by_name = True


# Define the structure of the plan data sent from frontend
class FlightPlanModel(BaseModel):
    # ID is optional: present for updates, null for new plans
    id: str | None = None
    name: str
    description: str
    # A list of the Waypoint models
    waypoints: list[WaypointModel]

@app.get("/")
async def root():
    return {"message": "Hello from your new FastAPI Backend!"}

# COMMAND: Sends an immediate instruction to the backend
@app.post("/api/v1/command")
async def post_commands(wrapper : CommandWrapper):

    command_data = wrapper.command
    # Generate a server-side ID for this command
    command_id = str(uuid.uuid4())

    command_name = command_data.name
    hover_duration = command_data.hover_duration

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    message = f"Received {command_name} successfully"
    print(f"Processing COMMAND: {command_name}, ID: {command_id}")

    return {
        "type": "COMMAND_RESPONSE",
        "status": "success",
        "message": message,
        "timestamp": date_string,
        "command_id": command_id,
        "data": command_data.model_dump(by_alias=True)
    }

# GET SETTINGS: Gathers all drone settings
@app.get("/api/v1/settings")
async def get_settings():

    drone_settings = {
        "rthAltitude": 100, 
        "geofenceEnabled": True,
        "homeLatitude": 36.737797,
        "homeLongitude": -119.787125
    }

    date_string = datetime.datetime.now().isoformat()

    return {
        "type": "SETTINGS_FETCH_RESPONSE",
        "status": "success",
        "message": "Drone settings retrieved successfully",
        "timestamp": date_string,
        "data": drone_settings
    }

# SAVE SETTINGS: Sends a configuration change to the backend
@app.post("/api/v1/settings")
async def save_settings(wrapper: SettingsWrapper):

    settings_data = wrapper.drone
    
    now = datetime.datetime.now().isoformat()

    print(f"Processing SETTINGS UPDATE: RTH Alt: {settings_data.rthAltitude}")

    return {
        "type": "SETTING_UPDATE_RESPONSE",
        "status": "success",
        "message": "Settings updated successfully",
        "timestamp": now,
        "data": settings_data.model_dump()
    }

# SAVE PLAN: Create a new plan or update an existing one.
@app.post("/api/v1/plans")
async def save_plan(wrapper : FlightPlanWrapper):

    plan_data = wrapper.plan

    # If the frontend sent an ID, keep it. If not, generate a new one.
    if plan_data.id:
        plan_id = plan_data.id
        print(f"Updating existing plan: {plan_id}")
    else:
        plan_id = str(uuid.uuid4())
        print(f"Creating new plan with ID: {plan_id}")

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    return {
        "type": "FLIGHT_PLAN_SAVED",
        "status": "success",
        "message": f"Flight plan {plan_data.name} successfully saved",
        "timestamp": date_string,
        "data": {
            "id": plan_id,
            "name": plan_data.name,
            "description": plan_data.description,
            # Convert the list of WaypointModels back to a list of dictionaries
            # model_dump(by_alias=True) ensures hover_duration becomes hoverDuration for JS
            "waypoints": [wp.model_dump(by_alias=True) for wp in plan_data.waypoints],
            "lastModified": date_string,
            "waypointCount": len(plan_data.waypoints)
        }
    }

# LIST ALL PLANS: Fetches a summary list of all available plans
@app.get("/api/v1/plans")
async def get_plans():

    plans = [
        { "id": 'fp_12345', 
            "name": 'Field Survey Alpha', 
            "description": "Summary description...",
            "waypointCount": 3, 
            "lastModified": '2025-11-01T10:00:00Z' 
        },
        { "id": 'fp_67890', 
        "name": 'Perimeter Inspection', 
        "description": "Summary description...",
        "waypointCount": 8, 
        "lastModified": '2025-10-30T15:20:00Z' 
        }
    ]

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    return {
        "type": "FLIGHT_PLAN_LIST",
        "status": "success",
        "message": "Flight plan list retrieved successfully",
        "timestamp": date_string,
        "data": plans
    }

# GET FLIGHT PLAN DETAILS: Fetches the complete data for a specific plan.
@app.get("/api/v1/plans/{plan_id}")
async def get_plan_details(plan_id: str):

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    payload = {
          "id": plan_id,
          "name": "Field Survey Alpha (retrieved)",
          "description": "200ft alititude grid pattern",
          "lastModified": date_string,
          "waypoints": [
            { "id": 'wp_hc_1', "order": 1, "latitude": 36.7468, "longitude": -119.7726, "altitude": 60, "action": 'take_photo' },
            { "id": 'wp_hc_2', "order": 2, "latitude": 36.7468, "longitude": -119.7726, "altitude": 60, "action": 'hover' },            
            { "id": 'wp_hc_3', "order": 3, "latitude": 36.7468, "longitude": -119.7726, "altitude": 60, "action": 'pass_through' },          ]
        }

    return {
        "type": "FLIGHT_PLAN_DATA",
        "status": "success",
        "message": f"Flight plan {plan_id} details retrieved successfully",
        "timestamp": date_string,
        "data": payload
    }

# LIST MISSION HISTORY: Fetches a summary list of past missions
@app.get("/api/v1/missions")
async def get_mission_history():

    payload = [
        { "id": 'm_001', "name": 'Test Flight 1', "date": '2025-09-20', "duration_min": 15, "logCount": 45 },
        { "id": 'm_002', "name": 'Mapping Run A', "date": '2025-09-22', "duration_min": 45, "logCount": 152 },
        { "id": 'm_003', "name": 'Perimeter Check', "date": '2025-09-24', "duration_min": 22, "logCount": 78 }
    ]

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    return {
    "type": "MISSION_LIST",
    "status": "success",
    "message": f"Mission list retrieved successfully",
    "timestamp": date_string,
    "data": payload
    }

# GET MISSION DETAILS: Fetches all logs associated with a completed mission
@app.get("/api/v1/missions/{mission_id}")
async def get_mission_details(mission_id: str):
    
    fake_logs = [
        {"timestamp": "2025-09-20T10:00:01Z", "level": "INFO", "message": f"Mission {mission_id} started."},
        {"timestamp": "2025-09-20T10:00:05Z", "level": "INFO", "message": "Takeoff complete."},
        {"timestamp": "2025-09-20T10:07:22Z", "level": "INFO", "message": "Waypoint 1 reached."},
        {"timestamp": "2025-09-20T10:15:00Z", "level": "WARN", "message": "Low battery, initiating RTH."},
        {"timestamp": "2025-09-20T10:17:00Z", "level": "INFO", "message": "Landing complete."}
    ]
    log_count = len(fake_logs)

    payload = {
        "id": mission_id,
        "logCount": log_count,
        "logs": fake_logs
    }

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    return {
        "type": "MISSION_DETAILS",
        "status": "success",
        "message": f"Mission {mission_id} logs retrieved successfully",
        "timestamp": date_string,
        "data": payload
    }


@app.get("/api/status")
async def get_status():
    return {
        "status": "OK",
        "droneConnected": True,
        "backend_language": "Python"
    }