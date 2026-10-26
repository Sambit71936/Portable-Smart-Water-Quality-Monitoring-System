# ESP32 Setup Guide - Water Quality Monitoring

This guide explains how to set up your ESP32 to send real-time water quality data to your React/Electron app.

## Overview

Your app expects **JSON-formatted sensor data** from the ESP32, sent via USB serial at **115200 baud**:

```json
{"temp":25.6,"ph":7.53,"tds":85,"ec":235}
```

One JSON object per line, sent every ~1 second.

---

## ESP32 Arduino Sketch

Upload this code to your ESP32 using the Arduino IDE:

```cpp
// Water Quality Sensor - ESP32
// Sends sensor data as JSON via Serial at 115200 baud
// One JSON object per line, every 1 second

// ===== SENSOR PIN CONFIGURATION =====
const int TEMP_SENSOR_PIN = A0;      // Temperature sensor analog pin
const int PH_SENSOR_PIN = A1;        // pH sensor analog pin
const int TDS_SENSOR_PIN = A2;       // TDS sensor analog pin
const int EC_SENSOR_PIN = A3;        // EC sensor analog pin

// ===== CALIBRATION VALUES =====
// Adjust these based on your specific sensors
const float TEMP_OFFSET = 0.0;       // Temperature offset in °C
const float TEMP_SCALE = 1.0;        // Temperature scale factor
const float PH_OFFSET = 0.0;         // pH offset
const float PH_SCALE = 1.0;          // pH scale factor
const float TDS_SCALE = 1.0;         // TDS scale factor
const float EC_SCALE = 1.0;          // EC scale factor

// ===== FILTER SETTINGS =====
const int MOVING_AVG_SIZE = 5;       // Number of readings to average
float tempReadings[MOVING_AVG_SIZE];
float phReadings[MOVING_AVG_SIZE];
float tdsReadings[MOVING_AVG_SIZE];
float ecReadings[MOVING_AVG_SIZE];
int readingIndex = 0;

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 1000;  // Send every 1 second

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("{\"status\":\"ESP32 Water Quality Sensor Started\"}");
  
  // Initialize reading arrays
  for (int i = 0; i < MOVING_AVG_SIZE; i++) {
    tempReadings[i] = 0;
    phReadings[i] = 0;
    tdsReadings[i] = 0;
    ecReadings[i] = 0;
  }
}

void loop() {
  // Send data at specified interval
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    readSensors();
    sendData();
    lastSendTime = millis();
  }
  
  // Keep loop responsive
  delay(50);
}

void readSensors() {
  // Read analog values from sensors
  int tempRaw = analogRead(TEMP_SENSOR_PIN);
  int phRaw = analogRead(PH_SENSOR_PIN);
  int tdsRaw = analogRead(TDS_SENSOR_PIN);
  int ecRaw = analogRead(EC_SENSOR_PIN);
  
  // Convert analog to sensor values (examples - adjust for your sensors)
  float temp = convertTemp(tempRaw);
  float ph = convertPH(phRaw);
  float tds = convertTDS(tdsRaw);
  float ec = convertEC(ecRaw);
  
  // Apply moving average filter
  tempReadings[readingIndex] = temp;
  phReadings[readingIndex] = ph;
  tdsReadings[readingIndex] = tds;
  ecReadings[readingIndex] = ec;
  
  readingIndex = (readingIndex + 1) % MOVING_AVG_SIZE;
}

float convertTemp(int rawValue) {
  // Example conversion (adjust based on your sensor)
  // DS18B20: use Dallas Temperature library instead
  float voltage = (rawValue / 1023.0) * 5.0;
  float tempC = (voltage - 0.5) * 100.0;  // LM35 formula
  return (tempC * TEMP_SCALE) + TEMP_OFFSET;
}

float convertPH(int rawValue) {
  // Example conversion (adjust based on your pH sensor)
  // Typical analog pH sensor: 0-5V = 0-14 pH
  float voltage = (rawValue / 1023.0) * 5.0;
  float pH = voltage * 2.8;  // Calibration factor (adjust to your sensor)
  return (pH * PH_SCALE) + PH_OFFSET;
}

float convertTDS(int rawValue) {
  // Example conversion (adjust based on your TDS sensor)
  // Typical: 0V = 0 ppm, 5V = 2000 ppm
  float voltage = (rawValue / 1023.0) * 5.0;
  float tds = voltage * 500.0;  // Calibration factor
  return tds * TDS_SCALE;
}

float convertEC(int rawValue) {
  // Example conversion (adjust based on your EC sensor)
  // Typical: 0V = 0 µS/cm, 5V = 2000 µS/cm
  float voltage = (rawValue / 1023.0) * 5.0;
  float ec = voltage * 1000.0;  // Calibration factor
  return ec * EC_SCALE;
}

float getAverage(float* readings) {
  float sum = 0;
  for (int i = 0; i < MOVING_AVG_SIZE; i++) {
    sum += readings[i];
  }
  return sum / MOVING_AVG_SIZE;
}

void sendData() {
  float avgTemp = getAverage(tempReadings);
  float avgPH = getAverage(phReadings);
  float avgTDS = getAverage(tdsReadings);
  float avgEC = getAverage(ecReadings);
  
  // Build JSON string with proper formatting
  char jsonBuffer[128];
  snprintf(jsonBuffer, sizeof(jsonBuffer),
    "{\"temp\":%.1f,\"ph\":%.2f,\"tds\":%.0f,\"ec\":%.0f}",
    avgTemp, avgPH, avgTDS, avgEC);
  
  // Send JSON via Serial
  Serial.println(jsonBuffer);
}
```

---

## Alternative: Simple Test Sketch

If you just want to test the app's data reception, use this simpler sketch:

```cpp
// Simple test sketch - generates simulated sensor data
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("{\"status\":\"Ready\"}");
}

void loop() {
  float temp = 20.0 + random(0, 15) + random(0, 100) / 100.0;
  float ph = 6.5 + random(0, 20) / 10.0;
  float tds = 50 + random(0, 400);
  float ec = 100 + random(0, 800);
  
  char json[128];
  snprintf(json, sizeof(json),
    "{\"temp\":%.1f,\"ph\":%.2f,\"tds\":%.0f,\"ec\":%.0f}",
    temp, ph, tds, ec);
  
  Serial.println(json);
  delay(1000);
}
```

---

## Upload Instructions

1. **Open Arduino IDE**
2. Install **ESP32 Board Package** (if not already installed):
   - File → Preferences → Additional Board Manager URLs
   - Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board Manager → Search "esp32" → Install

3. **Select Board**:
   - Tools → Board → ESP32 Dev Module

4. **Select Serial Port**:
   - Tools → Port → COM3 (or your USB port)

5. **Set Baud Rate**:
   - Tools → Upload Speed → 115200

6. **Copy-paste the sketch** above into Arduino IDE

7. **Upload**: Click Upload button

---

## Verification Steps

### 1. Check Serial Monitor
- Open Arduino IDE → Serial Monitor (Ctrl+Shift+M)
- Set baud rate to **115200**
- You should see JSON data every 1 second:
  ```
  {"temp":24.5,"ph":7.2,"tds":120,"ec":240}
  {"temp":24.6,"ph":7.2,"tds":121,"ec":241}
  ```

### 2. Test in Your App

**In Dashboard:**
1. Click **CONNECT SENSOR**
2. Select your ESP32's COM port (e.g., COM3, /dev/ttyUSB0)
3. Click **Connect**
4. Watch the gauges update in real-time

**Check Console for Debugging:**
- Open DevTools (F12)
- Go to Console tab
- Look for logs like:
  ```
  [SerialService] Data event received: {"temp":24.5,"ph":7.2,"tds":120,"ec":240}
  [Parser] Parsed values: {temp: 24.5, ph: 7.2, tds: 120, ec: 240}
  ```

### 3. Troubleshooting

| Issue | Solution |
|-------|----------|
| **No JSON appearing in Serial Monitor** | Check baud rate is 115200; verify sensor pins are correct |
| **Invalid JSON format** | Ensure `snprintf()` is used correctly; test with simple sketch first |
| **App shows "No sensor connected"** | Verify COM port is correct; check Device Manager for port name |
| **"Parse error" in console** | JSON may have trailing spaces; ensure exactly one object per line |
| **Inconsistent readings** | Increase `MOVING_AVG_SIZE` or check sensor calibration |

---

## Sensor Calibration

### Temperature (DS18B20 Recommended)
Use the OneWire library for accurate readings:
```cpp
#include <OneWire.h>
#include <DallasTemperature.h>

OneWire oneWire(GPIO_PIN);
DallasTemperature sensors(&oneWire);

void setup() {
  sensors.begin();
}

float getTemp() {
  sensors.requestTemperatures();
  return sensors.getTempCByIndex(0);
}
```

### pH Sensor
- Calibrate with pH 4.0 and pH 7.0 buffer solutions
- Adjust `PH_OFFSET` and `PH_SCALE` based on readings

### TDS/EC Sensor
- Use known conductivity standards
- Calibrate at 1413 µS/cm (common reference)
- Adjust `TDS_SCALE` and `EC_SCALE` accordingly

---

## Real-Time Data Flow

```
ESP32 (sends JSON every 1s)
    ↓ Serial USB (115200 baud)
Electron Main Process
    ↓ IPC channel
React Frontend
    ↓ State update
Dashboard Gauges (update every 1s)
```

---

## Next Steps

1. ✅ Upload sketch to ESP32
2. ✅ Verify JSON in Serial Monitor
3. ✅ Connect app to COM port
4. ✅ Check live data on Dashboard
5. 🔄 Calibrate sensors based on reference values
6. 📊 Monitor History tab for data logging

---

## Support

If data isn't flowing:
1. Check Serial Monitor manually first
2. Verify JSON format has no extra whitespace
3. Review browser console for parsing errors
4. Try the simple test sketch to rule out sensor issues

Good luck! 🚀
