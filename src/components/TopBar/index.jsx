import './TopBar.css';

function TopBar() {
    return (
        <div className='top-bar'>
            <div className="top-bar-left">
                <span>Settings</span>
                <span>Flight Plan</span>
                <span>Logs</span>

                <div className="top-bar-title">Drone Dashboard</div>
            </div>
        </div>
    );
}

export default TopBar;
