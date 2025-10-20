import {useDroneStore} from '../../store';

function TelemetryTab() {
    const telemetry = useDroneStore((state) => state.telemetry);

    return (
        <div>
            <h3>Telemetry</h3>
            <ul>
                <li>Latitude: {telemetry.latitude}</li>
                <li>Longitude: {telemetry.longitude}</li>
                <li>Altitude: {telemetry.altitude} m</li>
                <li>Speed: {telemetry.speed} m/s</li>
                <li>Heading: {telemetry.heading}°</li>
                <li>Battery: {telemetry.battery}%</li>
            </ul>
        </div>
    );
}

export default TelemetryTab