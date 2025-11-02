#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WebServer.h>
#include <Update.h>

// ================== KONFIGURASI ==================
#define WIFI_SSID "alah mbuh"
#define WIFI_PASSWORD "22334455"
#define MQTT_SERVER "broker.emqx.io"
#define MQTT_PORT 1883

// ================== TOPIC MQTT ==================
const char* TOPIC_TELEMETRY = "farm/telemetry";
const char* TOPIC_CMD_THRESHOLD = "farm/cmd/threshold";
const char* TOPIC_CMD_PUMP = "farm/cmd/pump";
const char* TOPIC_CMD_MODE = "farm/cmd/mode";
const char* TOPIC_STATUS = "farm/status";

// ================== PIN ==================
#define ONE_WIRE_BUS 4
#define SOIL_PIN 34
#define RELAY_PIN 27

// ================== OBJEK ==================
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
WiFiClient espClient;
PubSubClient mqttClient(espClient);
Preferences prefs;
LiquidCrystal_I2C lcd(0x27, 16, 2);
WebServer server(80);

// ================== VARIABEL ==================
int threshold_min = 30;
int threshold_max = 70;
bool pumpState = false;
bool manualMode = false;

// Kalibrasi sensor YL-69 dengan 3.3V
const int DRY_VALUE = 2800;    // Nilai ketika sensor kering (di udara)
const int WET_VALUE = 1200;    // Nilai ketika sensor basah (di air)

// Stabilizer
float filteredSoil = 0;
const int NUM_SAMPLES = 10;
const unsigned long DEBOUNCE_TIME = 5000;
unsigned long lastPumpChange = 0;

// ================== DEKLARASI FUNGSI ==================
void mqttCallback(char* topic, byte* payload, unsigned int length);
void connectMQTT();
int readSoilMoisture();
void sendTelemetry();

// ================== HALAMAN WEB OTA ==================
const char* loginHTML = R"rawliteral(
<!DOCTYPE HTML>
<html>
<head>
  <title>ESP32 OTA Update - Smart Soil Monitoring</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --primary: #10b981;
      --primary-dark: #059669;
      --bg-dark: #0f172a;
      --card-bg: #1e293b;
      --text-light: #e2e8f0;
      --text-muted: #94a3b8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --switch-bg: #475569;
    }
    
    * { 
      box-sizing: border-box; 
      margin: 0;
      padding: 0;
    }
    
    body {
      background-color: var(--bg-dark);
      color: var(--text-light);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      transition: all 0.3s ease;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      line-height: 1.5;
    }

    .ota-container {
      background: var(--card-bg);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 450px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .ota-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .ota-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      font-size: 1.5rem;
    }

    .ota-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--text-light);
    }

    .ota-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .ota-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .file-input-wrapper {
      position: relative;
      overflow: hidden;
      display: inline-block;
      width: 100%;
    }

    .file-input {
      position: absolute;
      left: -9999px;
    }

    .file-input-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      border: 2px dashed var(--switch-bg);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(0,0,0,0.05);
      gap: 0.75rem;
    }

    .file-input-label:hover {
      border-color: var(--primary);
      background: rgba(16, 185, 129, 0.05);
    }

    .file-input-label i {
      font-size: 2rem;
      color: var(--primary);
    }

    .file-input-text {
      color: var(--text-light);
      font-weight: 500;
    }

    .file-input-hint {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .upload-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
    }

    .upload-btn:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }

    .upload-btn:disabled {
      background: var(--switch-bg);
      cursor: not-allowed;
      transform: none;
    }

    .progress-section {
      margin-top: 1.5rem;
      display: none;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .progress-bar {
      background: var(--switch-bg);
      border-radius: 10px;
      overflow: hidden;
      height: 12px;
    }

    .progress-fill {
      background: var(--primary);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
      border-radius: 10px;
    }

    .status-message {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      display: none;
    }

    .status-success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .status-error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .status-info {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    @media (max-width: 480px) {
      .ota-container {
        padding: 1.5rem;
      }
      
      .ota-logo {
        width: 50px;
        height: 50px;
        font-size: 1.25rem;
      }
      
      .ota-title {
        font-size: 1.25rem;
      }
      
      .file-input-label {
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="ota-container">
    <div class="ota-header">
      <div class="ota-logo">
        <i class="fa-solid fa-seedling"></i>
      </div>
      <div>
        <h1 class="ota-title">OTA Update</h1>
        <p class="ota-subtitle">Smart Soil Monitoring System</p>
      </div>
    </div>
    
    <form method='POST' action='#' enctype='multipart/form-data' id='upload_form' class="ota-form">
      <div class="file-input-wrapper">
        <input type="file" name="update" class="file-input" id="fileInput">
        <label for="fileInput" class="file-input-label" id="fileInputLabel">
          <i class="fa-solid fa-cloud-upload-alt"></i>
          <span class="file-input-text">Pilih file firmware</span>
          <span class="file-input-hint">Klik atau seret file .bin ke sini</span>
        </label>
      </div>
      
      <button type="submit" class="upload-btn" id="uploadBtn" disabled>
        <i class="fa-solid fa-upload"></i>
        Update Firmware
      </button>
    </form>
    
    <div class="progress-section" id="progressSection">
      <div class="progress-label">
        <span>Progress</span>
        <span id="progressPercent">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
    </div>
    
    <div class="status-message" id="statusMessage"></div>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const fileInput = document.getElementById('fileInput');
      const fileInputLabel = document.getElementById('fileInputLabel');
      const uploadBtn = document.getElementById('uploadBtn');
      const progressSection = document.getElementById('progressSection');
      const progressFill = document.getElementById('progressFill');
      const progressPercent = document.getElementById('progressPercent');
      const statusMessage = document.getElementById('statusMessage');
      
      // Handle file selection
      fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          const fileName = this.files[0].name;
          fileInputLabel.innerHTML = `
            <i class="fa-solid fa-file-code"></i>
            <span class="file-input-text">${fileName}</span>
            <span class="file-input-hint">File siap diupload</span>
          `;
          uploadBtn.disabled = false;
        }
      });
      
      // Drag and drop functionality
      fileInputLabel.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#10b981';
        this.style.background = 'rgba(16, 185, 129, 0.1)';
      });
      
      fileInputLabel.addEventListener('dragleave', function() {
        this.style.borderColor = '';
        this.style.background = '';
      });
      
      fileInputLabel.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '';
        this.style.background = '';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          fileInput.files = e.dataTransfer.files;
          const fileName = e.dataTransfer.files[0].name;
          fileInputLabel.innerHTML = `
            <i class="fa-solid fa-file-code"></i>
            <span class="file-input-text">${fileName}</span>
            <span class="file-input-hint">File siap diupload</span>
          `;
          uploadBtn.disabled = false;
        }
      });
      
      // Handle form submission
      document.getElementById('upload_form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!fileInput.files || !fileInput.files[0]) {
          showStatus('Pilih file firmware terlebih dahulu', 'error');
          return;
        }
        
        const formData = new FormData(this);
        const xhr = new XMLHttpRequest();
        
        // Show progress
        progressSection.style.display = 'block';
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengupload...';
        
        // Progress tracking
        xhr.upload.addEventListener('progress', function(e) {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = percent + '%';
            progressPercent.textContent = percent + '%';
          }
        });
        
        // Completion handler
        xhr.addEventListener('load', function() {
          if (xhr.status === 200) {
            showStatus('Update berhasil! Device akan restart...', 'success');
            progressFill.style.width = '100%';
            progressPercent.textContent = '100%';
            uploadBtn.innerHTML = '<i class="fa-solid fa-check"></i> Berhasil';
            
            // Redirect after delay
            setTimeout(function() {
              showStatus('Redirecting...', 'info');
            }, 2000);
          } else {
            showStatus('Update gagal: ' + xhr.responseText, 'error');
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Update Firmware';
          }
        });
        
        // Error handler
        xhr.addEventListener('error', function() {
          showStatus('Error terjadi selama upload', 'error');
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Update Firmware';
        });
        
        xhr.open('POST', '/update');
        xhr.send(formData);
      });
      
      function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message';
        
        switch(type) {
          case 'success':
            statusMessage.classList.add('status-success');
            break;
          case 'error':
            statusMessage.classList.add('status-error');
            break;
          case 'info':
            statusMessage.classList.add('status-info');
            break;
        }
        
        statusMessage.style.display = 'block';
      }
    });
  </script>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/js/all.min.js"></script>
</body>
</html>
)rawliteral";

// ================== SETUP ==================
void setup(void) {
  Serial.begin(115200);
  
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Matikan relay awal
  
  sensors.begin();

  lcd.begin();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  
  // Setup Web Server untuk OTA
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", loginHTML);
  });

  server.on("/update", HTTP_POST, []() {
    server.send(200, "text/plain", (Update.hasError()) ? "FAIL" : "OK");
    ESP.restart();
  }, []() {
    HTTPUpload& upload = server.upload();
    if (upload.status == UPLOAD_FILE_START) {
      Serial.printf("Update: %s\n", upload.filename.c_str());
      if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
        Update.printError(Serial);
      }
    } else if (upload.status == UPLOAD_FILE_WRITE) {
      if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
        Update.printError(Serial);
      }
    } else if (upload.status == UPLOAD_FILE_END) {
      if (Update.end(true)) {
        Serial.printf("Update Success: %u bytes\n", upload.totalSize);
      } else {
        Update.printError(Serial);
      }
    }
  });

  server.begin();
  Serial.println("HTTP server started");

  // MQTT Setup
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  
  // Load threshold dari preferences
  prefs.begin("soil_cfg", true);
  threshold_min = prefs.getInt("th_min", 30);
  threshold_max = prefs.getInt("th_max", 70);
  prefs.end();
  
  Serial.printf("Started with thresholds: %d-%d\n", threshold_min, threshold_max);
  Serial.printf("Sensor calibration - Dry: %d, Wet: %d\n", DRY_VALUE, WET_VALUE);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected");
  lcd.setCursor(0, 1);
  lcd.print("IP:");
  lcd.print(WiFi.localIP().toString());
  delay(2000);
}

// ================== MQTT CALLBACK ==================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) message += (char)payload[i];

  Serial.printf("MQTT Received [%s]: %s\n", topic, message.c_str());

  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) return;

  if (String(topic) == TOPIC_CMD_THRESHOLD) {
    if (doc.containsKey("threshold_min") && doc.containsKey("threshold_max")) {
      int new_min = doc["threshold_min"];
      int new_max = doc["threshold_max"];
      if (new_min >= 0 && new_min <= 100 && new_max >= 0 && new_max <= 100 && new_min < new_max) {
        threshold_min = new_min;
        threshold_max = new_max;
        prefs.begin("soil_cfg", false);
        prefs.putInt("th_min", threshold_min);
        prefs.putInt("th_max", threshold_max);
        prefs.end();
        
        Serial.printf("Threshold updated: %d-%d\n", threshold_min, threshold_max);
      }
    }
  }

  if (String(topic) == TOPIC_CMD_PUMP) {
    if (manualMode && doc.containsKey("state")) {
      pumpState = doc["state"] == 1;
      digitalWrite(RELAY_PIN, !pumpState); // Active LOW relay
      Serial.println(pumpState ? "Pump turned ON" : "Pump turned OFF");
    }
  }

  if (String(topic) == TOPIC_CMD_MODE) {
    if (doc.containsKey("manual")) {
      manualMode = doc["manual"];
      Serial.println(manualMode ? "Switched to Manual mode" : "Switched to Auto mode");
      
      if (!manualMode) {
        // Turn off pump when switching to auto mode
        pumpState = false;
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("Pump turned OFF - Auto mode activated");
      }
    }
  }
}

// ================== MQTT CONNECT ==================
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting MQTT...");
    
    String clientId = "ESP32_Soil_Monitor_" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("CONNECTED!");
      
      mqttClient.subscribe(TOPIC_CMD_THRESHOLD);
      mqttClient.subscribe(TOPIC_CMD_PUMP);
      mqttClient.subscribe(TOPIC_CMD_MODE);
    } else {
      Serial.print("FAILED, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retry in 2s...");
      delay(2000);
    }
  }
}

// ================== BACA SENSOR ==================
int readSoilMoisture() {
  long totalSoil = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    totalSoil += analogRead(SOIL_PIN);
    delay(2);
  }
  int soilADC = totalSoil / NUM_SAMPLES;
  
  // Debug: Tampilkan nilai ADC mentah
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 10000) {
    lastDebug = millis();
    Serial.printf("Soil ADC Raw: %d\n", soilADC);
  }
  
  // Konversi nilai ADC ke persentase
  soilADC = constrain(soilADC, WET_VALUE, DRY_VALUE);
  int soilPercent = map(soilADC, DRY_VALUE, WET_VALUE, 0, 100);
  return constrain(soilPercent, 0, 100);
}

// ================== KIRIM DATA SENSOR ==================
void sendTelemetry() {
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);
  
  // Handle sensor error
  if (tempC == DEVICE_DISCONNECTED_C) {
    tempC = -127.0;
  }
  
  int soilPercent = readSoilMoisture();
  filteredSoil = (0.7 * filteredSoil) + (0.3 * soilPercent);
  soilPercent = round(filteredSoil);
  
  // Kontrol otomatis pompa
  if (!manualMode) {
    unsigned long now = millis();
    if (!pumpState && soilPercent <= threshold_min && (now - lastPumpChange > DEBOUNCE_TIME)) {
      pumpState = true;
      digitalWrite(RELAY_PIN, LOW);
      lastPumpChange = now;
      Serial.printf("AUTO: Pump ON - Soil %d%% <= %d%%\n", soilPercent, threshold_min);
    }
    if (pumpState && soilPercent >= (threshold_min + 5) && (now - lastPumpChange > DEBOUNCE_TIME)) {
      pumpState = false;
      digitalWrite(RELAY_PIN, HIGH);
      lastPumpChange = now;
      Serial.printf("AUTO: Pump OFF - Soil %d%% >= %d%%\n", soilPercent, threshold_min + 5);
    }
  }
  
  DynamicJsonDocument doc(512);
  doc["temp"] = round(tempC * 10) / 10.0;
  doc["soil"] = soilPercent;
  doc["pump"] = pumpState;
  doc["manual"] = manualMode;
  doc["threshold_min"] = threshold_min;
  doc["threshold_max"] = threshold_max;
  doc["ip"] = WiFi.localIP().toString();

  String telemetry;
  serializeJson(doc, telemetry);
  mqttClient.publish(TOPIC_TELEMETRY, telemetry.c_str());
  
  // Update LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("H:");
  lcd.print(soilPercent);
  lcd.print("% T:");
  lcd.print(tempC, 1);
  lcd.print("C");
  lcd.setCursor(0, 1);
  lcd.print(manualMode ? "M " : "A ");
  lcd.print("P:");
  lcd.print(pumpState ? "ON " : "OFF");
  lcd.print(" T:");
  lcd.print(threshold_min);
  lcd.print("-");
  lcd.print(threshold_max);
}

// ================== LOOP ==================
void loop(void) {
  server.handleClient(); // Handle OTA requests

  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  static unsigned long lastSend = 0;
  if (millis() - lastSend > 3000) {
    lastSend = millis();
    sendTelemetry();
  }
}