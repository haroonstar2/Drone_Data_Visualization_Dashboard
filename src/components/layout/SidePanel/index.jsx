import MissionLogDisplay from '../../MissionLogDisplay';
import InfoTabs from '../../InfoTabs';
import './SidePanel.css'; 

function SidePanel() {
  return (
    <div className="side-panel">
      <MissionLogDisplay />
      <InfoTabs />
    </div>
  );
}

export default SidePanel;
