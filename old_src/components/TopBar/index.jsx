import './TopBar.css';

// Pass the prop so that App.jsx can render the windows for the buttons
function TopBar({onSettingsClick, onPlanClick, onLogsClick}) {
    return (
        <div className='top-bar'>
            <div className="top-bar-left">
                {/* Add a onClick handler to open the windows*/}
                <span onClick={onSettingsClick}>Settings</span>
                <span onClick={onPlanClick}>Flight Plan</span>
                <span onClick={onLogsClick}>Past Logs</span>

                <div className="top-bar-title">Drone Dashboard</div>
            </div>
        </div>
    );
}

export default TopBar;
