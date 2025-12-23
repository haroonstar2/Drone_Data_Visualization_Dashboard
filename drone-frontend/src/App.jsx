import './App.css';
import 'leaflet/dist/leaflet.css';
import TopBar from './components/_layout/TopBar';
import SidePanel from './components/_layout/SidePanel';
import MainContent from './components/_layout/MainContent';
import Settings from './components/Settings';
import ListDetailModal from './components/_common/ListDetailModal';
import { FlightPlanListView, FlightPlanDetailView } from './components/_common/views/FlightPlanModal';
import { MissionListItem, HistoryLogDetailsView } from './components/_common/views/HistoryModal';
import { sendCommand, startSimulation } from './services/RealAPI';
import { getSettings, getPlanList, getPlanDetails, getMissionHistory, getMissionLogs } from './services/RealAPI';
import { useEffect, useState } from 'react';
import { useDroneStore } from './store';


function App() {
  // Booleans to display the top bar windows
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Functions to load previous plans
  const setAppMode = useDroneStore((state) => state.setAppMode);
  const setWaypoints = useDroneStore((state) => state.setWaypoints);
  const clearWaypoints = useDroneStore((state) => state.clearWaypoints);

  // Functions to handle plan metadata
  const setEditingPlan = useDroneStore((state) => state.setEditingPlan);
  const clearEditingPlan = useDroneStore((state) => state.clearEditingPlan);

  // Used to initially fetch data on start up
  const setGlobalSettings = useDroneStore((state) => state.updateSettings)

  // Used for the Websocket connection
  const updateTelemetry = useDroneStore((state) => state.updateTelemetry);
  const addMissionLog = useDroneStore((state) => state.addMissionLog);
  const updateEnvironment = useDroneStore((state) => state.updateEnvironment); 
  const updateStatus = useDroneStore((state) => state.updateStatus);
  const updateSettings = useDroneStore((state) => state.updateSettings);

  const handleEditPlan = (planDetails) => {
    console.log("Editing plan:", planDetails.name);

    // Stop the drone during editing
    sendCommand('STOP_MISSION');

    // Load new data
    setWaypoints(planDetails.waypoints);
    setEditingPlan(planDetails.id, planDetails.name, planDetails.description);
    setAppMode('PLANNING'); 
  };

  const handleActivatePlan = (planDetails) => {
    console.log("Activating plan:", planDetails.name);
    setWaypoints(planDetails.waypoints);
    clearEditingPlan(); 
    setAppMode('idle');
  };

  // Starts a new plan
  const handleCreateNewPlan = () => {
    console.log("Starting new plan...");
    clearEditingPlan();
    clearWaypoints(); // Clear any existing waypoints
    setAppMode('PLANNING'); // Set the global mode
  };

  // Start the telemetry simulation and fetch initial settings
  useEffect(() => {
    console.log("Starting real-time WebSocket connection...");

    // Package all the actions
    const storeActions = {
          updateTelemetry,
          addMissionLog,
          updateEnvironment,
          updateStatus      
    };

    const cleanupSimulation = startSimulation(storeActions);

    // console.log("Starting telemetry simulation...");
    // const id = startSimulation();

    const fetchInitialSettings = async () => {
      console.log("Fetching Initial Settings");
      const response = await getSettings();

      if (response.status === "success") {
        console.log("Successfully fetched settings");
        setGlobalSettings(response.data);
      } else {
        alert("Error fetching initial settings");
      }
    };
    fetchInitialSettings();

    // return () => clearInterval(id);
    return () => {
      cleanupSimulation();
    }
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
        
        onItemSelect={handleEditPlan}       // "Edit/Load" button
        onActivate={handleActivatePlan}     // "Activate" button
        onCreateNew={handleCreateNewPlan}   // "Create New" button
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
    </div>
  );
}

export default App;