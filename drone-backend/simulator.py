import datetime, uuid, random, math, asyncio
from sqlmodel import Session
from .database import engine, Mission, MissionLog

class DroneSimulator:
    def __init__(self):
        pass

async def run_telemetry_loop(websocket):
    # Create a database session manually since Websockets doesn't work with Depends()
    with Session(engine) as session:
        mission_id = str(uuid.uuid4())
        mission_created_in_db = False
        start_time = datetime.datetime.now()

        # Helper function to ensure mission exists before we add logs/updates (otherwise duplicate missions are saved)
        def ensure_mission_exists():
            nonlocal mission_created_in_db
            if not mission_created_in_db:
                new_mission = Mission(
                    id=mission_id,
                    name=f"Simulation Run {start_time.strftime('%H:%M')}",
                    date=start_time.isoformat(),
                    duration_seconds=0
                )
                session.add(new_mission)
                session.commit()
                mission_created_in_db = True
                print(f"Mission {mission_id} persisted to DB (Active session confirmed).")


        # Drone state (fast updates)
        center_lat = 36.737797
        center_lon = -119.787125
        radius = 0.0005
        angle = 0.0
        altitude = 100.0
        battery = 100.0
        speed = 15.0
        
        # Environment state (slow updates)
        wind_speed = 5.0
        wind_heading = 90
        temperature = 25.0

        # Simulation loop counters
        tick_count = 0

        try:
            while True:
                # Save the mission at 20 ticks
                if tick_count == 20: 
                    ensure_mission_exists()

                # HIGH FREQUENCY TELEMETRY (Every tick: 0.1s)
                angle += 0.05
                current_lat = center_lat + (radius * math.sin(angle))
                current_lon = center_lon + (radius * math.cos(angle))
                current_alt = altitude + math.sin(angle * 3)
                heading = (math.degrees(math.atan2(math.cos(angle), -math.sin(angle))) + 360) % 360
                battery = max(0, battery - 0.02)

                telemetry_packet = {
                    "type": "TELEMETRY_UPDATE", # Distinct Type Header for frontend to distinguish
                    "timestamp": datetime.datetime.now().isoformat(),
                    "payload": {
                    "latitude": current_lat,
                    "longitude": current_lon,
                    "altitude": round(current_alt, 1),
                    "speed": speed,
                    "heading": round(heading),
                    "battery": round(battery, 1),
                    }
                }
                await websocket.send_json(telemetry_packet)


                # LOW FREQUENCY ENVIRONMENT (Every 50 ticks: 5.0s)
                if tick_count % 50 == 0:
                    # Simulate slight weather shifting
                    wind_speed = max(0, wind_speed + random.uniform(-1, 1))
                    wind_heading = (wind_heading + random.uniform(-5, 5)) % 360
                    temperature = temperature + random.uniform(-0.1, 0.1)

                    env_packet = {
                        "type": "ENVIRONMENT_UPDATE",
                        "timestamp": datetime.datetime.now().isoformat(),
                        "payload": {
                            "windSpeed": round(wind_speed, 1),
                            "windDirection": round(wind_heading),
                            "temperature": round(temperature, 1),
                            "weatherCondition": "Sunny"
                        }
                    }
                    await websocket.send_json(env_packet)

                # EVENT-DRIVEN LOGS and STATUS (Random chance) 1% chance per tick to generate a log message
                if random.random() < 0.01:
                    ensure_mission_exists()

                    log_levels = ["INFO", "WARN"]
                    level = random.choice(log_levels)
                    message = f"Simulated system event occurred at tick {tick_count}"
                    timestamp = datetime.datetime.now().isoformat()

                    # Send the packet to the frontend
                    log_packet = {
                        "type": "NEW_LOG",
                        "timestamp": timestamp,
                        "payload": {
                            "timestamp": timestamp,
                            "level": level,
                            "message": message
                        }
                    }
                    await websocket.send_json(log_packet)

                    # Save the log to the database 
                    db_log = MissionLog(
                        mission_id=mission_id,
                        timestamp=timestamp,
                        level=level,
                        message=message
                    )
                    session.add(db_log)
                    session.commit()

                    armed = [True, False]
                    modes = ["MISSION", "IDLE", "GUIDED", "RTH"]

                    status_packet = {
                        "type": "STATUS_UPDATE",
                        "timestamp": "...",
                        "payload": {
                            "armed": random.choice(armed),
                            "mode": random.choice(modes),
                            "health": "OK"
                        }
                    }

                    await websocket.send_json(status_packet)
                

                # Update Mission Duration every 100 ticks (10 seconds)
                if tick_count % 100 == 0 and mission_created_in_db:
                    current_duration = (datetime.datetime.now() - start_time).seconds
                    # Fetch the mission object again to update it
                    current_mission = session.get(Mission, mission_id)
                    if current_mission:
                        current_mission.duration_seconds = current_duration
                        session.add(current_mission)
                        session.commit()

                # Loop management
                tick_count += 1
                await asyncio.sleep(0.1) # 10Hz update rate total

        except Exception as e:
            print(f"WebSocket Error: {e}")
            try:
                await websocket.close()
            except:
                pass # Socket already closed
