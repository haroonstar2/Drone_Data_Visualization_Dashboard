import './ControlButtons.css';
import { useDroneStore } from '../../store';
import { sendCommand, saveFlightPlan } from '../../services/RealAPI';

function ControlButtons() {

  const appMode = useDroneStore((state) => state.appMode);
  const setAppMode = useDroneStore((state) => state.setAppMode);
  const toggleStoreLogs = useDroneStore((state) => state.toggleStoreLogs);
  const storeLog = useDroneStore((state) => state.settings.system.storeLog);
  const activeWaypoints = useDroneStore((state) => state.activeWaypoints);
  const clearWaypoints = useDroneStore((state) => state.clearWaypoints);
  
  const handleCommand = async (commandName) => {
    console.log(`Attempting to send command: ${commandName}`);

    try {
      // Simple UI calls. Complete them then end early
      if (commandName === "Start/End Logging") {
          toggleStoreLogs();
          console.log("Log storing toggled locally.");
          return;
      }
      if (commandName === "New Waypoint") {
          const newMode = appMode === 'adding_waypoint' ? 'idle' : 'adding_waypoint';
          setAppMode(newMode);
          console.log(`Local app mode set to: ${newMode}`);
          return;
      }

      // At this point its a network call instead
      let apiCommandType = "";
      // Default payload is empty unless specified otherwise
      let apiPayload = {};

      switch(commandName) {
        case "Hover":
          apiCommandType = "HOVER";
          apiPayload = { hover_duration: -1 }; // Hover indefinitely
          break;

        case "Land":
          apiCommandType = "LAND";
          break;

        case "Return to Home":
          apiCommandType = "RETURN_TO_HOME";
          break;

        default:
          // For buttons not fully wired up
          console.warn(`Unknown UI command "${commandName}", sending test ping.`);
          apiCommandType = "TEST_COMMAND";
          apiPayload = { original_button_click: commandName };
          break;
      }

      console.log(`Sending API Command: [${apiCommandType}]`, apiPayload);
      const response = await sendCommand(apiCommandType, apiPayload);
      console.log(`[API Success] ${apiCommandType}:`, response);
      alert(response.message);

    } catch (error) {
      console.error(`Error sending command ${commandName}:`, error);
      alert(`Failed to send command ${commandName}: ${error.message}.`);
    }
  };

  const handleAddWaypoint = () => {
    if (appMode !== 'adding_waypoint') {
      setAppMode('adding_waypoint'); // Set mode to add a waypoint
    }
    else {
      setAppMode('PLANNING')
    }
    // MapView will handle the rest
  };

  const handleSavePlan = async () => {
    const name = prompt("Enter a name for your flight plan:", "My New Plan");
    const description = prompt("Enter a description of your flight plan:");
    
    if (name) {
      const cleanWaypoints = activeWaypoints.map(wp => {
        // Start with the base properties
        const cleanWp = {
          id: String(wp.id),
          latitude: wp.latitude,
          longitude: wp.longitude,
          altitude: wp.altitude,
          action: wp.action
        };
        
        // Only include hoverDuration if the action is HOVER_T
        if (wp.action === "HOVER_T") {
            // Use existing duration or default to 5 if it's missing
            cleanWp.hoverDuration = wp.hoverDuration || 5;
        }
        
        return cleanWp;
      });

      const planData = {
        name: name,
        description: description || "",
        waypoints: cleanWaypoints
      };
      
      try {
        const response = await saveFlightPlan(planData);
        alert(response.message);

        // Go back to idle mode.
        setAppMode('idle');

      } catch (error) {
        alert(`Failed to save plan: ${error}`);
      }
    }
  };

  const handleCancelPlan = () => {
    if (window.confirm("Are you sure? All unsaved waypoints will be lost.")) {
      setAppMode('idle');
      clearWaypoints();
    }
  };


  if (appMode === 'PLANNING' || appMode === 'adding_waypoint') {
    return (
      <div className="control-buttons planning">
        <button 
          className={appMode === 'adding_waypoint' ? 'active' : ''}
          onClick={handleAddWaypoint}
        >
          Add Waypoint
        </button>
        <button className="btn-save" onClick={handleSavePlan}>
          Save Plan
        </button>
        <button className="btn-cancel" onClick={handleCancelPlan}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="control-buttons idle">
      <button 
        className={storeLog === true ? 'active' : ''}
        onClick={() => handleCommand('Start/End Logging')}
      >
        Start/End Logging
      </button>
      
      <button onClick={() => handleCommand('Hover')}>Hover</button>
      <button onClick={() => handleCommand('Land')}>Land</button>
      <button className="home-button" onClick={() => handleCommand('Return to Home')}>🏠</button>
    </div>
  );
}

export default ControlButtons;
