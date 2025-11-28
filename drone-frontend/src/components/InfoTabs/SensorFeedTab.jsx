import { useDroneStore } from '../../store';

function SensorFeedTab() {
  // Subscribe to all state slices that count as "sensors"
  const telemetry = useDroneStore((state) => state.telemetry);
  const environment = useDroneStore((state) => state.environment);

  return (
    <div className="sensor-feed-tab-content" style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
      <h4>Raw Sensor Feed</h4>
      <strong>Telemetry:</strong>
      {/* <pre> renders text exactly as-is, with whitespace */}
      <pre style={{ backgroundColor: '#fff', padding: '5px', borderRadius: '4px', color: '#212121' }}>
        {JSON.stringify(telemetry, null, 2)}
      </pre>
      
      <strong>Environment:</strong>
      <pre style={{ backgroundColor: '#fff', padding: '5px', borderRadius: '4px', color: '#212121' }}>
        {JSON.stringify(environment, null, 2)}
      </pre>
    </div>
  );
}

export default SensorFeedTab;