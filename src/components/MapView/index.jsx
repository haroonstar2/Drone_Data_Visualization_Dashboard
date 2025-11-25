import './MapView.css';
import { useEffect, useRef } from 'react';
import { useDroneStore } from '../../store'; 
import { sendCommand } from '../../services/MockAPI'; 
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';

import droneIcon from '../../assets/drone-icon.png';

const customDroneIcon = L.icon({
  iconUrl: droneIcon, 
  iconSize: [32, 32],      // Size of the icon [width, height]
  iconAnchor: [16, 32],    // Point of the icon which will correspond to marker's location (center-bottom for a pointer)
  popupAnchor: [0, -32]    // Point from which the popup should open relative to the iconAnchor
});

// Component to make the map follow the drone
function MapFollower({ position }) {
  const map = useMap(); // Get the map instance
  useEffect(() => {
    map.setView(position, map.getZoom()); // Pan the map to the new position
  }, [position, map]); // Re-run when position changes
  
  return null;
}

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

  const dronePosition = [telemetry.latitude, telemetry.longitude];

  // This is a simple mock for getting map coordinates from a click
  const handleMapClick = async (e) => {
    if (appMode !== 'adding_waypoint') {
      return;
    }
    
    // Generate a temporary, unique ID for this new waypoint
    const tempId = activeWaypoints.length + 1;
    // e.latlng contains the real geographic coordinates
    const { lat, lng } = e.latlng;
    
    const newWaypoint = {
      id: tempId, // Use the temp ID
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      altitude: 100
    };

    // Add the marker to the map immediately, before the API call
    addWaypoint(newWaypoint);
    // Set mode back to idle immediately so the UI feels fast
    setAppMode('idle');

    console.log('[MOCK API] Sending NEW_WAYPOINT command with payload:', newWaypoint);
    try {
      const response = await sendCommand('ADD_WAYPOINT', newWaypoint);
    } catch (error) {

      // Roll back the marker we just added
      removeWaypoint(tempId);       
      alert('Error: Failed to add waypoint. Please try again.');
    } 
  };
  
  const mapClassName = `map-view ${appMode === 'adding_waypoint' ? 'crosshair-cursor' : ''}`;
  
  return (
    <div className={mapClassName}>
      
      {/* Show a prompt when in adding mode */}
      {appMode === 'adding_waypoint' && (
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
      
      {/* Marker for the drone's position */}
      <Marker position={dronePosition} icon={customDroneIcon}>
        <Popup>
          Drone Position <br />
          Alt: {telemetry.altitude.toFixed(1)}m <br />
          Batt: {telemetry.battery}%
        </Popup>
      </Marker>
      
      {/* Component to pan the map */}
      <MapFollower position={dronePosition} />

      <MapClickHandler onMapClick={handleMapClick} />

      {/* Render waypoints using the waypoint ID as the key */}
      {activeWaypoints.map((wp) => (
        <Marker 
          key={wp.id} // Use the unique ID for the key
          position={[wp.latitude, wp.longitude]}
        >
          <Popup>Waypoint {wp.id}</Popup>
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