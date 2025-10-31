import './ControlButtons.css';
// Import the mock API service
import { sendCommand } from '../../services/MockAPI';

function ControlButtons() {
  const handleCommand = async (commandName) => {
    console.log(`Attempting to send command: ${commandName}`);
    try {
      const response = await sendCommand(commandName);
      console.log(`[Mock API] response for ${commandName}:`, response);
      alert(response.message); // Simple feedback
    } catch (error) {
      console.error(`Error sending command ${commandName}:`, error);
      alert(`Failed to send command ${commandName}.`);
    }
  };

  return (
    <div className="control-buttons">
      <button onClick={() => handleCommand('Start/End Logging')}>Start/End Logging</button>
      <button onClick={() => handleCommand('New Waypoint')}>New Waypoint</button>
      <button onClick={() => handleCommand('Hover')}>Hover</button>
      <button onClick={() => handleCommand('Land')}>Land</button>
      <button className="home-button" onClick={() => handleCommand('Return to Home')}>🏠</button>
    </div>
  );
}

export default ControlButtons;
