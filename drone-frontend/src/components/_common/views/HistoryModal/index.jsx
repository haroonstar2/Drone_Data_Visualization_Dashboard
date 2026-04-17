function downloadCSV(logArray, filename) {
  // Create the CSV header
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "timestamp,level,message\n";

  // Convert each log object to a CSV row
  logArray.forEach(log => {
    // Enclose message in quotes in case it has commas
    const row = `${log.timestamp},${log.level},"${log.message}"`;
    csvContent += row + "\n";
  });

  // Create a link and trigger the download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);

  document.body.appendChild(link); 
  link.click(); 
  document.body.removeChild(link); 
}


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

export function HistoryLogDetailsView({ details, onClose }) {

  const handleExport = () => {
    console.log("Exporting logs to CSV...");
    downloadCSV(details.logs, `mission_logs_${details.missionId}.csv`);
  };

  if (!details) return null;

  const hasLogs = details.logs && details.logs.length > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3>Mission: {details.name || details.id}</h3>
      <p><strong>Log Count:</strong> {details.logCount}</p>
      
      {/* Add scrolling for long lists */}
      <div style={{ 
          maxHeight: '400px',     // Limit height
          overflowY: 'auto',      // Enable scrolling
          background: '#f4f4f4', 
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ddd',
          marginBottom: '15px'    // Space for the button
      }}>
        {!hasLogs ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                <em>No logs recorded for this mission.</em>
            </div>
        ) : (
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {details.logs.map((log, index) => (
                    <li key={index} style={{ borderBottom: '1px solid #e0e0e0', padding: '8px 0' }}>
                        <span style={{ 
                            color: log.level === 'WARN' ? 'orange' : log.level === 'ERROR' ? 'red' : 'green',
                            fontWeight: 'bold',
                            marginRight: '10px',
                            fontSize: '0.9em'
                        }}>
                            [{log.level}]
                        </span>
                        <span>{log.message}</span>
                        <div style={{ fontSize: '0.75em', color: '#999', marginTop: '2px' }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-cancel" onClick={handleExport} style={{ width: '100%' }}>
            Export
        </button>
      </div>
    </div>
  );
}