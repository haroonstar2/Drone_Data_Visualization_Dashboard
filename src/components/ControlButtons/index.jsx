import './ControlButtons.css';
// Import the mock API service
import { sendCommand } from '../../services/MockAPI';
import { useDroneStore } from '../../store';

function ControlButtons() {

  const storeLog = useDroneStore((state) => state.settings.system.storeLog);
  const toggleStoreLogs = useDroneStore((state) => state.toggleStoreLogs);
  const appMode = useDroneStore((state) => state.appMode);
  const setAppMode = useDroneStore((state) => state.setAppMode);
  
  const handleCommand = async (commandName) => {
    console.log(`Attempting to send command: ${commandName}`);
    try {
      switch(commandName) {
        case "Start/End Logging":
          toggleStoreLogs();
          console.log("Log storing toggled.");
          break;

        case "New Waypoint":
          const newMode = appMode === 'adding_waypoint' ? 'idle' : 'adding_waypoint';
          setAppMode(newMode);
          console.log(`App mode set to: ${newMode}`);
          return;

        default:
          const response = await sendCommand(commandName);
          console.log(`[Mock API] response for ${commandName}:`, response);
          alert(response.message);

      }
    } catch (error) {
      console.error(`Error sending command ${commandName}:`, error);
      alert(`Failed to send command ${commandName}.`);
    }
  };

  return (
    <div className="control-buttons">
      <button 
        className={storeLog === true ? 'active' : ''}
        onClick={() => handleCommand('Start/End Logging')}
      >
        Start/End Logging
      </button>

      <button 
        className={appMode === 'adding_waypoint' ? 'active' : ''}
        onClick={() => handleCommand('New Waypoint')}
      >
        New Waypoint
      </button>
      
      <button onClick={() => handleCommand('Hover')}>Hover</button>
      <button onClick={() => handleCommand('Land')}>Land</button>
      <button className="home-button" onClick={() => handleCommand('Return to Home')}>🏠</button>
    </div>
  );
}

export default ControlButtons;
