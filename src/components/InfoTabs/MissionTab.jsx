import { useDroneStore } from '../../store';

function MissionTab() {
  const status = useDroneStore((state) => state.droneStatus);

  return (
    <div className="mission-tab-content">
      <h4>Active Mission</h4>
      <ul>
        <li>Current Mode: {status.mode}</li>
        <li>Health: {status.health}</li>
        <li>Armed: {status.armed ? 'ARMED' : 'DISARMED'}</li>
        <li>
          Progress: 
          {status.mode === 'MISSION' ? ' In Progress (Waypoint 1/1)' : 'No active mission.'}
        </li>
      </ul>
    </div>
  );
}

export default MissionTab;