export function MissionListItem({ item, onClick }) {
  return (
    <div className="plan-item" onClick={onClick}>
      <div>
        <strong>{item.name}</strong>
        <small> ({item.date})</small>
      </div>
      <small>{item.logCount} log entries</small>
    </div>
  );
}

export function HistoryLogDetailsView({details}) {
  if (!details) return null;
  return (
    <>
      <h3>Logs for: {details.id}</h3>
      <ul className="history-log-list">
        {details.logs.map((log, index) => (
          <li key={index} className={`log-level-${log.level.toLowerCase()}`}>
            <strong>{log.timestamp}:</strong> {log.message}
          </li>
        ))}
      </ul>
    </>
  );
}