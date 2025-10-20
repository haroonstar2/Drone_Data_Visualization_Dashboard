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
