import TopBar from './components/TopBar'; 
import SidePanel from './components/SidePanel'; 
import MainContent from './components/MainContent'; 
import './App.css'; 
import { startTelemetrySimulation } from './services/MockAPI';
import { useEffect } from 'react';


function App() {
  
  useEffect(() => {
    console.log("Starting telemetry simulation...");
    const id = startTelemetrySimulation();
    return () => clearInterval(id);
  }, [])


  return (
    <div className="dashboard-layout">
      <TopBar />
      <div className="main-area"> {/* This will hold SidePanel and MainContent */}
        <SidePanel />
        <MainContent />
      </div>
    </div>
  );
}

export default App;