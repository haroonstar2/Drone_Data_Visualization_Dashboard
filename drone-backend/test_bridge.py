from pymavlink import mavutil

print("Listening for MAVProxy broadcast on UDP 14550...")

# 1. Listen to the UDP broadcast coming from the simulator
drone = mavutil.mavlink_connection('udpin:127.0.0.1:14550')

# 2. Wait for the drone to send a heartbeat
drone.wait_heartbeat()
print("Heartbeat received! Connection successful.")

# 3. Request some basic telemetry
print(f"Drone System ID: {drone.target_system}")
print(f"Drone Component ID: {drone.target_component}")

mode_map = drone.mode_mapping()
print(f"Node Map2: {mode_map}")