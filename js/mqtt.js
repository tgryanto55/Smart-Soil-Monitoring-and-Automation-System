// MQTT functionality
const broker = "wss://broker.emqx.io:8084/mqtt";
const topicSub = "farm/telemetry";
const topicPubThreshold = "farm/cmd/threshold";
const topicPubPump = "farm/cmd/pump";
const topicPubMode = "farm/cmd/mode";

let lastMessageTime = 0;
const connectionTimeout = 15000;
const esp32Timeout = 30000;

// MQTT 
const client = mqtt.connect(broker, {
  clientId: "web_dashboard_" + Math.random().toString(16).substr(2, 8),
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 2000
});

client.on("connect", () => {
  console.log("Connected to MQTT broker");
  updateBrokerConnection(true, "Broker: Terhubung");
  client.subscribe(topicSub, (err) => { 
    if (!err) console.log("Subscribed:", topicSub); 
  });
});

client.on("reconnect", () => { 
  console.log("reconnecting..."); 
  updateBrokerConnection(false, "Broker: Menghubungkan ulang..."); 
});

client.on("offline", () => { 
  console.log("offline"); 
  updateBrokerConnection(false, "Broker: Terputus"); 
});

client.on("error", (err) => { 
  console.error("MQTT error", err); 
  updateBrokerConnection(false, "Broker: Error"); 
});

client.on("message", (topic, message) => {
  lastMessageTime = Date.now();
  updateESP32Connection(true, "ESP32: Terhubung");
  try {
    const data = JSON.parse(message.toString());
    
    if (data.soil !== undefined) {
      updateSoil(data.soil);
    }
    if (data.temp !== undefined) {
      updateTemperature(data.temp);
    }
    
    if (data.threshold_min !== undefined) {
      currentThresholdMin.textContent = data.threshold_min + "%";
    }
    if (data.threshold_max !== undefined) {
      currentThresholdMax.textContent = data.threshold_max + "%";
    }
    // Handle backward compatibility with single threshold
    if (data.threshold !== undefined && data.threshold_min === undefined) {
      currentThresholdMin.textContent = "30%";
      currentThresholdMax.textContent = data.threshold + "%";
    }
    
    if (data.pump !== undefined) {
      pumpState = !!data.pump;
      updatePumpUI();
    }
    if (data.manual !== undefined) {
      isManualMode = !!data.manual;
      updateModeUI();
      updatePumpControls();
    }

    // Store device IP for OTA
    if (data.ip !== undefined) {
      localStorage.setItem('deviceIp', data.ip);
    }
  } catch (e) {
    console.error("Invalid JSON from MQTT:", e);
  }
});

// connection health check
setInterval(() => {
  const now = Date.now();
  if (lastMessageTime > 0 && now - lastMessageTime > esp32Timeout) {
    updateESP32Connection(false, "ESP32: Terputus");
  }
}, 5000);

// Publish threshold changes
function publishThreshold(min, max) {
  if (min >= max) {
    showNotification("Nilai minimum harus lebih kecil dari maksimum", "error");
    return;
  }
  
  const payload = { threshold_min: parseInt(min), threshold_max: parseInt(max) };
  client.publish(topicPubThreshold, JSON.stringify(payload));
  currentThresholdMin.textContent = min + "%";
  currentThresholdMax.textContent = max + "%";
  console.log("Published threshold:", payload);
  
  // Update soil status with new thresholds
  updateSoilStatus(parseInt(soilPercentEl.innerText));
  
  // Show notification
  showNotification(`Batas kelembaban berhasil diubah menjadi ${min}% - ${max}%`);
}

// Publish mode changes
function publishMode(manual) {
  const payload = { manual: manual };
  client.publish(topicPubMode, JSON.stringify(payload));
  console.log("Published mode:", payload);
  
  // Show notification
  const modeText = manual ? "Manual" : "Auto";
  showNotification(`Mode berhasil diubah ke ${modeText}`);
}

// Publish pump commands
function publishPump(state) {
  const payload = { state: state ? 1 : 0 };
  client.publish(topicPubPump, JSON.stringify(payload));
  console.log("Published pump command:", payload);
  
  // Show notification
  const pumpText = state ? "HIDUP" : "MATI";
  showNotification(`Pompa berhasil di${pumpText.toLowerCase()}`);
}