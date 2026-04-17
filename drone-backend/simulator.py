import datetime, uuid, random, math, asyncio
from sqlmodel import Session
from .database import engine, Mission, MissionLog

class DroneSimulator:
    def __init__(self):
        self.reset()

        # Drone settings
        self.rth_altitude = 100.0
        self.geofence_enabled = True
        self.geofence_radius = 5000.0 # Meters from home
        self.home_lat = 36.737797
        self.home_lon = -119.787125

        # Log buffer
        self.pending_logs = []
    
    def update_settings(self, settings_data):
        # Called by the API to update physics constraints
        self.rth_altitude = settings_data.rthAltitude
        self.geofence_enabled = settings_data.geofenceEnabled
        self.home_lat = settings_data.homeLatitude
        self.home_lon = settings_data.homeLongitude
        print(f"Simulator: Settings Updated. RTH set to {self.rth_altitude}m")

    def reset(self):
        print("DEBUG: DroneSimulator Instance Created")
        # Shared state accessible by several files
        self.lat = 36.737797
        self.lon = -119.787125
        self.alt = 0.0
        self.heading = 0.0
        self.speed = 0.0
        self.battery = 100.0
        
        # Flight Logic State
        self.active_plan_id = None
        self.active_waypoints = []
        self.saved_mission = []
        self.current_wp_index = -1
        self.is_flying = False
        self.is_returning_home = False
        print("Simulator: Reset to Home State.")

    def activate_mission(self, waypoints, plan_id=None):
        # Called by the API to load mission data but do not start flying
        self.active_plan_id = plan_id
        self.active_waypoints = waypoints
        self.current_wp_index = 0
        self.is_flying = False 
        print(f"Simulator: Mission {plan_id} loaded with {len(waypoints)} waypoints. Waiting for Start command.")

    def start_mission(self):
        print(f"DEBUG: COMMAND Received on Instance ID: {id(self)}")
        if len(self.active_waypoints) > 0:
            self.is_flying = True
            print("Simulator: Mission Started.")
            self.pending_logs.append(("INFO", "Mission Started."))
        else:
            print("Simulator: No mission loaded to start.")

    def return_to_home(self):
        # If a real mission loaded (and aren't already going home), save a backup
        if not self.is_returning_home and len(self.active_waypoints) > 0:
            self.saved_mission = self.active_waypoints
            print(f"Simulator: Stashed mission with {len(self.saved_mission)} waypoints.")

        # Create a temporary "Home" waypoint object
        class HomeWaypoint:
            latitude = 36.737797
            longitude = -119.787125
            altitude = 50.0 # Return at a safe altitude
            
        # Home as the only active waypoint
        self.active_waypoints = [HomeWaypoint()]
        self.current_wp_index = 0
        self.is_flying = True
        self.is_returning_home = True
        print("Simulator: RTH Initiated. Flying to Home coordinates.")

    def update_physics(self, dt_seconds: float):
        # Called by the loop to move the drone
        if not self.is_flying or self.current_wp_index >= len(self.active_waypoints):
            # Idle behavior
            self.speed = 0.0
            return
        
        target = self.active_waypoints[self.current_wp_index]

        # Calculate distance to travel
        distance = self.haversine(target.latitude, target.longitude, self.lat, self.lon) * 1000 # Km to m

        # Check Arrival (5m tolerance)
        if distance < 5.0:
            self.current_wp_index += 1
            self.pending_logs.append(("INFO", f"Arrived at Waypoint {self.current_wp_index}"))

            if self.current_wp_index >= len(self.active_waypoints):
                self.is_flying = False

                if self.is_returning_home:
                    print("Simulator: Arrived at Home.")
                    self.pending_logs.append(("INFO", "Arrived at Home."))
                    
                    # Restore the original mission
                    if len(self.saved_mission) > 0:
                        self.active_waypoints = self.saved_mission
                        self.saved_mission = [] # Clear backup
                        self.current_wp_index = 0 # Reset index to start
                        print("Simulator: Original Mission Reloaded. Ready to Start.")
                    
                    self.is_returning_home = False
                else:
                    print("Mission Complete. Disarming.")
                    self.pending_logs.append(("INFO", "Mission Complete. Disarming."))



            return
        
        cruise_speed = 15.0 
        self.speed = min(cruise_speed, distance) # Slow down if we are close
        move_dist = self.speed * dt_seconds
        
        ratio = move_dist / distance

        # NewPos = Current + (Diff * Ratio)
        self.lat += (target.latitude - self.lat) * ratio
        self.lon += (target.longitude - self.lon) * ratio
        
        # Update Altitude
        alt_diff = target.altitude - self.alt
        self.alt += alt_diff * 0.1 

        # Calculate Headingby using atan2 to find the angle between current point and target
        dLon = math.radians(target.longitude - self.lon)
        y = math.sin(dLon) * math.cos(math.radians(target.latitude))
        x = math.cos(math.radians(self.lat)) * math.sin(math.radians(target.latitude)) \
            - math.sin(math.radians(self.lat)) * math.cos(math.radians(target.latitude)) * math.cos(dLon)
        self.heading = (math.degrees(math.atan2(y, x)) + 360) % 360

        # Drain Battery
        self.battery = max(0, self.battery - 0.005)
        if 19.9 < self.battery < 20.0: # Catch it exactly once as it crosses down
             self.pending_logs.append(("WARN", "Low Battery Warning (20%)"))

        if self.geofence_enabled and self.is_flying:
            dist_home = self.haversine(self.lat, self.lon, self.home_lat, self.home_lon) * 1000
            if dist_home > self.geofence_radius:
                self.pending_logs.append(("WARN", "Geofence breached! Triggering RTH."))
                self.return_to_home()

    def haversine(self, lat1, lon1, lat2, lon2):
        # This function was taken from GeeksforGeeks
        # https://www.geeksforgeeks.org/dsa/haversine-formula-to-find-distance-between-two-points-on-a-sphere/#

        # distance between latitudes
        # and longitudes
        dLat = (lat2 - lat1) * math.pi / 180.0
        dLon = (lon2 - lon1) * math.pi / 180.0

        # convert to radians
        lat1 = (lat1) * math.pi / 180.0
        lat2 = (lat2) * math.pi / 180.0

        # apply formulae
        a = (pow(math.sin(dLat / 2), 2) + 
            pow(math.sin(dLon / 2), 2) * 
                math.cos(lat1) * math.cos(lat2));
        rad = 6371
        c = 2 * math.asin(math.sqrt(a))
        return rad * c
    
drone_sim = DroneSimulator()

async def run_telemetry_loop(websocket):

    print("DEBUG: Telemetry Loop Started")

    print(f"DEBUG: LOOP Running on Instance ID: {id(drone_sim)}")

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
        
        # Environment state (slow updates)
        wind_speed = 5.0
        wind_heading = 90
        temperature = 25.0

        # Simulation loop counters
        tick_count = 0

        try:
            while True:

                # Ask the class to update its position based on the active plan
                drone_sim.update_physics(0.1)

                # Flush pending logs to the frontend
                while len(drone_sim.pending_logs) > 0:
                    level, msg = drone_sim.pending_logs.pop(0) 
                    timestamp = datetime.datetime.now().isoformat()
                    
                    # Send to Frontend
                    log_packet = {
                        "type": "NEW_LOG", 
                        "timestamp": timestamp,
                        "payload": { "timestamp": timestamp, "level": level, "message": msg }
                    }
                    await websocket.send_json(log_packet)
                    
                    # Save to Database
                    ensure_mission_exists()
                    db_log = MissionLog(mission_id=mission_id, timestamp=timestamp, level=level, message=msg)
                    session.add(db_log)
                    session.commit()

                # Save the mission at 20 ticks
                if tick_count == 20: 
                    ensure_mission_exists()

                # HIGH FREQUENCY TELEMETRY (Every tick: 0.1s)
                telemetry_packet = {
                    "type": "TELEMETRY_UPDATE",
                    "timestamp": datetime.datetime.now().isoformat(),
                    "payload": {
                        "latitude": drone_sim.lat,       
                        "longitude": drone_sim.lon,
                        "altitude": round(drone_sim.alt, 1),
                        "speed": round(drone_sim.speed, 1),
                        "heading": round(drone_sim.heading),
                        "battery": round(drone_sim.battery, 1),
                    }
                }
                await websocket.send_json(telemetry_packet)

                # MEDIUM FREQUENCY STATUS (Every 5 ticks: 0.5s)
                if tick_count % 5 == 0:
                    status_packet = {
                        "type": "STATUS_UPDATE",
                        "timestamp": datetime.datetime.now().isoformat(),
                        "payload": {
                            "armed": drone_sim.is_flying,
                            "mode": "MISSION" if drone_sim.is_flying else "IDLE",
                            "health": "OK"
                        }
                    }
                    await websocket.send_json(status_packet)


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
