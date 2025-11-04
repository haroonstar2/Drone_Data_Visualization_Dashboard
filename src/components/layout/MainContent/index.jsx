import MapView from '../../MapView';
import ControlButtons from '../../ControlButtons';
import './MainContent.css';

function MainContent() {
  return (
    <div className="main-content">
      <MapView />
      <ControlButtons />
    </div>
  );
}

export default MainContent;
