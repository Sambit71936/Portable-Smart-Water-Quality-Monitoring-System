# AQUA Monitor - Arduino Serial Integration Setup Guide

## Overview
Your AQUA Monitor app now supports real-time Arduino sensor data via USB serial connection using Electron. This guide covers setup, usage, and troubleshooting.

---

## ✅ Implementation Summary

### New Features Added:
1. **Electron Desktop App** - Native USB serial port access
2. **Serial Service** - Data parsing and validation
3. **Connect Device Button** - Port selection and management
4. **Real-Time Updates** - Live sensor data integration
5. **Status Indicators** - Connection status display
6. **Error Handling** - Connection error alerts

### Files Created:
```
electron/
  ├── main.cjs          - Electron app launcher & serial manager
  └── preload.cjs       - IPC bridge (secure)

src/
  ├── services/
  │   └── SerialService.js    - Data parsing & serial API
  ├── components/
  │   └── SerialPortModal.jsx - Port selection UI
  └── context/
      └── WaterQualityContext.jsx (UPDATED)
```

---

## 🔧 Running the App

### Start Development Server:
```bash
npm run dev
```

This runs:
- Vite dev server (http://localhost:5173)
- Electron app window (displays dev server)
- Dev tools enabled for debugging

### Build for Production:
```bash
npm run build
```

Then run:
```bash
npm run electron
```

---

## 📡 Arduino Setup

### Hardware Requirements:
- Arduino board (Uno, Nano, Mega, etc.)
- USB cable (A-to-B for standard Arduino)
- 3 sensors:
  - Temperature sensor (e.g., DS18B20, DHT22)
  - pH sensor with ADC
  - TDS/EC sensor

### Arduino Code Example:

```cpp
// Include required libraries
#include <OneWire.h>
#include <DallasTemperature.h>

// Pin definitions
#define TEMP_PIN 10
#define PH_PIN A0
#define TDS_PIN A1

OneWire oneWire(TEMP_PIN);
DallasTemperature temperatureSensor(&oneWire);

void setup() {
  Serial.begin(9600);
  temperatureSensor.begin();
}

void loop() {
  // Read temperature
  temperatureSensor.requestTemperatures();
  float temp = temperatureSensor.getTempCByIndex(0);
  
  // Read pH (0-14 scale, map from 0-1023)
  int phRaw = analogRead(PH_PIN);
  float ph = (phRaw / 1023.0) * 14.0;
  
  // Read TDS (0-5000 ppm, map from 0-1023)
  int tdsRaw = analogRead(TDS_PIN);
  int tds = (tdsRaw / 1023.0) * 5000;
  
  // EC is proportional to TDS (roughly tds * 2 for this example)
  int ec = tds * 2;
  
  // Send formatted: temperature,ph,tds,ec
  Serial.print(temp);
  Serial.print(",");
  Serial.print(ph);
  Serial.print(",");
  Serial.print(tds);
  Serial.print(",");
  Serial.println(ec);
  
  // Send every 1 second
  delay(1000);
}
```

### Data Format:
```
27.5,7.2,180,320
├─ Temperature: 27.5°C
├─ pH: 7.2
├─ TDS: 180 ppm
└─ EC: 320 μS/cm
```

---

## 🎯 Using the App

### 1. Connect Arduino
- Plug Arduino into USB port
- Click **"CONNECT DEVICE"** button in header
- Modal opens showing available COM ports
- Select Arduino port (usually `COM3`, `COM4`, etc.)
- Click **"Connect"**

### 2. Monitor Status
- Connection indicator updates (green = connected)
- Shows connected port name
- Error messages display if connection fails

### 3. View Live Data
- Dashboard updates in real-time with each reading
- Metrics: Temperature, pH, TDS, EC
- Risk level auto-calculates (LOW, MODERATE, HIGH)
- History auto-logs each reading
- Recommendations auto-generate

### 4. Disconnect
- Click **"CONNECT DEVICE"** button again
- Modal shows connected port
- Click **"Disconnect"**
- Status indicator turns red

---

## 📊 Data Validation & Quality Assessment

### Temperature Check:
- ✓ Optimal: 15-25°C
- ⚠ Warning: 5-15°C or 25-35°C
- ✗ Error: <5°C or >35°C

### pH Check:
- ✓ Optimal: 6.5-8.5
- ⚠ Warning: 6.0-6.5 or 8.5-9.0
- ✗ Error: <6.0 or >9.0

### TDS Check (ppm):
- ✓ Optimal: 100-300
- ⚠ Warning: 300-500
- ✗ Error: >500

### Risk Levels:
- **LOW**: All parameters within range
- **MODERATE**: Some parameters slightly off
- **HIGH**: Critical parameters out of range

---

## 🐛 Troubleshooting

### No Ports Detected
- Check Arduino USB cable connection
- Install [Arduino USB drivers](https://www.arduino.cc/en/software)
- Try different USB port on computer
- Restart the app

### Connection Fails
- Verify Arduino is programmed and powered
- Check baud rate is 9600 in Arduino code
- Look at serial monitor in Arduino IDE for debugging
- Try selecting port again

### Data Not Updating
- Check Arduino is sending serial data (use Arduino Serial Monitor)
- Verify data format: `number,number,number,number\n`
- Check for parsing errors in browser console (F12)
- Restart connection

### Invalid Data Warnings
- Data outside expected ranges (see validation above)
- Sensor calibration needed
- Check sensor wiring and power supply
- Adjust range limits in [SerialService.js](src/services/SerialService.js)

---

## 🔒 Security Notes
- Electron uses context isolation for IPC security
- Preload script whitelist-only exposes safe APIs
- Serial data validated before processing
- No remote module loading

---

## 📈 Customization

### Change Baud Rate:
Edit [electron/main.cjs](electron/main.cjs) line ~67:
```javascript
baudRate: 115200  // Change from 9600
```

### Adjust Sensor Ranges:
Edit [src/services/SerialService.js](src/services/SerialService.js) in `parseArduinoData()`:
```javascript
if (temp < -10 || temp > 60) { ... }  // Adjust temperature range
if (ph < 0 || ph > 14) { ... }        // Adjust pH range
```

### Change Quality Assessment Logic:
Edit `assessWaterQuality()` in [SerialService.js](src/services/SerialService.js):
```javascript
if (temp < 5 || temp > 35) {          // Adjust thresholds
  risk = 'HIGH'
}
```

---

## 📝 API Reference

### SerialService Methods:

```javascript
import { SerialService, SerialDataParser } from './services/SerialService'

// List available ports
const ports = await SerialService.listPorts()
// Returns: [{ path: 'COM3', manufacturer: 'Arduino LLC', ... }]

// Connect to port
const result = await SerialService.connect('COM3', 9600)
// Returns: { success: true, message: '...' }

// Disconnect
const result = await SerialService.disconnect()

// Get status
const status = await SerialService.getStatus()
// Returns: { connected: true, port: 'COM3' }

// Setup listeners
const cleanup = SerialService.setupListeners(
  (parsed) => console.log(parsed),    // onData
  (error) => console.error(error),    // onError
  () => console.log('Disconnected')   // onDisconnect
)

// Parse raw data
const data = SerialDataParser.parseArduinoData('27.5,7.2,180,320')
// Returns: { temp: 27.5, ph: 7.2, tds: 180, ec: 320, valid: true, ... }

// Assess quality
const assessment = SerialDataParser.assessWaterQuality(data)
// Returns: { risk: 'LOW', status: '...', recommendation: '...' }
```

### Context Hook:

```javascript
import { useWaterQuality } from './context/WaterQualityContext'

const MyComponent = () => {
  const {
    // Serial state
    isConnected,
    connectedPort,
    serialError,
    availablePorts,
    liveMode,
    
    // Serial methods
    connectToPort,
    disconnectFromPort,
    refreshSerialPorts,
    updateFromSerial,
    toggleMode,
    
    // Metrics (updated from serial)
    metrics
  } = useWaterQuality()
}
```

---

## 🚀 Next Steps

1. **Build and ship** the Electron app
   - Use `electron-builder` for packaging (.exe, .msi, etc.)

2. **Add calibration UI**
   - Create per-sensor calibration tools

3. **Data export**
   - CSV/JSON export of collected readings

4. **Advanced analytics**
   - Trend analysis, anomaly detection

5. **Mobile companion**
   - React Native app for remote monitoring

---

## 📞 Support Resources

- **Arduino IDE**: https://www.arduino.cc/
- **Electron Docs**: https://www.electronjs.org/docs
- **SerialPort Npm**: https://serialport.io/
- **Vite Docs**: https://vitejs.dev/

---

**Generated for AQUA Monitor v1.0.0**
**Last Updated: April 2026**
