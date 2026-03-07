"""Takes backend calls and translates them to Mavlink commands for the drone"""
from pymavlink import mavutil
import time

# pymavlink is interesting because the MAVLink messages live in a giant XML file and autogenerates functions for them
# .mav is the place where these functions are stored
# .mav and .mav.set_mode_send don't have a type since they technically don't exist yet ???

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

    def takeoff(self):
        """Tells the drone to takeoff."""
        print("DEBUG: Taking off...")

        parameters = [
            1, # Param 1: Minimum pitch
            0, # Param 2-3: Not used
            0, 
            0, # Param 4: Yaw angle
            0, # Param 5: Latitude
            0, # Param 6: Longitude
            15, # Param 7: Altitude
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

    def land(self):
        """Commands the drone to land exactly where it is."""
        self.set_mode('LAND')

    def return_to_home(self):
        """Commands the drone to return to its launch point."""
        self.set_mode('RTL')

    def activate_mission(self, waypoints, plan_id):
        """Placeholder for the waypoint logic"""
        print(f"DEBUG: Preparing to send {len(waypoints)} waypoints to drone...")

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
    drone_bridge.takeoff()

    print("Climbing... waiting 10 seconds...")
    time.sleep(10)

    print("Landing...")
    drone_bridge.land()
    
    print("Tests Done")