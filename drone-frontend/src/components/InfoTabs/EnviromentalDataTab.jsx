import { useDroneStore } from '../../store';

function EnvironmentalDataTab() {
  const env = useDroneStore((state) => state.environment);

  return (
    <div className="environment-tab-content">
      <h4>Environmental Data</h4>
      <ul>
        <li>Temperature: {env.temperature.toFixed(1)} °C</li>
        <li>Wind Speed: {env.windSpeed.toFixed(1)} m/s</li>
        <li>Wind Direction: {env.windDirection.toFixed(0)}°</li>
      </ul>
    </div>
  );
}

export default EnvironmentalDataTab;