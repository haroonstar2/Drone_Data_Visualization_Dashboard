from pydantic import BaseModel, Field

# --- COMMANDS
# Model for immediate drone commands (HOVER, LAND, etc.)
class CommandPayload(BaseModel):
    name: str
    # Use Field alias so frontend can send camelCase "hoverDuration"
    hover_duration: int | None = Field(default=None, alias="hoverDuration")
    flight_plan_id: str | None = Field(default=None, alias="flightPlanId")

# Wrapper specifically for commands
class CommandWrapper(BaseModel):
    command: CommandPayload

# --- SETTINGS
# Model for drone settings updates
class DroneSettingsPayload(BaseModel):
    rthAltitude: int
    geofence_enabled: bool | None = Field(default=None, alias="geofenceEnabled")
    homeLatitude: float
    homeLongitude: float
    # Add other drone-specific settings

# Wrapper specifically for settings
class SettingsWrapper(BaseModel):
    drone: DroneSettingsPayload

# --- PLANS
# Define the structure of the plan data sent from frontend
class FlightPlanModel(BaseModel):
    # ID is optional: present for updates, null for new plans
    id: str | None = None
    name: str
    description: str
    # A list of the Waypoint models
    waypoints: list["WaypointModel"]

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
    order: int | None = None
    # Allow population by field name for alias to work correctly
    class Config:
        populate_by_name = True
