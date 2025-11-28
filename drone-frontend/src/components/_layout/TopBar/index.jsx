import './TopBar.css';

// Pass the prop so that App.jsx can render the windows for the buttons
function TopBar({onSettingsClick, onPlanClick, onLogsClick}) {
    return (
        <div className='top-bar'>
            <span className="top-bar-title">Drone Dashboard</span>
                <div className="top-bar-left">
                    {/* onClick handler to open the windows*/}
                    <span onClick={onSettingsClick}>Settings</span>
                    <span onClick={onPlanClick}>Flight Plan</span>
                    <span onClick={onLogsClick}>Past Logs</span>
                </div>
        </div>
    );
}

export default TopBar;
