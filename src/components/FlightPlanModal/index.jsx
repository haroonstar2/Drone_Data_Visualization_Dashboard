export function FlightPlanListView({ item, onClick }) {
    return (
        <div className="plan-item" onClick={onClick}>
            <div>
                <strong>{item.name}</strong>
                <small> {item.lastModified ? ` (Last modified: ${new Date(item.lastModified).toLocaleDateString()})` : ''}</small>
            </div>
            <small>{item.waypointCount} waypoints</small>
        </div>
    );
}

export function FlightPlanDetailView({ details }) {
    // if (!details) return null;
    return (
        <div>
            <h3>{details.name}</h3>
            <p>{details.description}</p>

            <ul>
                {details.waypoints.map((wp) => (
                    <li key={wp.order}>
                        WP {wp.order}: ({wp.latitude}, {wp.longitude}) @ {wp.altitude}m - Action: {wp.action}
                    </li>
                ))}
            </ul>
        </div>
    );
}