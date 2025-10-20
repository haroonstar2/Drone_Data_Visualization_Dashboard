import TopBar from './components/TopBar'; 
import SidePanel from './components/SidePanel'; 
import MainContent from './components/MainContent'; 
import './App.css'; 

function App() {
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