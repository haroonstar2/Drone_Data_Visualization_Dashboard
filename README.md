# Web-Based Autonomous Drone Ground Control Station (GCS)
## Overview

A full-stack, real-time web application designed to command, monitor, and manage autonomous drones. This project serves as a complete Ground Control Station (GCS), bridging a modern React frontend with ArduPilot flight controllers via a custom FastAPI/MAVLink hardware abstraction layer.

Rather than relying on basic HTTP polling, this architecture utilizes a multi-threaded Python backend to intercept high-frequency UDP telemetry packets from the drone, streaming live coordinates, altitude, and battery metrics to an interactive web dashboard via WebSockets.


## Tech Stack

**Frontend** (User Interface & Mapping)

- React & Vite: Fast, modern UI rendering.
- Zustand: Lightweight, centralized state management.
- React-Leaflet: Interactive map rendering for live telemetry and waypoint plotting.

**Backend** (API & Database)

- *FastAPI*: High-performance asynchronous REST API.
- *WebSockets*: Bidirectional, low-latency telemetry streaming (10Hz).
- *SQLModel (SQLite)*: Object-Relational Mapping (ORM) for persisting flight plans, mission logs, and system settings.

**Robotics & Systems** (Hardware Abstraction)

- *PyMAVLink*: Raw MAVLink micro-protocol translation and UDP networking.
- *ArduPilot SITL*: Real-world physics engine and flight controller simulation.
- *Python Threading*: Concurrent background loops for non-blocking telemetry interception.

**Features**

- *Live Telemetry Dashboard*: Monitors real-time drone metrics over a continuous WebSocket connection.
- *Interactive Mission Planning*: Click-and-drag map interface to plot multi-waypoint autonomous flight routes.
- *Reliable Protocol Handshakes*: Utilizes MAVLink request/acknowledge protocols to safely upload multi-waypoint coordinates
- *Automated Pre-Flight Sequences*: A single "Start Mission" command safely handles mode switching (GUIDED), motor arming, safe-altitude takeoff, and autonomous route execution (AUTO).
- *Persistent Storage*: Saves custom home coordinates, system settings, and complex flight plans to an SQLite database for rapid redeployment.

## Installation 

**Prerequisites**
- Node.js (v16+ recommended)
- Python (3.10+ recommended)
- ArduPilot SITL (For simulating the flight controller environment)

**Setup the Backend**

Navigate to the backend directory, set up the virtual environment, and install the dependencies

```bash
cd drone-backend
python -m venv venv

# Activate the virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install fastapi uvicorn sqlmodel pymavlink websockets
```
**Setup the Frontend**

Navigate to the frontend directory and install the Node packages:

```bash
cd drone-frontend
npm install
```

**Usage**

To run the full stack, three separate processes in three different terminal windows need to be started.

1. Start the Drone Brain (ArduPilot SITL)
Boot up the simulated flight controller with a starting GPS location.

```
# Change latitude and longitude to the desired starting location
sim_vehicle.py -v ArduCopter -l *latitude*, *longitude*,0,0
```
2. Start the Backend API & Hardware Bridge
Ensure the virtual environment is active, then start the FastAPI development server.

```
cd drone-backend
fastapi dev main.py
```

(The backend will connect to the SITL UDP port 14550 and begin the telemetry thread).

3. Start the Frontend Dashboard
Boot up the React application.
```
cd drone-frontend
npm run dev
```

4. Fly a Mission

    Open a browser to http://localhost:5173.

    Open the Flight Plans panel and create a new route by clicking on the map.

    Click Activate to perform the MAVLink handshake and upload the coordinates to the drone's memory.

    Click Start Mission to initiate the automated pre-flight takeoff sequence.

    Watch the drone execute the path live on the dashboard.

### Notes for Developers

If developers ever want to run this on a physical drone (like a Pixhawk flight controller with a Raspberry Pi companion computer), simply change the connection string in bridge.py from udpin:127.0.0.1:14550 to the physical serial port (e.g., /dev/ttyUSB0 or /dev/serial0). The backend will communicate with the real drone exactly as it does the simulation.
