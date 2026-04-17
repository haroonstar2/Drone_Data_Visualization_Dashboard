from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, desc
from ..database import get_session, FlightPlan, Waypoint
from ..models import FlightPlanWrapper
from ..simulator import drone_sim
import uuid, datetime

router = APIRouter()

@router.post("/api/v1/plans")
async def save_plan(wrapper : FlightPlanWrapper, session: Session = Depends(get_session)):

    plan_data = wrapper.plan

    # Handle update plan vs create new plan
    if plan_data.id:
        existing_plan = session.get(FlightPlan, plan_data.id)
        if existing_plan:
            # Delete the old plan and add the new plan later
            for wp in existing_plan.waypoints:
                session.delete(wp)
            session.delete(existing_plan)
            session.commit()

    # If the frontend didn't provide an ID, we generate one.
    plan_id = plan_data.id if plan_data.id else str(uuid.uuid4())
    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    # Create a new plan
    db_plan = FlightPlan(
        id=plan_id,
        name=plan_data.name,
        description=plan_data.description,
        last_modified=date_string
    )
    session.add(db_plan)

    # Create waypoint objects for the plan
    for index, wp in enumerate(plan_data.waypoints):

        # If the ID is a simple frontend number (like "1"), generate a new UUID.
        # If it's already a real UUID (36 chars), keep it.
        if len(wp.id) < 36: 
            wp_id = str(uuid.uuid4())
        else:
            wp_id = wp.id
        
        db_waypoint = Waypoint(
            id=wp_id,
            latitude=wp.latitude,
            longitude=wp.longitude,
            altitude=wp.altitude,
            action=wp.action,
            hover_duration=wp.hover_duration,
            order=index, # Keep track of the sequence
            plan_id=plan_id # Link to parent
        )
        session.add(db_waypoint)

    # Save everything
    session.commit()
    session.refresh(db_plan)
    print(f"Saved Plan {plan_id} with {len(db_plan.waypoints)} waypoints to Database.")

    # Check if the simulator is currently holding this plan
    if drone_sim.active_plan_id == str(plan_id):
        print(f"DEBUG: Hot-reloading active plan {plan_id} in simulator.")

        sorted_wps = sorted(db_plan.waypoints, key=lambda w: w.order)
        
        # Update the simulator directly
        drone_sim.active_waypoints = sorted_wps


    return {
        "type": "FLIGHT_PLAN_SAVED",
        "status": "success",
        "message": f"Flight plan {db_plan.name} saved.",
        "timestamp": date_string,
        "data": {
            "id": plan_id,
            "name": db_plan.name,
            "description": db_plan.description,
            "waypoints": [
                # Return the data just saved
                wp.model_dump(by_alias=True) for wp in db_plan.waypoints
            ],
            "lastModified": db_plan.last_modified,
            "waypointCount": len(db_plan.waypoints)
        }
    }

@router.get("/api/v1/plans")
async def get_plans(session: Session = Depends(get_session)):

    # SQL: SELECT * FROM flightplan
    statement = select(FlightPlan).order_by(FlightPlan.last_modified.desc())
    results = session.exec(statement).all()

    # Convert DB objects to format frontend expects
    plans_payload = []
    for plan in results:
        plans_payload.append({
            "id": plan.id,
            "name": plan.name,
            "description": plan.description,
            "waypointCount": len(plan.waypoints),
            "lastModified": plan.last_modified
        })

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    return {
        "type": "FLIGHT_PLAN_LIST",
        "status": "success",
        "message": "Flight plan list retrieved from DB",
        "timestamp": date_string,
        "data": plans_payload
    }

@router.get("/api/v1/plans/{plan_id}")
async def get_plan_details(plan_id: str, session: Session = Depends(get_session)):

    # SQL: SELECT * FROM ... WHERE id = ...
    plan = session.get(FlightPlan, plan_id)

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")


    # Sort waypoints by 'order' to ensure path is correct
    sorted_waypoints = sorted(plan.waypoints, key=lambda w: w.order)

    # For time stamping
    date_string = datetime.datetime.now().isoformat()

    payload = {
        "id": plan.id,
        "name": plan.name,
        "description": plan.description,
        "lastModified": plan.last_modified,
        # Convert DB waypoints to Pydantic models
        "waypoints": [
             {
                 "id": wp.id,
                 "latitude": wp.latitude,
                 "longitude": wp.longitude,
                 "altitude": wp.altitude,
                 "action": wp.action,
                 "hoverDuration": wp.hover_duration,
                 "order": wp.order
             } 
             for wp in sorted_waypoints
        ]
    }

    return {
        "type": "FLIGHT_PLAN_DATA",
        "status": "success",
        "message": f"Flight plan {plan_id} details retrieved",
        "timestamp": date_string,
        "data": payload
    }
