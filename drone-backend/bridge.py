"""Takes backend calls and translates them to Mavlink commands for the drone"""
from pymavlink import mavutil
import time
import threading

# pymavlink is interesting because the MAVLink messages live in a giant XML file and autogenerates functions for them
# .mav is the place where these functions are stored
# .mav and .mav.set_mode_send don't have a type since they technically don't exist yet ???

# The Golden Rule of pymavlink
#     - If it starts with MAV_CMD_ (like MAV_CMD_NAV_TAKEOFF), it is a MAVLink command so it should use the send_command function
#     - If it does NOT start with MAV_CMD_ (like MISSION_COUNT, PARAM_SET, or RC_CHANNELS_OVERRIDE), it is a native message
#       and must be called directly using self.drone.mav.[message_name]_send().

# recv_match() waits for and intercepts messages as they arrive

# DroneError is subclassed from Exception. Other error are subclassed from DroneError.
# Can use the more specific error if needed.
class DroneError(Exception):
    """Base class for exceptions in this module."""
    pass

class DroneConnectionError(DroneError):
    """Raised when the drone connection fails."""
    pass

class DroneTimeoutError(DroneError):
    """Raised when the drone connection times out."""
    pass

class DroneModeError(DroneError):
    """Raised when the drone fails to set the mode."""
    pass

class DroneBridge:
    def __init__(self, connection_string: str ='udpin:127.0.0.1:14550', heartbeat_timeout: int =15):

        self.drone = None
        self.timeout = heartbeat_timeout
        self.is_uploading = False

        self.telemetry = {
            "lat": 0.0,
            "lon": 0.0,
            "alt": 0.0,
            "speed": 0.0,
            "heading": 0.0,
            "battery": 0,
            "armed": False,
            "mode": "UNKNOWN"
        }

        print(f"DEBUG: Bridge connecting to drone at {connection_string}")

        try:
            self.drone = mavutil.mavlink_connection(connection_string)
        except Exception as e:
            print("ERROR: Failed to connect to drone")
            raise DroneConnectionError(
                f"Failed to create the MAVLink connection at {connection_string}: {e} "
            ) from e


        if not self.wait_for_heartbeat(timeout_s=self.timeout):
            raise DroneTimeoutError(
                f"No heartbeat recieve within {self.timeout}s on {connection_string}"
            )
        
        print("DEBUG: Connected to drone (heartbeat received)")

        print("DEBUG: Creating telemetry thread...")
        self.listener_thread = threading.Thread(target=self.telemetry_loop, daemon=True)
        self.listener_thread.start()

    def wait_for_heartbeat(self, timeout_s: float) -> bool:
        """
        Returns True if a heartbeat is received within the timeout, False otherwise.
        """
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            if self.drone.recv_match(type='HEARTBEAT', blocking=False):
                return True
            time.sleep(0.01)

        return False

    # Link to the MAVLink documentation for more information on recieving data
    # https://mavlink.io/en/mavgen_python/#:~:text=Receiving%20Messages,-%E2%80%8B
    def telemetry_loop(self):
        """Runs continuously in the background to catch incoming data."""
        print("DEBUG: Telemetry listener thread started.")

        while True:
            
            if self.is_uploading:
                time.sleep(0.1)
                continue

            # Grab the next message. 
            # Timeout ensures it doesn't freeze if the drone disconnects.
            msg = self.drone.recv_match(blocking=True, timeout=0.1)
            if not msg or msg.get_type() == 'BAD_DATA':
                continue

            msg_type = msg.get_type()

            # Catch GPS and Altitude
            if msg_type == 'GLOBAL_POSITION_INT':
                # ArduPilot sends coordinates as giant integers (e.g., 367468422). 
                # Divide by 1e7 to get standard decimal degrees (36.7468422).
                self.telemetry["lat"] = msg.lat / 1e7
                self.telemetry["lon"] = msg.lon / 1e7
                # Altitude is in millimeters, divide by 1000 for meters
                self.telemetry["alt"] = msg.relative_alt / 1000.0
                # Heading is sent in centidegrees (e.g., 9000 = 90 degrees)
                self.telemetry["heading"] = msg.hdg / 100.0

            elif msg_type == 'VFR_HUD':
                self.telemetry["speed"] = msg.groundspeed

            # Catch Battery Percentage
            elif msg_type == 'SYS_STATUS':
                self.telemetry["battery"] = msg.battery_remaining

            # Catch Armed Status and Flight Mode
            elif msg_type == 'HEARTBEAT':
                # Bitwise check to see if the motors are armed
                self.telemetry["armed"] = (msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED) != 0
                self.telemetry["mode"] = mavutil.mode_string_v10(msg)

    def send_command(self, command: int, params: list):
        """Sends a command to the drone"""
        print(f"DEBUG: Sending command: {command} with params: {params}")

        try:
            self.drone.mav.command_long_send(
                # Routing Headers
                self.drone.target_system,    # target_system: Network ID of the drone (usually 1)
                self.drone.target_component, # target_component: Which hardware piece executes this (usually 1 for Flight Controller)
                command,                     # command: The actual MAV_CMD ID (e.g., mavutil.mavlink.MAV_CMD_NAV_TAKEOFF)
                0,                           # confirmation: 0 = first time sending this command (1-255 is for retries)
                
                # Command Specific Parameters
                # MAVLink COMMAND_LONG requires exactly 7 parameter slots.
                # If a slot isn't used by then pass 0
                # Lookup table: https://mavlink.io/en/messages/common.html#mav_commands
                params[0],
                params[1],
                params[2], 
                params[3], 
                params[4], 
                params[5], 
                params[6],
            )
        except Exception as e:
            print(f"ERROR: Failed to send command: {command} with params: {params}")
            raise DroneError(f"Failed to send command: {command} with params: {params}") from e

    def set_mode(self, mode_name: str):
        """
        Changes the drone's flight mode using the human-readable name 
        (e.g., 'GUIDED', 'LOITER', 'RTL', 'LAND').
        """

        # Dictionary of integers to strings
        mode_map = self.drone.mode_mapping()
        
        if mode_name not in mode_map:
            print(f"ERROR: '{mode_name}' is not a valid ArduCopter mode")
            return
        

        mode_id = mode_map[mode_name]
        try:
            print(f"DEBUG: Setting mode to {mode_name} (ID: {mode_id})")
            self.drone.mav.set_mode_send(
                self.drone.target_system, # Netword ID of the drone
                mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED, # Ignore the MAVLink modes and use a custom ArduPilot mode
                mode_id # The actual mode ID to swtich to
            )
            print("DEBUG: Mode set successfully")
        except Exception as e:
            print(f"ERROR: Failed to set mode to {mode_name}")
            raise DroneModeError(f"Failed to set mode to {mode_name}: {e}") from e

    def arm(self):
        """Unlocks the drone's motors."""
        print("DEBUG: Arming motors...")

        parameters = [
            1, # Param 1: 1 = ARM
            0, # Param 2: 0 = Normal disarming (not forced)
            0, # Param 3-7: Not used
            0, 
            0, 
            0, 
            0, 
        ]

        self.send_command(mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM, parameters)

    def disarm(self):
        """Locks the drone's motors."""
        print("DEBUG: Disarming motors...")

        parameters = [
            0, # Param 1: 1 = DISARM
            0, # Param 2: 0 = Normal disarming (not forced)
            0, # Param 3-7: Not used
            0, 
            0, 
            0, 
            0, 
        ]
        self.send_command(mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM, parameters)

    def takeoff(self, altitude_m: float = 15.0):
        """Tells the drone to takeoff."""
        print("DEBUG: Taking off...")

        parameters = [
            1, # Param 1: Minimum pitch
            0, # Param 2-3: Not used
            0, 
            0, # Param 4: Yaw angle
            0, # Param 5: Latitude
            0, # Param 6: Longitude
            altitude_m, # Param 7: Altitude
        ]

        self.send_command(mavutil.mavlink.MAV_CMD_NAV_TAKEOFF, parameters)

    def start_mission(self):
        """Tells the drone to start executing its uploaded waypoints."""
        # AUTO mode tells ArduPilot to follow the uploaded mission
        self.set_mode('AUTO')
        print("DEBUG: Mission started (AUTO mode)")

    def pause_mission(self):
        """Stops the drone in place."""
        self.set_mode('LOITER')

    def clear_mission(self):
        """Wipes the flight plan from the drone's memory."""
        print("DEBUG: Wiping drone mission memory...")
        self.drone.mav.mission_clear_all_send(
            self.drone.target_system, 
            self.drone.target_component
        )


    def land(self):
        """Commands the drone to land exactly where it is."""
        self.set_mode('LAND')

    def return_to_home(self):
        """Commands the drone to return to its launch point."""
        self.set_mode('RTL')

    # https://mavlink.io/en/services/mission.html#:~:text=Upload%20a%20Mission%20to%20the%20Vehicle
    def activate_mission(self, waypoints: list, plan_id: str, home_lat: float, home_lon: float):
        """Uploads a list of waypoints to the drone using the MAVLink handshake."""

        if len(waypoints) == 0:
            print("ERROR: No waypoints to upload.")
            return False
        
        # Home waypoint at start and RTL at end
        wp_count = len(waypoints) + 2
        print(f"DEBUG: Preparing to upload {wp_count} waypoints for plan {plan_id}...")

        self.is_uploading = True

        try: 
            # Clearing missions: https://mavlink.io/en/services/mission.html#:~:text=Clear%20Missions,-%E2%80%8B
            # https://mavlink.io/en/messages/common.html#mav_commands:~:text=MISSION%5FCLEAR%5FALL
            print("DEBUG: Clearing old mission from drone memory...")
            self.drone.mav.mission_clear_all_send(
                self.drone.target_system, # Network ID of the drone
                self.drone.target_component, # Which hardware piece executes this (usually 1 for Flight Controller)
            )
            self.drone.recv_match(type='MISSION_ACK', blocking=True, timeout=5)

            # Telling the drone how many waypoints to expect
            print(f"DEBUG: Informing drone to expect {wp_count} waypoints...")
            self.drone.mav.mission_count_send(
                self.drone.target_system, 
                self.drone.target_component, 
                wp_count
            )

            for i in range(wp_count):

                msg = self.drone.recv_match(type=['MISSION_REQUEST_INT', 'MISSION_REQUEST'], blocking=True, timeout=5)
                
                if not msg:
                    print(f"ERROR: Drone stopped responding during upload at waypoint {i}")
                    return False
                
                # The drone tells us exactly which waypoint it wants right now
                # Sequence 0 is a new home waypoint. Sequence 1+ are the flight plan
                seq = msg.seq 
                print(f"DEBUG: Drone requested waypoint {seq}. Sending...")

                # Uploading a mission to drone
                #https://mavlink.io/en/messages/common.html#MISSION_ITEM_INT:~:text=MISSION%5FITEM%5FINT,-%2873
                # https://mavlink.io/en/services/mission.html#:~:text=Upload%20a%20Mission%20to%20the%20Vehicle
                if seq == 0:
                    print(f"DEBUG: Drone requested seq 0. Setting Home to {home_lat}, {home_lon}")
                    self.drone.mav.mission_item_int_send(
                        self.drone.target_system, self.drone.target_component, seq,                                               
                        mavutil.mavlink.MAV_FRAME_GLOBAL, # Home is an absolute global frame
                        mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,              
                        0, 1, 0, 0, 0, 0,                                        
                        int(home_lat * 1e7), 
                        int(home_lon * 1e7), 
                        0.0 # Ground level
                    )

                elif seq == wp_count - 1:
                    print(f"DEBUG: Drone requested seq {seq}. Appending automatic RTL command.")
                    self.drone.mav.mission_item_int_send(
                        self.drone.target_system, self.drone.target_component, seq,                                               
                        mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT, 
                        mavutil.mavlink.MAV_CMD_NAV_RETURN_TO_LAUNCH, # The MAVLink command to go home!
                        0, 1, 0, 0, 0, 0,                                        
                        0, 0, 0.0 # Coordinates are ignored for RTL, it just uses Sequence 0
                    )

                else:
                    wp = waypoints[seq - 1] 
                    print(f"DEBUG: Sending flight plan item {seq - 1}...")
                    self.drone.mav.mission_item_int_send(
                        self.drone.target_system,
                        self.drone.target_component,
                        seq,                                               # Sequence number
                        mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT, # Frame: Relative to home altitude
                        mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,              # Command: Fly to coordinate
                        0,                                                 # Current (0 = false)
                        1,                                                 # Autocontinue (1 = true)
                        0, 0, 0, 0,                                        # Params 1-4 extra stuff
                        int(wp.latitude * 1e7),                            # X: Latitude (Scaled integer)
                        int(wp.longitude * 1e7),                           # Y: Longitude (Scaled integer)
                        float(wp.altitude)                                 # Z: Altitude (Meters)
                    )
                

            ack = self.drone.recv_match(type='MISSION_ACK', blocking=True, timeout=5)
            
            if ack and ack.type == mavutil.mavlink.MAV_MISSION_ACCEPTED:
                print("DEBUG: Mission upload handshake COMPLETE!")
                return True
            else:
                print(f"ERROR: Mission upload failed or rejected by drone. ACK: {ack}")
                return False
            
        finally:
            self.is_uploading = False

# Instantiate a single global bridge object to use in the routers
drone_bridge = DroneBridge()

# Isolated testing block. Only runs when file is executed directly
if __name__ == "__main__":
    print("Starting Bridge Test")
        
    print("Testing GUIDED mode...")
    drone_bridge.set_mode('GUIDED')
    time.sleep(3)

    print("Testing LOITER (Pause) mode...")
    drone_bridge.pause_mission()
    time.sleep(3)
    
    print("Testing RTL (Return to Home) mode...")
    drone_bridge.return_to_home()
    time.sleep(3)

    print("Testing GUIDED mode...")
    drone_bridge.set_mode('GUIDED')
    time.sleep(3)

    print("Arming motors...")
    drone_bridge.arm()
    time.sleep(2)

    print("Starting Flight Tests")
    print("Taking off to 15 meters...")
    drone_bridge.takeoff(15)

    print("Climbing... waiting 10 seconds...")
    time.sleep(10)

    print("Landing...")
    drone_bridge.land()

    class DummyWaypoint:
        def __init__(self, lat, lon, alt):
            self.latitude = lat
            self.longitude = lon
            self.altitude = alt

    test_waypoints = [
        DummyWaypoint(36.738500, -119.787125, 20.0), # Point 1: Fly North
        DummyWaypoint(36.738500, -119.786000, 20.0), # Point 2: Fly East
        DummyWaypoint(36.737797, -119.786000, 20.0)  # Point 3: Fly South
    ]

    upload_success = drone_bridge.activate_mission(
        test_waypoints, 
        plan_id="FRESNO_TEST",
        home_lat=36.737797,  
        home_lon=-119.787125 
    )

    if upload_success:
        print("PRE-FLIGHT SEQUENCE")
        drone_bridge.set_mode('GUIDED')
        time.sleep(2)
        
        drone_bridge.arm()
        time.sleep(2)
        
        # Take off to 20 meters
        drone_bridge.takeoff(20.0) 
        
        print("Climbing to altitude... waiting 10 seconds...")
        time.sleep(10)
        
        print("STARTING AUTONOMOUS ROUTE...")
        drone_bridge.start_mission() 

        print("Monitoring Telemetry:")
        for _ in range(15): # Monitor for 30 seconds
            live = drone_bridge.telemetry
            print(f"Lat: {live['lat']:.6f} | Lon: {live['lon']:.6f} | Alt: {live['alt']:.1f}m | Speed: {live['speed']:.1f} m/s | Heading: {live['heading']:.0f}°")
            time.sleep(2)
            
        print("RETURNING HOME")
        drone_bridge.return_to_home() # Switches to RTL mode
        time.sleep(5)
    
    print("Tests Done")