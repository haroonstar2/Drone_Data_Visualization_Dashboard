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

export function HistoryLogDetailsView({details}) {

  const handleExport = () => {
    console.log("Exporting logs to CSV...");
    downloadCSV(details.logs, `mission_logs_${details.missionId}.csv`);
  };

  if (!details) return null;
  return (
    <>
      <h3>Logs for: {details.id}</h3>
      <ul className="history-log-list">
        {details.logs.map((log, index) => (
          <li key={index} style={{ 
            color: log.level === 'WARN' ? '#ff0000ff' : '#000000ff',
            borderBottom: '1px solid #546E7A',
            padding: '4px 0'
          }}>
            <strong>{log.timestamp}:</strong> {log.message}
          </li>
        ))}
      </ul>
      
      <button onClick={handleExport} className="btn-save">Export to CSV</button>
    </>
  );
}