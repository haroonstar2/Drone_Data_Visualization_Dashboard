import { useEffect, useRef } from 'react';
import { useDroneStore } from '../../store';
import { animateScroll as scroll } from 'react-scroll';
import './MissionLogDisplay.css';

function MissionLogDisplay() {

  // Get logs from the store
  const logs = useDroneStore((state) => state.missionLogs);

  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="mission-log-display">
      <h3>Mission Logs</h3>
      <div className="log-list">
        {logs.length === 0 && <p className="no-logs">No logs yet...</p>}
        
        {logs.map((log, index) => (
          <div key={index} className={`log-entry log-${log.data.level.toLowerCase()}`}>
            <span className="log-time">[{log.timestamp}]</span>
            <span className="log-msg">{log.data.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default MissionLogDisplay;
