from fastapi import APIRouter
from ..models import SettingsWrapper
import datetime

router = APIRouter()

@router.get("/api/v1/settings")
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

@router.post("/api/v1/settings")
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

@router.get("/api/status")
async def get_status():
    return {
        "status": "OK",
        "droneConnected": True,
        "backend_language": "Python"
    }
