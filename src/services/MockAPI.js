import { useDroneStore } from "../store";

// Dummy command to send command to backend
export const sendCommand = (commandName, payload = {}) => {
  console.log(`[MOCK API] Sending command: ${commandName}`, payload);

  // Simulate a successful response after a short delay
  return new Promise((resolve) => {

    setTimeout(() => {
      resolve ({
        type: "COMMAND_RESPONSE",
        status: "success",
        message: `Command '${commandName}' successfully executed.`,
        timestamp: new Date().toISOString(),
        commandId: `cmd_${Math.random().toString(16).slice(2)}`, // Random Id
        data: {
          ...payload
        }
      });
    }, 1000); // Delay to simulate network delay
  });
};

// Fake settings request
export const getSettings = () => {
  console.log("[MOCK API] Fetching settings...");
  // Return fake, hardcoded settings data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: "SETTINGS_DATA",
        status: "success",
        message: "Settings successfully retrieved",
        timestamp: new Date().toISOString(),
        commandId: `cmd_${Math.random().toString(16).slice(2)}`, // Random Id
        data: {
          system: {units: "metric", mapDisplay: "satellite"},
          drone: {rthAltitude: 100, geofenceEnabled: true}
        }
      });
    }, 1000); // Delay to simulate network delay
  });
};

// Dummy command to save current settings to backend
export const saveSettings = (newSettings) => {

  console.log("[MOCK API] Saving settings...", newSettings);

  return new Promise((resolve) => {
    setTimeout(()=>{
        resolve ({
          type: "SETTINGS_UPDATED",
          status: "success",
          timestamp: new Date().toISOString(),
          message: "Settings saved successfully",
          data: newSettings
        });
    }, 1000);
  });
};

// Fake request for all plans. Each plan has a unique Id to identify and request it
export const getPlanList = () => {
  console.log("[MOCK API]: Fetching flight plan list...");
  
  console.log("[MOCK API]: Done fetching flight plan list");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve ({
        type: "FLIGHT_PLAN_LIST",
        status: "success",
        timestamp: new Date().toISOString(),
        data: {
          // Array of all plans 
          items: [
            {
              id: "fp_123454",
              name: "Field Survery Alpha 1",
              description: "200ft alititude grid pattern",
              waypointCount: 3,
              lastModified: new Date().toISOString()
            },
            {
              id: "fp_123456",
              name: "Field Survery Alpha 2",
              description: "200ft alititude grid pattern",
              waypointCount: 3,
              lastModified: new Date().toISOString()
            },
            {
              id: "fp_123457",
              name: "Field Survery Alpha 3",
              description: "200ft alititude grid pattern",
              waypointCount: 3,
              lastModified: new Date().toISOString()
            }
            // More plans like this one
          ]
        }
      });
    }, 1000);
  });
};

// Request flight plan details. 
export const getPlanDetails = (planId) => {
  console.log(`[MOCK API]: Fetching details for plan: ${planId}`);

  console.log(`[MOCK API]: Done fetching details for plan: ${planId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: "FLIGHT_PLAN_DATA",
        status: "success",
        timestamp: new Date().toISOString(),
        data: {
          id: planId,
          name: "Field Survey Alpha (retrieved)",
          description: "200ft alititude grid pattern",
          lastModified: new Date().toISOString(),
          waypoints: [
            { order: 1, latitude: 36.7468, longitude: -119.7726, altitude: 60, action: 'take_photo' },
            { order: 2, latitude: 36.7470, longitude: -119.7726, altitude: 60, action: 'take_photo' },
            { order: 3, latitude: 36.7470, longitude: -119.7720, altitude: 60, action: 'hover_5_sec' }
          ]
        }
      });
    },1000);
  });
};

// Get log history
export const getMissionHistory = () => {
  console.log("[MOCK API]: Fetching mission history...");

  console.log("[MOCK API]: Finished fetching mission history");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'MISSION_LIST',
        status: 'success',
        data: {
          items: [
            { id: 'm_001', name: 'Test Flight 1', date: '2025-09-20', duration_min: 15, logCount: 45 },
            { id: 'm_002', name: 'Mapping Run A', date: '2025-09-22', duration_min: 45, logCount: 152 },
            { id: 'm_003', name: 'Perimeter Check', date: '2025-09-24', duration_min: 22, logCount: 78 }
          ]
        }
      });
    }, 1000);
  });
};

export const getMissionLogs = (missionId) => {
  console.log(`[MOCK API]: Requesting mission: ${missionId}`);

  const fakeLogs = [
    { timestamp: '2025-09-20T10:00:01Z', level: 'INFO', message: `Mission ${missionId} started.` },
    { timestamp: '2025-09-20T10:00:05Z', level: 'INFO', message: 'Takeoff complete.' },
    { timestamp: '2025-09-20T10:07:22Z', level: 'INFO', message: 'Waypoint 1 reached.' },
    { timestamp: '2025-09-20T10:15:00Z', level: 'WARN', message: 'Low battery, initiating RTH.' },
    { timestamp: '2025-09-20T10:17:00Z', level: 'INFO', message: 'Landing complete.' }
  ];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        type: 'HISTORICAL_LOGS',
        status: 'success',
        data: {
          id: missionId,
          logCount: fakeLogs.length,
          logs: fakeLogs
        }
      });
    },1000);
  });
};
window.getMissionLogs = getMissionLogs;

// Live simulation to send mock data to the info tabs
export const startSimulation = () => setInterval(() => {
  console.log("[MOCK API] Receiving fake telemetry...");
  // Return fake, telemetry
  const telemetry = {...useDroneStore.getState().telemetry};

  // Loop through each item and modify it slightly
  for(let key in telemetry) {

    let value = telemetry[key]
    // Random change to modify each value
    let change = (Math.random() - 0.5) * 5

    switch(key) {
      case "longitude":
      case "latitude":
        telemetry[key] += change * 0.0001;
        telemetry[key] = Math.round(telemetry[key] * 10000) / 10000;
        break;
      case "altitude":
      case "speed":
        telemetry[key] = Math.max(0, value + change);
        telemetry[key] = Math.round(telemetry[key] * 10) / 10;
        break;
      case "battery":
        telemetry[key] = Math.max(0,Math.min(100, value - Math.abs(change * 0.1)));
        telemetry[key] = Math.round(telemetry[key]);
        break;
      case "heading":
        telemetry[key] = (value + change) % 360;
        if(telemetry[key] < 0) telemetry[key] += 360;
        telemetry[key] = Math.round(telemetry[key]);
        break;
    }
  }
  console.log(telemetry)
  useDroneStore.getState().updateTelemetry(telemetry);

  // Send a log message ocassionally
  if(Math.random() < 0.5) {
    const log = {
      type: "MISSION_LOG",
      timestamp: new Date().toISOString(),
      data: {
        level: "INFO",
        message: `Drone performing routine check at ${telemetry.altitude.toFixed(1)}m`
      }
    };
    console.log("[MOCK API] Pushing new mission log");
    useDroneStore.getState().addMissionLog(log);
  }

  // Update the status occasionally
  if(Math.random() < 0.1) {
    const newStatus = {
      armed: true,
      mode: "MISSION",
      health: "OK"
    };
    console.log("[MOCK API] Pushing new status update");
    useDroneStore.getState().updateStatus(newStatus);
  }


}, 10000);