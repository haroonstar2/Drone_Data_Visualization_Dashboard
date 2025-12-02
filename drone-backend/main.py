# Run using fastapi dev *name*
from fastapi import FastAPI, HTTPException # For better error checking
from fastapi.middleware.cors import CORSMiddleware # Allows the frontend to make requests to the backend
from pydantic import BaseModel, Field
from typing import Dict
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

# Define what a request should look like
class GenericPayload(BaseModel):
    type: str
    payload: dict

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
async def post_commands(wrapper : Dict[str, GenericPayload]):

    if len(wrapper) != 1:
        raise HTTPException(status_code=422, detail="Request body must contain exactly one top-level key (e.g., 'command' or 'setting').")

    # Extract the key and inner payload object
    key, payload_data = list(wrapper.items())[0]
    print(f"Recieved wrapper key: {key}")

    # Generate a server-side ID for this command
    commandId = str(uuid.uuid4())
    
    commandType = payload_data.type
    commandPayload = payload_data.payload

    # For time stamping
    now = datetime.datetime.now()
    date_string = now.isoformat()

    optional_message = f"Received {key} type: {commandType}"
    print(f"Processing {key}: {commandType}, ID: {commandId}")

    return {
        "type": "COMMAND_RESPONSE",
        "status": "success",
        "message": optional_message,
        "timestamp": date_string,
        "commandId": commandId,
        "data": commandPayload
    }

# SAVE PLAN: Create a new plan or update an existing one.
@app.post("/api/v1/plans")
async def save_plan(wrapper : Dict[str, GenericPayload]):

    # Extract the key and inner payload object
    key, payload_data = list(wrapper.items())[0]
    print(f"Recieved wrapper key: {key}")

    # Try to unpack the payloac into a FlightPlanModel
    try:
        plan_data = FlightPlanModel(**payload_data.payload)
    except Exception as e:
        # If the inner data wasn't a valid flight plan, reject it.
        print(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail="Inner payload does not match Flight Plan structure.")

    # If the frontend sent an ID, keep it. If not, generate a new one.
    if plan_data.id:
        planId = plan_data.id
        print(f"Updating existing plan: {planId}")
    else:
        planId = str(uuid.uuid4())
        print(f"Creating new plan with ID: {planId}")

    # For time stamping
    now = datetime.datetime.now()
    date_string = now.isoformat()

    return {
        "type": "FLIGHT_PLAN_SAVED",
        "status": "success",
        "message": f"Flight plan {plan_data.name} successfully saved",
        "timestamp": date_string,
        "data": {
            "id": planId,
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
    now = datetime.datetime.now()
    date_string = now.isoformat()


    return {
        "type": "FLIGHT_PLAN_LIST",
        "status": "success",
        "message": "Flight plan list retrieved successfully",
        "timestamp": date_string,
        "data": plans
    }

@app.get("/api/status")
async def get_status():
    return {
        "status": "OK",
        "droneConnected": True,
        "backend_language": "Python"
    }