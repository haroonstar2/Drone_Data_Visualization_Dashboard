import {useDroneStore} from '../../store';

function TelemetryTab() {
    const telemetry = useDroneStore((state) => state.telemetry);

    return (
        <div>
            <h3>Telemetry</h3>
            <ul>
                <li>Altitude: {telemetry.altitude}m</li>
                <li>Speed: {telemetry.speed}m/s</li>
                <li>Battery: {telemetry.battery}%</li>
                <li>Coordinates: {telemetry.latitude}, {telemetry.longitude}</li>
            </ul>
        </div>
    );
}

export default TelemetryTab