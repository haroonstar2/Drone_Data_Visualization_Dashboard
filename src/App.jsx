import './App.css'; 
import TopBar from './components/TopBar'; 
import SidePanel from './components/SidePanel'; 
import MainContent from './components/MainContent'; 
import Settings from './components/TopBar/Settings';
import Plans from './components/TopBar/Plans';
import PastLogs from './components/TopBar/PastLogs';
import { startTelemetrySimulation } from './services/MockAPI';
import { useEffect, useState } from 'react';
import { useDroneStore } from './store';
import { getSettings } from './services/MockAPI';


function App() {
  // Booleans to display the top bar windows
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Used to initially fetch data on start up
  const setGlobalSettings = useDroneStore((state) => state.updateSettings)

  // Start the telemetry simulation. Telemetry is constantly updated
  useEffect(() => {
    console.log("Starting telemetry simulation...");
    const id = startTelemetrySimulation();
    
    const fetchInitialSettings = async () => {
      console.log("Fetching Initial Settings");
      const response = await getSettings();

      if (response.status === "success") {
        setGlobalSettings(response.data);
      } else {
        alert("Error fetching initial settings")
      }
    };
    fetchInitialSettings();

  }, [setGlobalSettings])


  return (
    <div className="dashboard-layout">
    {/* Pass the onClick props to Topbar */}
      <TopBar 
      onSettingsClick={() => setIsSettingsOpen(true)}
      onPlanClick={() => setIsPlanOpen(true)}
      onLogsClick={() => setIsLogsOpen(true)}
      />

      <div className="main-area"> {/* This will hold SidePanel and MainContent */}
        <SidePanel />
        <MainContent />
      </div>

      {/* Render the TopBar windows. Pass it the respective prop*/}
      <Settings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <Plans 
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
      />
      <PastLogs 
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
}

export default App;