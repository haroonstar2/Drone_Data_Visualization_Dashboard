import { useDroneStore } from '../../store'; 

function StatusTab() {
  const status = useDroneStore((state) => state.droneStatus);

  return (
    <div className="status-tab-content">
      <h4>Drone Status</h4>
      <ul>
        <li>Armed: {status.armed}</li>
        <li>Mode: {status.mode}</li>
        <li>Health: {status.health}</li>
      </ul>
      {/* Add more derived status info here later */}
    </div>
  );
}

export default StatusTab;