// Dashboard functionality
// UI elements
const soilPercentEl = document.getElementById("soilPercent");
const soilStatus = document.getElementById("soilStatus");
const tempValueEl = document.getElementById("tempValue");
const tempStatus = document.getElementById("tempStatus");
const thresholdMinInput = document.getElementById("thresholdMinInput");
const thresholdMaxInput = document.getElementById("thresholdMaxInput");
const thresholdBtn = document.getElementById("thresholdBtn");
const currentThresholdMin = document.getElementById("currentThresholdMin");
const currentThresholdMax = document.getElementById("currentThresholdMax");
const modeToggleBtn = document.getElementById("modeToggleBtn");
const modeToggleText = document.getElementById("modeToggleText");
const modeStatusText = document.getElementById("modeStatusText");
const pumpToggleBtn = document.getElementById("pumpToggleBtn");
const pumpToggleText = document.getElementById("pumpToggleText");
const pumpStatusText = document.getElementById("pumpStatusText");
const brokerDot = document.getElementById("brokerDot");
const brokerTooltip = document.getElementById("brokerTooltip");
const esp32Dot = document.getElementById("esp32Dot");
const esp32Tooltip = document.getElementById("esp32Tooltip");
const sensorBadge = document.getElementById("sensorBadge");
const controlBadge = document.getElementById("controlBadge");
const logTableBody = document.getElementById("logTableBody");
const navbarOtaBtn = document.getElementById("navbarOtaBtn");

let logData = [];
let isManualMode = false;
let pumpState = false;

// Soil update
function updateSoil(soil) {
  soilPercentEl.innerText = soil;
  updateSoilStatus(soil);
  
  // Update chart
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  soilData.push(soil);
  // Batasi data menjadi maxDataPoints (7)
  if (soilData.length > maxDataPoints) soilData.shift();
  
  if (labels.length < maxDataPoints || labels[labels.length-1] !== timeStr) {
    labels.push(timeStr);
    // Batasi labels menjadi maxDataPoints (7)
    if (labels.length > maxDataPoints) labels.shift();
  }
  
  updateChart();
  
  // add to log
  const logEntry = { 
    timestamp: now.toLocaleString(), 
    soil_moisture: (typeof soil === "number") ? soil.toFixed(1) : soil,
    temperature: tempValueEl.innerText
  };
  logData.push(logEntry);
  if (logData.length > 2000) logData.shift();
  
  // Update log table
  updateLogTable(logEntry);
}

// Temperature update
function updateTemperature(temp) {
  tempValueEl.innerText = (typeof temp === "number") ? temp.toFixed(1) : temp;
  updateTemperatureStatus(temp);
  
  // Update chart
  tempData.push(temp);
  // Batasi data menjadi maxDataPoints (7)
  if (tempData.length > maxDataPoints) tempData.shift();
  
  updateChart();
}

// Update log table
function updateLogTable(logEntry) {
  // If table is showing loading message, clear it
  if (logTableBody.children.length === 1 && logTableBody.children[0].children.length === 1) {
    logTableBody.innerHTML = '';
  }
  
  // Create new row
  const row = document.createElement('tr');
  
  // Add time cell
  const timeCell = document.createElement('td');
  timeCell.className = 'log-time';
  timeCell.textContent = logEntry.timestamp;
  row.appendChild(timeCell);
  
  // Add soil moisture cell
  const soilCell = document.createElement('td');
  soilCell.className = 'log-soil';
  soilCell.textContent = logEntry.soil_moisture + '%';
  row.appendChild(soilCell);
  
  // Add temperature cell
  const tempCell = document.createElement('td');
  tempCell.className = 'log-temp';
  tempCell.textContent = logEntry.temperature + '°C';
  row.appendChild(tempCell);
  
  // Add row to the top of the table
  logTableBody.insertBefore(row, logTableBody.firstChild);
  
  // Limit table to 10 rows
  if (logTableBody.children.length > 10) {
    logTableBody.removeChild(logTableBody.lastChild);
  }
}

// Soil status text
function updateSoilStatus(soil) {
  if (soil === null || soil === undefined || isNaN(soil)) {
    soilStatus.textContent = "--"; 
    soilStatus.className = "sensor-status";
    return;
  }
  
  const minThreshold = parseInt(currentThresholdMin.textContent) || 30;
  const maxThreshold = parseInt(currentThresholdMax.textContent) || 70;
  
  if (soil < minThreshold) { 
    soilStatus.textContent = "Kering"; 
    soilStatus.className = "sensor-status status-dry"; 
  }
  else if (soil >= minThreshold && soil <= maxThreshold) { 
    soilStatus.textContent = "Optimal"; 
    soilStatus.className = "sensor-status status-optimal"; 
  }
  else { 
    soilStatus.textContent = "Basah"; 
    soilStatus.className = "sensor-status status-wet"; 
  }
}

// Temperature status text
function updateTemperatureStatus(temp) {
  if (temp === null || temp === undefined || isNaN(temp)) {
    tempStatus.textContent = "--"; 
    tempStatus.className = "sensor-status";
    return;
  }
  
  if (temp < 20) { 
    tempStatus.textContent = "Dingin"; 
    tempStatus.className = "sensor-status status-cold"; 
  }
  else if (temp >= 20 && temp <= 30) { 
    tempStatus.textContent = "Optimal"; 
    tempStatus.className = "sensor-status status-normal"; 
  }
  else if (temp > 30 && temp <= 35) { 
    tempStatus.textContent = "Hangat"; 
    tempStatus.className = "sensor-status status-warm"; 
  }
  else { 
    tempStatus.textContent = "Panas"; 
    tempStatus.className = "sensor-status status-hot"; 
  }
}

// Update mode UI
function updateModeUI() {
  if (isManualMode) {
    modeToggleBtn.classList.remove("inactive");
    modeToggleBtn.classList.add("active");
    modeToggleText.textContent = "MANUAL";
    modeStatusText.textContent = "Manual";
  } else {
    modeToggleBtn.classList.remove("active");
    modeToggleBtn.classList.add("inactive");
    modeToggleText.textContent = "AUTO";
    modeStatusText.textContent = "Auto";
  }
}

// Update pump UI
function updatePumpUI() {
  if (pumpState) {
    pumpToggleBtn.classList.remove("off");
    pumpToggleBtn.classList.add("on");
    pumpToggleText.textContent = "HIDUP";
    pumpStatusText.textContent = "HIDUP";
  } else {
    pumpToggleBtn.classList.remove("on");
    pumpToggleBtn.classList.add("off");
    pumpToggleText.textContent = "MATI";
    pumpStatusText.textContent = "MATI";
  }
}

// Update pump controls based on mode
function updatePumpControls() {
  if (isManualMode) {
    pumpToggleBtn.disabled = false;
  } else {
    pumpToggleBtn.disabled = true;
  }
}

function updateBrokerConnection(connected, statusText) {
  if (connected) {
    brokerDot.classList.add('connected');
    brokerTooltip.textContent = statusText;
    sensorBadge.textContent = "Active";
    sensorBadge.className = "status-badge status-on";
    controlBadge.textContent = "Active";
    controlBadge.className = "status-badge status-on";
  } else {
    brokerDot.classList.remove('connected');
    brokerTooltip.textContent = statusText;
    sensorBadge.textContent = "Inactive";
    sensorBadge.className = "status-badge status-off";
    controlBadge.textContent = "Inactive";
    controlBadge.className = "status-badge status-off";
  }
}

function updateESP32Connection(connected, statusText) {
  if (connected) {
    esp32Dot.classList.add('connected');
    esp32Tooltip.textContent = statusText;
  } else {
    esp32Dot.classList.remove('connected');
    esp32Tooltip.textContent = statusText;
  }
}

// UI interactions
thresholdBtn.addEventListener("click", () => {
  const minValue = parseInt(thresholdMinInput.value);
  const maxValue = parseInt(thresholdMaxInput.value);
  
  if (isNaN(minValue) || isNaN(maxValue)) {
    showNotification("Masukkan nilai minimum dan maksimum yang valid", "error");
    return;
  }
  
  if (minValue < 0 || minValue > 100 || maxValue < 0 || maxValue > 100) {
    showNotification("Masukkan nilai antara 0-100", "error");
    return;
  }
  
  publishThreshold(minValue, maxValue);
});

thresholdMinInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    thresholdBtn.click();
  }
});

thresholdMaxInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    thresholdBtn.click();
  }
});

modeToggleBtn.addEventListener("click", () => {
  isManualMode = !isManualMode;
  updateModeUI();
  updatePumpControls();
  publishMode(isManualMode);
});

pumpToggleBtn.addEventListener("click", () => {
  if (isManualMode) {
    pumpState = !pumpState;
    updatePumpUI();
    publishPump(pumpState);
  }
});

// OTA Button functionality
navbarOtaBtn.addEventListener("click", () => {
  const deviceIp = localStorage.getItem('deviceIp');
  if (deviceIp) {
    window.open(`http://${deviceIp}`, '_blank');
    showNotification(`Membuka halaman OTA di ${deviceIp}`);
  } else {
    showNotification("IP perangkat belum diketahui. Tunggu koneksi MQTT.", "warning");
  }
});

// Download modal logic
const downloadBtn = document.getElementById("downloadBtn");
const downloadModal = document.getElementById("downloadModal");
const closeModal = document.getElementById("closeModal");
const downloadCSV = document.getElementById("downloadCSV");
const downloadExcel = document.getElementById("downloadExcel");

downloadBtn.addEventListener('click', () => downloadModal.classList.add('show'));
closeModal.addEventListener('click', () => downloadModal.classList.remove('show'));
window.addEventListener('click', (e) => { 
  if (e.target === downloadModal) downloadModal.classList.remove('show'); 
});

function downloadCSVFile() {
  if (logData.length === 0) { 
    showNotification("Tidak ada data untuk diunduh", "warning"); 
    return; 
  }
  
  let csv = "Waktu,Kelembaban Tanah (%),Suhu (°C)\n";
  logData.forEach(r => {
    csv += `"${r.timestamp}",${r.soil_moisture},${r.temperature}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); 
  a.href = url; 
  a.download = `soil_monitoring_log_${new Date().toISOString().slice(0,10)}.csv`; 
  a.style.display='none'; 
  document.body.appendChild(a); 
  a.click(); 
  document.body.removeChild(a);
  
  showNotification("Data berhasil diunduh dalam format CSV");
}

function downloadExcelFile() {
  if (logData.length === 0) { 
    showNotification("Tidak ada data untuk diunduh", "warning"); 
    return; 
  }
  
  let html = `<table><tr><th>Waktu</th><th>Kelembaban Tanah (%)</th><th>Suhu (°C)</th></tr>`;
  logData.forEach(r => {
    html += `<tr><td>${r.timestamp}</td><td>${r.soil_moisture}</td><td>${r.temperature}</td></tr>`;
  });
  html += `</table>`;
  
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); 
  a.href = url; 
  a.download = `soil_monitoring_log_${new Date().toISOString().slice(0,10)}.xls`; 
  a.style.display='none'; 
  document.body.appendChild(a); 
  a.click(); 
  document.body.removeChild(a);
  
  showNotification("Data berhasil diunduh dalam format Excel");
}

downloadCSV.addEventListener('click', () => { 
  downloadCSVFile(); 
  downloadModal.classList.remove('show'); 
});

downloadExcel.addEventListener('click', () => { 
  downloadExcelFile(); 
  downloadModal.classList.remove('show'); 
});

// Initialize UI defaults
updateBrokerConnection(false, "Broker: Menghubungkan...");
updateESP32Connection(false, "ESP32: Menghubungkan...");
updateModeUI();
updatePumpUI();
updatePumpControls();
currentThresholdMin.textContent = "30%";
currentThresholdMax.textContent = "70%";
thresholdMinInput.value = "30";
thresholdMaxInput.value = "70";