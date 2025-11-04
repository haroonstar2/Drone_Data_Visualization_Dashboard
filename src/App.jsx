import './App.css';
import TopBar from './components/_layout/TopBar';
import SidePanel from './components/_layout/SidePanel';
import MainContent from './components/_layout/MainContent';
import Settings from './components/Settings';
import ListDetailModal from './components/_common/ListDetailModal';
import { FlightPlanListView, FlightPlanDetailView } from './components/_common/views/FlightPlanModal';
import { MissionListItem, HistoryLogDetailsView } from './components/_common/views/HistoryModal';
import { startSimulation, getSettings, getPlanList, getPlanDetails, getMissionHistory, getMissionLogs } from './services/MockAPI';
import { useEffect, useState } from 'react';
import { useDroneStore } from './store';


function App() {
  // Booleans to display the top bar windows
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Used to initially fetch data on start up
  const setGlobalSettings = useDroneStore((state) => state.updateSettings)

  // Start the telemetry simulation and fetch initial settings
  useEffect(() => {
    console.log("Starting telemetry simulation...");
    const id = startSimulation();

    const fetchInitialSettings = async () => {
      console.log("Fetching Initial Settings");
      const response = await getSettings();

      if (response.status === "success") {
        setGlobalSettings(response.data);
      } else {
        alert("Error fetching initial settings");
      }
    };
    fetchInitialSettings();

    return () => clearInterval(id);
  }, [setGlobalSettings]);


  return (
    <div className="dashboard-layout">
    {/* Pass the onClick props to Topbar */}
      <TopBar 
      onSettingsClick={() => setIsSettingsOpen(true)}
      onPlanClick={() => setIsPlanOpen(true)}
      onLogsClick={() => setIsHistoryOpen(true)}
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

      {/* Flight Plan Modal (using the generic ListDetailModal) */}
      <ListDetailModal
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        title="Flight Plans"
        fetchList={getPlanList}
        fetchDetails={getPlanDetails}
        ListItemComponent={FlightPlanListView}
        DetailsComponent={FlightPlanDetailView}
      />

      {/* History Modal (using the same generic component) */}
      <ListDetailModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Mission History"
        fetchList={getMissionHistory}
        fetchDetails={getMissionLogs}
        ListItemComponent={MissionListItem}
        DetailsComponent={HistoryLogDetailsView}
      />
      {/* <PastLogs 
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      /> */}
    </div>
  );
}

export default App;