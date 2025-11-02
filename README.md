# 🌱 Smart Soil Monitoring and Automation System

A web-based dashboard for monitoring soil moisture and temperature with real-time MQTT connectivity.

---

## 🚀 Features

### Hardware & Firmware (ESP32)
- Real-time Sensor Monitoring: Soil moisture and temperature sensing
- Automated Irrigation: Automatic pump control based on moisture thresholds
- Manual Control: Manual override for pump control
- MQTT Communication: Cloud connectivity for remote monitoring
- OTA Updates: Wireless firmware updates via web interface
- LCD Display: Local status display with I2C
- Data Persistence: Save settings to ESP32 flash memory
- Sensor Calibration: Custom calibration for YL-69 soil sensor
### Web Dashboard
- Real-time Monitoring: Live soil moisture and temperature data
- Interactive Charts: Display last 5 data points for clear visualization
- Control System: Manual and automatic control modes
- Pump Control: Remote pump control with status monitoring
- Data Logging: Automatic data logging with export functionality
- Theme Support: Dark/Light theme toggle
- Responsive Design: Works on desktop, tablet, and mobile devices
- OTA Support: One-click access to device OTA update page

--- 

## 🔧 Hardware Components

- ESP32 Development Board  
- Soil Moisture Sensor (YL-69)  
- DS18B20 Temperature Sensor  
- Relay Module (for water pump)  
- 16x2 I2C LCD Display

---

## 📂 File Structure

```bash
smart-soil-monitoring/
├── index.html                  # Main HTML file
├── css/
│   └── style.css               # All CSS styles and responsive design
├── js/
│   ├── login.js                # Login/logout functionality
│   ├── dashboard.js            # Dashboard controls and UI interactions
│   ├── mqtt.js                 # MQTT connection and messaging
│   ├── chart.js                # Chart initialization and updates (5 data points)
│   ├── theme.js                # Theme switching functionality
│   └── notification.js         # Notification system
├── firmware/
│   ├── SmartSoilMonitoring.ino # arduino code for esp32
└── README.md
```

---

## ⚙️ Pin Configuration

```bash
Soil Moisture  ->  GPIO 34 (Analog)
DS18B20        ->  GPIO 4 (OneWire)
Relay           ->  GPIO 27
LCD I2C         ->  GPIO 21 (SDA), GPIO 22 (SCL)
```

---

## ⚙️ Installation & Setup

### 🧩 1. Hardware Setup
- Connect components according to pin configuration  
- Power ESP32 with a 5V source  
- Connect soil sensor to soil  
- Connect pump to relay and water source  

---

### 💻 2. ESP32 Firmware Setup
1. Install **Arduino IDE**
2. Install the required libraries:
   - WiFi  
   - PubSubClient  
   - OneWire  
   - DallasTemperature  
   - ArduinoJson  
   - Preferences  
   - LiquidCrystal_I2C  
   - WebServer  
   - Update  
3. Update WiFi credentials in the code:

```cpp
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
```
4. Upload `SmartSoilMonitoring.ino` to ESP32
   
---

### 🌐 3. Web Dashboard Setup
- Ensure all files maintain the correct **folder structure**  
- Open `index.html` in a web browser  
- No server required — runs directly in browser  

---

### 🔑 4. Login Credentials

```bash
Username: admin
Password: admin
```

---

## 🧭 MQTT Configuration

**Broker**
- Web Dashboard → `wss://broker.emqx.io:8084/mqtt`  
- ESP32 Firmware → `broker.emqx.io`

---

### 📡 Topics
```bash
farm/telemetry      # Sensor data from ESP32
farm/cmd/threshold  # Set moisture thresholds
farm/cmd/pump       # Manual pump control
farm/cmd/mode       # Auto/Manual mode switch
farm//status       # Auto/Manual mode switch
```

---

## 🚀 Usage

### 🖥️ Web Dashboard Features

---

#### 🌱 **Sensor Monitoring**
- Real-time **soil moisture** (0–100%)  
- Real-time **temperature readings**  
- Status indicators:
  - Soil: 🟤 *Dry* / 🟢 *Optimal* / 🔵 *Wet*  
  - Temp: ❄️ *Cold* / 🌤️ *Normal* / 🔥 *Hot*

---

#### ⚙️ **Control System**
- Set **moisture thresholds** (min/max)  
- Switch between **Auto** and **Manual** modes  
- **Manual pump control** via dashboard  

---

#### 📊 **Data Visualization**
- **Chart** displays the **last 5 data points** for easy trend analysis  
- **Data log table** shows recent sensor readings  
- **Export data** as `.csv` or `.xlsx` (Excel format)

---

### ⚡ ESP32 Operation Modes

---

#### 🤖 **Automatic Mode**
- System automatically controls pump based on **soil moisture thresholds**  
- Pump turns **ON** when moisture ≤ `threshold_min`  
- Pump turns **OFF** when moisture ≥ `(threshold_min + 5)`  
- Includes **5-second debounce** to prevent rapid cycling  

---

#### 🧠 **Manual Mode**
- Direct **manual control** of the water pump via web dashboard  
- Overrides automatic control logic  
- Provides **real-time status feedback** on dashboard  

---

### 🔄 OTA Update Access
- Access ESP32 OTA interface: `http://[ESP32_IP]/`
- Upload new firmware directly through the **web browser**  
- Includes **progress tracking** and **status updates**  

---

## ⚙️ Technical Specifications

---

### 🔧 **Sensor Calibration**
The system includes calibration for the **YL-69 soil sensor**:
- **Dry value:** `2800` (in air)  
- **Wet value:** `1200` (in water)  
- Values can be adjusted directly in the firmware code if needed.  

---

### 💾 **Data Handling**
- Soil moisture sampling: **10 readings averaged** for stability  
- Data transmission interval: **Every 3 seconds**  
- Chart displays **last 5 data points** only  
- Pump debounce: **5 seconds minimum** between state changes  

---

### ⚙️ **Configuration Settings**
- Default moisture thresholds: **Min 30%**, **Max 70%**  
- Configurable via **Web Dashboard**  
- Values are **stored in ESP32 flash memory** (persistent after reboot)

---

## 🧩 Troubleshooting

---

### 📶 **WiFi Connection Failed**
- Check **SSID** and **password** in ESP32 code  
- Verify **WiFi signal strength**  
- Check **Serial Monitor** for connection status  

---

### 🔗 **MQTT Connection Issues**
- Verify **broker address** (`broker.emqx.io` or your custom broker)  
- Check **internet connectivity**  
- Monitor **Serial output** for MQTT connection logs  

---

### 🌱 **Sensor Readings Incorrect**
- Check **wiring connections**  
- Verify **sensor calibration values** (`DRY_VALUE` / `WET_VALUE`)  
- Observe **raw ADC readings** via Serial Monitor  

---

### ⚡ **Pump Not Working**
- Check **relay wiring**  
- Verify **pump power supply**  
- Test **relay manually** via dashboard (Manual Mode)  

---

### 💻 **Web Dashboard Not Loading**
- Open **browser console** (`F12 → Console`) to check for errors  
- Ensure **all files** are in the correct folder structure  
- Verify **MQTT broker connectivity**  

---

## 🧠 Serial Debug Information

The ESP32 continuously outputs detailed debug logs via **Serial Monitor**, including:
- 📡 WiFi connection status  
- 🔗 MQTT connection state  
- 🌱 Sensor readings (raw ADC & converted values)  
- 💧 Pump control actions  
- 🔄 OTA update progress  

---

## 🔄 OTA Update Process

1. Find ESP32 **IP address** from Serial Monitor or LCD display  
2. Access the OTA interface in your browser: `(http://[ESP32_IP]/)`
3. Select the firmware `.bin` file  
4. Click **“Update Firmware”**  
5. Monitor the **progress bar** until complete  
6. Device will **automatically restart** after a successful update  

---

## 🌐 Browser Support

The web dashboard works on all modern browsers:
- **Google Chrome** 60+  
- **Mozilla Firefox** 55+  
- **Safari** 12+  
- **Microsoft Edge** 79+  

---

## 📦 Dependencies

---

### ⚙️ **ESP32 Firmware**
Required Arduino libraries:
- `WiFi.h`  
- `PubSubClient.h`  
- `OneWire.h`  
- `DallasTemperature.h`  
- `ArduinoJson.h`  
- `Preferences.h`  
- `LiquidCrystal_I2C.h`  
- `WebServer.h`  
- `Update.h`  

---

### 💻 **Web Dashboard**
Frontend dependencies (loaded via CDN):
- **Font Awesome 6.5.0** – icons  
- **Chart.js** – data visualization  
- **MQTT.js** – MQTT client for real-time updates  

> 💡 *No installation needed — all libraries are loaded via CDN.*

---

## 🧰 Maintenance

- Clean **soil moisture sensor** regularly  
- Check **pump** for clogs or damage  
- Monitor **battery level** (if battery-powered)  
- **Update firmware** periodically for new features  
- **Recalibrate sensors** as needed  

---

## ⚠️ Safety Notes

- Ensure **proper waterproofing** for all electronic components  
- Verify **pump compatibility** with the water source  
- Follow **electrical safety** guidelines  
- **Disconnect power** before maintenance  
- Use **appropriate fuses** and **circuit protection**  

---

## 📜 License

This project is **open-source** and available under the **MIT License**.  
You are free to modify, distribute, and use it for any purpose.  

---

## 💬 Support

For issues or questions:
- Check the **Serial Monitor** for debug output  
- Verify **hardware connections** and **MQTT broker** status  
- Review **browser console logs** for web dashboard errors  
- Create an **Issue** on the GitHub repository for help or suggestions  

