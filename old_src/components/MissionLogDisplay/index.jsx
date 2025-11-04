import './MissionLogDisplay.css';

function MissionLogDisplay() {
  return (
    <div className="mission-log-display">
      <h3>Mission Logs</h3>
      <p>[Log Entry 1: Drone armed]</p>
      <p>[Log Entry 2: Taking off]</p>
      <p>[Log Entry 3: Reached altitude]</p>
      {/* ... dummy logs */}
    </div>
  );
}

export default MissionLogDisplay;
