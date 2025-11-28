import React from 'react';
import './InfoTabs.css';

import StatusTab from './StatusTab';
import TelemetryTab from './TelemetryTab.jsx';
import MissionTab from './MissionTab.jsx';
import SensorFeedTab from './SensorFeedTab.jsx';
import EnvironmentalDataTab from './EnviromentalDataTab.jsx';

function InfoTabs() {
  // Dummy state for active tab (will make it functional later)
  const [activeTab, setActiveTab] = React.useState('Status');
  const tabs = ['Status', 'Telemetry', 'Mission', 'Sensor Feed', 'Environmental Data'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Status':
        return <StatusTab />;
      case 'Telemetry':
        return <TelemetryTab />;
      case 'Mission':
        return <MissionTab />;
      case 'Sensor Feed':
        return <SensorFeedTab />;
      case 'Environmental Data':
        return <EnvironmentalDataTab />;
      default:
        return <p>Content for the **{activeTab}** tab will go here.</p>;
    }
  };

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
        {/* 3. Call the helper function */}
        {renderTabContent()}
      </div>
    </div>
  );
}

export default InfoTabs;
