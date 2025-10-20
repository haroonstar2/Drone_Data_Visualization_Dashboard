import { useDroneStore } from "../store";

export const sendCommand = (commandName, payload = {}) => {
  console.log(`[MOCK API] Sending command: ${commandName}`, payload);
  // Simulate a successful response after a short delay
  return new Promise(resolve => setTimeout(() => {
    resolve({ status: "success", message: `Command '${commandName}' received.` });
  }, 300));
};

export const getSettings = () => {
  console.log("[MOCK API] Fetching settings...");
  // Return fake, hardcoded settings data
  return new Promise(resolve => setTimeout(() => {
    resolve({ units: "metric", rthAltitude: 100, geofenceEnabled: true });
  }, 200));
};


export const startTelemetrySimulation = () => setInterval(() => {
    console.log("[MOCK API] Receiving fake telemetry...");
  // Return fake, telemetry
  const telemetry = {...useDroneStore.getState().telemetry};

  for(let key in telemetry) {

    let value = telemetry[key]

    let change = (Math.random() - 0.5) * 2

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
}, 1000);