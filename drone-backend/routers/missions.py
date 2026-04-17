from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session, Mission
import datetime

router = APIRouter()

@router.get("/api/v1/missions")
async def get_mission_history(session: Session = Depends(get_session)):

    # Get all missions, sorted by date descending
    statement = select(Mission).order_by(Mission.date.desc())
    results = session.exec(statement).all()

    payload = []
    for m in results:
        payload.append({
            "id": m.id,
            "name": m.name,
            "date": m.date,
            "duration_min": round(m.duration_seconds / 60, 1),
            "logCount": len(m.logs)
        })

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    return {
    "type": "MISSION_LIST",
    "status": "success",
    "message": f"Mission list retrieved successfully",
    "timestamp": date_string,
    "data": payload
    }

@router.get("/api/v1/missions/{mission_id}")
async def get_mission_details(mission_id: str, session: Session = Depends(get_session)):
    
    mission = session.get(Mission, mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    # Convert DB objects to JSON
    logs_payload = []
    for log in mission.logs:
        logs_payload.append({
            "timestamp":log.timestamp,
            "level": log.level,
            "message": log.message
        })

    log_count = len(logs_payload)

    payload = {
        "id": mission_id,
        "logCount": log_count,
        "logs": logs_payload
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
