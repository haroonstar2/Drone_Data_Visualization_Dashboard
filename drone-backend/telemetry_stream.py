import datetime, uuid, random, asyncio
from sqlmodel import Session
from fastapi import WebSocket

from .database import engine, Mission, MissionLog

from .bridge import drone_bridge

async def run_telemetry_loop(websocket: WebSocket):
    print("DEBUG: Real WebSocket Telemetry Loop Started")

    with Session(engine) as session:
        mission_id = str(uuid.uuid4())
        start_time = datetime.datetime.now()
        tick_count = 0
        
        # Fake weather for UI testing
        wind_speed = 5.0
        wind_heading = 90
        temperature = 25.0

        try:
            while True:

                live_data = drone_bridge.telemetry
                print(f"Telemetry Loop: {live_data}")
                
                # HIGH FREQUENCY TELEMETRY (Every tick: 0.1s)
                telemetry_packet = {
                    "type": "TELEMETRY_UPDATE",
                    "timestamp": datetime.datetime.now().isoformat(),
                    "payload": {
                        "latitude": live_data["lat"],       
                        "longitude": live_data["lon"],
                        "altitude": round(live_data["alt"], 1),
                        "speed": round(live_data["speed"], 1),
                        "heading": round(live_data["heading"]),
                        "battery": round(live_data["battery"], 1),
                    }
                }
                await websocket.send_json(telemetry_packet)

                # MEDIUM FREQUENCY STATUS (Every 5 ticks: 0.5s)
                if tick_count % 5 == 0:
                    status_packet = {
                        "type": "STATUS_UPDATE",
                        "timestamp": datetime.datetime.now().isoformat(),
                        "payload": {
                            "armed": live_data["armed"],
                            "mode": live_data["mode"],
                            "health": "OK"
                        }
                    }
                    await websocket.send_json(status_packet)

                # LOW FREQUENCY ENVIRONMENT (Every 50 ticks: 5.0s)
                if tick_count % 50 == 0:
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

                # Loop management
                tick_count += 1
                await asyncio.sleep(0.1) # 10Hz update rate total

        except Exception as e:
            print(f"WebSocket Error: {e}")
            try:
                await websocket.close()
            except:
                pass