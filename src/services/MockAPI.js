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

// Fake Plan request
export const getPlan = () => {
  console.log("[MOCK API]: Getting drone plan");
  return (
    <div>Yo</div>
  );
  
};

// Live simulation to send mock data to the info tabs
export const startTelemetrySimulation = () => setInterval(() => {
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
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Drone performing routine check at ${telemetry.altitude.toFixed(1)}m`
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