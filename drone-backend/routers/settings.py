from fastapi import APIRouter
from ..models import SettingsWrapper
from ..simulator import drone_sim 
import datetime

router = APIRouter()

@router.get("/api/v1/settings")
async def get_settings():
    drone_settings = {
        "rthAltitude": drone_sim.rth_altitude, 
        "geofenceEnabled": drone_sim.geofence_enabled,
        "homeLatitude": drone_sim.home_lat,
        "homeLongitude": drone_sim.home_lon
    }

    return {
        "type": "SETTINGS_FETCH_RESPONSE",
        "status": "success",
        "timestamp": datetime.datetime.now().isoformat(),
        "data": drone_settings
    }

@router.post("/api/v1/settings")
async def save_settings(wrapper: SettingsWrapper):
    
    drone_sim.update_settings(wrapper.drone)
    
    return {
        "type": "SETTING_UPDATE_RESPONSE",
        "status": "success",
        "message": "Settings applied to flight controller",
        "timestamp": datetime.datetime.now().isoformat(),
        "data": wrapper.drone.model_dump()
    }