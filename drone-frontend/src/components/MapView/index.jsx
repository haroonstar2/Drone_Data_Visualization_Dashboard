import './MapView.css';
import { useDroneStore } from '../../store'; 
import { sendCommand } from '../../services/RealAPI'; 
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { WAYPOINT_ACTIONS, ACTION_OPTIONS } from '../waypointActions';

import droneIcon from '../../assets/drone-icon.png';

const customDroneIcon = L.icon({
  iconUrl: droneIcon, 
  iconSize: [32, 32],      // Size of the icon [width, height]
  iconAnchor: [16, 32],    // Point of the icon which will correspond to marker's location (center-bottom for a pointer)
  popupAnchor: [0, -32]    // Point from which the popup should open relative to the iconAnchor
});

function MapClickHandler({ onMapClick }) {
  // Hook listens for map events
  useMapEvents({
    click(e) {
      // When a click happens, call the function passed in
      onMapClick(e);
    },
  });
  return null;
}

function MapView() {
  const telemetry = useDroneStore((state) => state.telemetry);
  const appMode = useDroneStore((state) => state.appMode);
  const setAppMode = useDroneStore((state) => state.setAppMode);

  const activeWaypoints = useDroneStore((state) => state.activeWaypoints);
  const addWaypoint = useDroneStore((state) => state.addWaypoint);
  const removeWaypoint = useDroneStore((state) => state.removeWaypoint);
  const updateWaypoint = useDroneStore((state) => state.updateWaypoint);

  const settings = useDroneStore((state) => state.settings);
  const dronePosition = [telemetry.latitude, telemetry.longitude];

  const handleMapClick = async (e) => {
    if (appMode !== 'adding_waypoint') {
      return;
    }
    
    // Generate a temporary ID for this new waypoint
    const tempId = activeWaypoints.length + 1;
    // e.latlng contains the real geographic coordinates
    const { lat, lng } = e.latlng;
    
    const newWaypoint = {
      id: tempId, // Use the temp ID
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      altitude: 100,
      action: WAYPOINT_ACTIONS.PASS_THROUGH,
    };

    // Add the marker to the map immediately, before the API call
    addWaypoint(newWaypoint);

    console.log('[Real API] Sending ADD_WAYPOINT command with payload:', newWaypoint);
    try {
      const response = await sendCommand('ADD_WAYPOINT', newWaypoint);
    } catch (error) {

      // Roll back the marker we just added
      removeWaypoint(tempId);       
      alert(`Error: Failed to add waypoint: ${error}`);
    } 
  };
  
  const handleRemove = async (waypointId) => {

    console.log("Attempting to remove waypoint ID:", waypointId);

    if (appMode !== 'PLANNING') {
      return;
    }

    const payload = { id: waypointId }

    try {
      const response = await sendCommand('REMOVE_WAYPOINT', payload);
      console.log("Backend confirmed removal.");

      removeWaypoint(waypointId);

    } catch (error) {
      console.error(`Error: Failed to remove waypoint: ${error}`);
      alert(`Error: Failed to remove waypoint. Check network connection.`);
    }
  }

  const mapClassName = `map-view ${appMode === 'adding_waypoint' ? 'crosshair-cursor' : ''}`;
  const isPlanningMode = appMode === 'PLANNING' || appMode === 'adding_waypoint';
  
  return (
    <div className={mapClassName}>
      
      {/* Show a prompt when in adding mode */}
      {isPlanningMode && (
        <div className="map-prompt">Click on the map to add a waypoint...</div>
      )}
      
      <MapContainer 
        center={dronePosition} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
      >

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {settings.drone.homeLatitude && settings.drone.homeLongitude && (
          <CircleMarker
            center={[settings.drone.homeLatitude, settings.drone.homeLongitude]}
            radius={10} // A nice visible size
            pathOptions={{ 
                color: '#5900ffff',    // Dark green border
                fillColor: '#4c00ffff', // Bright green fill
                fillOpacity: 0.8,
                weight: 2
            }}
          >
            <Popup><strong>Home Base</strong><br/>RTH Destination</Popup>
          </CircleMarker>
        )}
      
      {/* Marker for the drone's position */}
      <Marker position={dronePosition} icon={customDroneIcon}>
        <Popup>
          Drone Position <br />
          Alt: {telemetry.altitude.toFixed(1)}m <br />
          Batt: {telemetry.battery}%
        </Popup>
      </Marker>

      <MapClickHandler onMapClick={handleMapClick} />

      {/* Render waypoints using the waypoint ID as the key */}
      {activeWaypoints.map((wp, index) => (
        <Marker 
          key={wp.id} // Use the unique ID for the key
          position={[wp.latitude, wp.longitude]}
         >
          <Popup>

            <div className="waypoint-popup">
                <strong>Waypoint #{index + 1}</strong>
                <br />
                <small>ID: {wp.id} </small>
                
                {/* Editing controls(Only in planning mode) */}
                {isPlanningMode && (
                  <div className="waypoint-controls">
                    <hr />
                    <label>Action:</label>
                    {/* Dropdown Select */}
                    <select 
                        value={wp.action || WAYPOINT_ACTIONS.PASS_THROUGH}
                        onChange={(e) => updateWaypoint(wp.id, { action: e.target.value })}
                        className="action-select"
                    >
                        {ACTION_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Conditionally show duration input if HOVER_T is selected */}
                    {wp.action === WAYPOINT_ACTIONS.HOVER_T && (
                      <div className="duration-input-container">
                        <label htmlFor={`duration-${wp.id}`}>Duration (sec):</label>
                        <input
                          id={`duration-${wp.id}`}
                          type="number"
                          min="1"
                          className="duration-input"
                          // Use existing duration or default to 5 seconds
                          value={wp.hoverDuration || 5}
                          // Update store on change
                          onChange={(e) => {
                            // Ensure value is a positive integer
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                               updateWaypoint(wp.id, { hoverDuration: val });              
                            }


                          }}
                        />
                      </div>
                    )}

                    {/* Delete Button */}
                    <button 
                        className="btn-delete-wp"
                        onClick={() => handleRemove(wp.id)}
                    >
                        Delete Waypoint
                    </button>
                  </div>
                )}
                 {/* View only(Not in planning mode) */}
                {!isPlanningMode && (
                     <p>Action: {wp.action || WAYPOINT_ACTIONS.PASS_THROUGH}</p>
                )}
              </div>
          </Popup>
        </Marker>
      ))}


      {/* <div className="map-overlay">
        <p>Map Overlay (For heatmaps and whatever else)</p>
      </div>
      <div className="mini-map">
        <p>Mini Map</p>
      </div> */}
    </MapContainer>
    </div>
  );
}

export default MapView;