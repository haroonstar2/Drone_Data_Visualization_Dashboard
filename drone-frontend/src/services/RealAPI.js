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
  console.log(config.body);
  
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

//  PLACEHOLDERS FOR REAL-TIME (WEBSOCKETS)
export const startSimulation = () => {
  console.warn("[RealAPI] startSimulation called, but real-time data requires WebSockets implementation.");
  // This would return the WebSocket connection object or cleanup function.
  return null;
};