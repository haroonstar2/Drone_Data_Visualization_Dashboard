const API_BASE_URL = '/api/v1';

/*
Generic helper function for making fetch requests.
Handles headers, JSON parsing, and basic error checking.
 */
async function request(endpoint, options = {}) {
  // Set up default headers for JSON
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Merge default headers with any custom headers passed in options
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };  

  console.log(`[RealAPI] ${config.method || 'GET'} request to: ${API_BASE_URL}${endpoint}`);
  console.log(`[RealAPI] Request body: ${config.body}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Check for HTTP error codes
    if (!response.ok) {
      // Try to parse error message from server
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage = errorBody.message || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Parse successful JSON response
    // This returns the whole payload rather than just the data
    const data = await response.json();
    console.log('[RealAPI] Success:', data);
    return data;

  } catch (error) {
    console.error('[RealAPI] Request failed:', error.message);
    // Re-throw so the calling component can handle it in its try/catch block
    throw error;
  }
}

export const sendCommand = (commandName, commandData = {}) => {
  const payload = {
    name: commandName,
    ...commandData,
    // Map frontend "hover_duration" to the expected "hoverDuration" alias, if it exists
    ...(commandData.hover_duration && { hoverDuration: commandData.hover_duration })
  };

  console.log(payload);
  
  return request('/command', {
    method: 'POST',
    body: JSON.stringify({
      command: payload
    }),
  });
};

export const getSettings = () => {
  return request('/settings', { method: 'GET' });
};

export const saveSettings = (newSettings) => {
  return request('/settings', {
    method: 'POST',
    body: JSON.stringify(newSettings),
  });
};

// Flight Plans 
export const getPlanList = () => {
  return request('/plans', { method: 'GET' });
};

export const getPlanDetails = (planId) => {
  // Insert the ID into the URL path
  return request(`/plans/${planId}`, { method: 'GET' });
};

export const saveFlightPlan = (planData) => {
  
  const wrappedBody = {
    plan: planData
  };

  return request('/plans', {
    method: 'POST',
    body: JSON.stringify(wrappedBody),
  });
};

// Mission History
export const getMissionHistory = () => {
  return request('/missions', { method: 'GET' });
};

export const getMissionLogs = (missionId) => {
  // Insert the ID into the URL path
  return request(`/missions/${missionId}`, { method: 'GET' });
};

export const startSimulation = (actions) => {

  const host = window.location.host;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const WS_FULL_URL = `${protocol}//${host}/ws/telemetry`;

  const { updateTelemetry, addMissionLog, updateEnvironment, updateStatus } = actions;
  
  console.log(`[RealAPI] Connecting to WebSocket: ${WS_FULL_URL}`);
  const socket = new WebSocket(WS_FULL_URL);

  socket.onopen = () => {
    console.log('[RealAPI] WebSocket Connected.');
    addMissionLog({ timestamp: new Date().toISOString(), level: 'INFO', message: 'Connected to live stream.' });
  };

  socket.onmessage = (event) => {
    try {
        const message = JSON.parse(event.data);

        // Switch based on the "type" header sent from Python
        switch (message.type) {
            case 'TELEMETRY_UPDATE':
                // Payload is { latitude, longitude, altitude, ... }
                updateTelemetry(message.payload);
                break;
            
            case 'ENVIRONMENT_UPDATE':
                 // Payload is { windSpeed, temperature, ... }
                 updateEnvironment(message.payload);
                 break;

            case 'NEW_LOG':
                // Payload is { timestamp, level, message }
                addMissionLog(message.payload);
                break;

            case 'STATUS_UPDATE':
                // Payload is { armed, mode, health }
                updateStatus(message.payload);
                break;
            default:
                console.warn('[RealAPI] Unknown message type:', message.type);
        }

    } catch (err) {
        console.error('[RealAPI] Message parse error:', err);
    }
  };

  socket.onclose = () => {
    console.log(`[RealAPI] WebSocket disconnected.`);
  };

  // Cleanup function
  return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
      }
  };
};