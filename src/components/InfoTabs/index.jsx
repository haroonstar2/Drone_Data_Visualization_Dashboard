import React from 'react';
import './InfoTabs.css';
import TelemetryTab from './TelemetryTab';

function InfoTabs() {
  // Dummy state for active tab (will make it functional later)
  const [activeTab, setActiveTab] = React.useState('Status');

  const tabs = ['Status', 'Telemetry', 'Mission', 'Sensor Feed', 'Environmental Data'];

  return (
    <div className="info-tabs-container">
      <div className="tab-buttons">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="tab-content">
        <p>Content for the **{activeTab}** tab will go here.</p>
        {/* Dummy content based on active tab */}
        {activeTab === 'Status' && <p>Drone Health: OK, Battery: 95%</p>}
        {activeTab === 'Telemetry' && <TelemetryTab />}
        {activeTab === 'Mission' && <p>Waypoint 3 of 10, Progress: 30%</p>}
      </div>
    </div>
  );
}

export default InfoTabs;
