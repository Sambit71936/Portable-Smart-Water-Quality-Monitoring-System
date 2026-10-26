# Real-Time ESP32 Serial Communication Guide

## ✅ Setup Complete

Your React + Electron application is now configured for real-time serial communication with the ESP32 at **115200 baud rate**.

---

## 🔧 Architecture Overview

### Data Flow
```
ESP32 (Hardware)
    ↓ JSON via UART (115200 baud)
Electron Main Process (IPC Handler)
    ↓ serial-data event
React Frontend (Via IPC Bridge)
    ↓ Parse & Update State
Water Quality Context
    ↓ Real-time UI Updates
Dashboard Component
```

### Key Components

1. **Electron Main Process** (`electron/main.cjs`)
   - Reads serial data from COM port
   - Buffers incomplete lines
   - Emits IPC events for each complete JSON packet
   - No blocking or delays

2. **Preload Bridge** (`electron/preload.cjs`)
   - Exposes safe IPC methods to React
   - Manages listener lifecycle with proper references
   - Handles error isolation

3. **Serial Service** (`src/services/SerialService.js`)
   - JSON parser with validation
   - Handles NaN values safely
   - Averages last 5 readings for smooth updates
   - Calibration support

4. **Water Quality Context** (`src/context/WaterQualityContext.jsx`)
   - State management for connection & metrics
   - Listener setup/cleanup
   - 5-second timeout for data monitoring
   - Live mode toggle

5. **UI Components**
   - **Header.jsx**: Shows connection status + data streaming indicator
   - **Dashboard.jsx**: Displays real-time gauge metrics
   - **SerialPortModal.jsx**: Port selection interface

---

## 📋 ESP32 Firmware Requirements

Your ESP32 must send JSON data **every second** at **115200 baud**:

```json
{"temp":25.6,"ph":7.2,"tds":100,"ec":200}
```

### Sensor Readings
- **temp**: Temperature in °C
- **ph**: pH value (0-14)
- **tds**: Total Dissolved Solids in ppm
- **ec**: Electrical Conductivity in µS/cm

### Example Arduino Sketch (MicroPython equivalent)
```python
import json
import time
from machine import UART, Pin

# Initialize serial (UART 0, TX=GPIO1, RX=GPIO3)
uart = UART(0, baudrate=115200)

while True:
    # Read from your sensors here
    temp = 25.6  # DS18B20
    ph = 7.2     # pH probe
    tds = 100    # TDS sensor
    ec = 200     # Conductivity sensor
    
    # Create JSON packet
    data = {
        "temp": temp,
        "ph": ph,
        "tds": tds,
        "ec": ec
    }
    
    # Send JSON with newline
    uart.write(json.dumps(data) + '\n')
    
    # Wait 1 second before next reading
    time.sleep(1)
```

---

## 🚀 Running the Application

### Development
```bash
npm run dev
```

This starts:
- Vite dev server on http://localhost:5173
- Electron app with DevTools
- Hot reload enabled

### Production Build
```bash
npm run build
npm start
```

---

## 🔌 Connection Steps

1. **Connect ESP32 via USB** to your computer
2. **Open the app** and wait for Electron window
3. **Click "CONNECT DEVICE"** button
4. **Select the COM port** (e.g., COM3)
5. **Click Connect** - waits for data
6. **Header updates** show:
   - 🔴 RED: Disconnected
   - 🟡 YELLOW: Connecting (no data yet)
   - 🟢 GREEN: Connected + data streaming

---

## 📊 Data Display

### Real-Time Indicators
- **Connection Status**: Shows port name + connection state
- **Data Streaming**: Shows if data is actively received
- **Last Update**: Timestamp of most recent data
- **Temperature Gauge**: 0-50°C with gradient animation
- **pH Gauge**: 0-14 scale
- **TDS Display**: Parts per million (ppm)
- **EC Display**: Micro Siemens per cm (µS/cm)

### No Connection State
- Shows placeholder cards
- "No sensor connected" message
- Connect button active

### Disconnected State
- Shows last known values
- "—" for missing metrics
- "Waiting for sensor data..." status

---

## 🔍 Debugging

### Check Serial Connection
```javascript
// In browser DevTools console
window.electronAPI.getSerialStatus()
// Returns: { connected: true, port: "COM3" }
```

### List Available Ports
```javascript
window.electronAPI.getSerialPorts()
// Returns: [
//   { path: "COM3", manufacturer: "FTDI", ... },
//   { path: "COM4", manufacturer: "Silicon Labs", ... }
// ]
```

### View Console Logs
1. Open Electron DevTools: **Ctrl + Shift + I**
2. Go to **Console** tab
3. Look for:
   - `[Serial]` - Main process logs
   - `[Parser]` - JSON parsing logs
   - `[SerialService]` - Frontend logs
   - `[Context]` - State management logs

### Common Issues

**Issue**: Port not appearing
- **Solution**: Install USB drivers (CH340, FT232, etc.)

**Issue**: "Connection failed" message
- **Solution**: 
  - Check baud rate is 115200
  - Check JSON format is valid
  - Look at DevTools console for exact error

**Issue**: Data not updating
- **Solution**:
  - Check ESP32 is sending data
  - Verify JSON format: `{"temp":X,"ph":Y,"tds":Z,"ec":W}`
  - Open DevTools and check `[Serial]` logs

**Issue**: Metrics show "—"
- **Solution**: 
  - Wait 2-3 seconds for first data packet
  - Check JSON has all 4 fields
  - Verify no NaN values in ESP32 readings

---

## 📈 Performance Tuning

### Baud Rate (Already Set to 115200)
- 9600: Older devices, reliable but slow
- **115200**: Modern ESP32, fast & stable ✓
- 230400: Very fast but requires good hardware

### Data Update Rate
- Default: 1 packet per second
- ESP32 can send every 100ms if needed
- Frontend updates in real-time (no throttling)

### Data Averaging
- Last 5 readings averaged for smooth display
- Helps reduce sensor noise
- Adjust `MAX_READINGS` in `SerialService.js`

### Memory
- Stores last 1000 readings in Electron memory
- Circular buffer (oldest readings deleted first)
- Retrieved via `getPortReadings()` API

---

## 🧪 Test Scenarios

### 1. Normal Operation ✓
```
Expected:
- Port shows as CONNECTED
- Header shows "LIVE DATA"
- Data Streaming indicator is GREEN
- All gauge values update in real-time
- Last update time changes every second
```

### 2. No Data (First 5 Seconds)
```
Expected:
- Port shows as CONNECTING...
- Header shows "WAITING FOR DATA"
- Data Streaming indicator is YELLOW
- After 5s: Shows "Waiting for sensor data..."
```

### 3. Sensor Disconnected
```
Expected:
- Error message in console
- Metrics freeze at last value
- After 5s: Shows "No data received"
- Can still see connection in header
```

### 4. Port Disconnection
```
Expected:
- Header shows DISCONNECTED
- All gauges show "—"
- Status shows "Disconnected"
- Must reconnect to resume
```

### 5. Invalid JSON
```
Expected:
- Console logs parsing error
- Metric not updated for that packet
- Continues waiting for next packet
- No crash or app hang
```

---

## 🛠️ Advanced Configuration

### Modify Baud Rate
Edit `src/context/WaterQualityContext.jsx`:
```javascript
// Line ~180, connectToPort function
const result = await SerialService.connect(portPath, 115200) // Change this
```

### Adjust Data Averaging
Edit `src/services/SerialService.js`:
```javascript
static MAX_READINGS = 5  // Change to desired window size
```

### Change Timeout Duration
Edit `src/context/WaterQualityContext.jsx`:
```javascript
dataTimeoutRef.current = setTimeout(() => {
    // ... 
}, 5000) // Change to milliseconds
```

### Add Sensor Calibration
Edit `src/services/SerialService.js`:
```javascript
static CALIBRATION = {
  tempOffset: 0,    // Add constant offset
  tempScale: 1.0,   // Multiply by scale factor
  phOffset: 0,
  phScale: 1.0,
  // ... etc
}
```

---

## 📦 File Structure

```
electron/
  ├── main.cjs          # Electron main process + IPC handlers
  └── preload.cjs       # IPC bridge to React

src/
  ├── context/
  │   └── WaterQualityContext.jsx  # State management
  ├── services/
  │   └── SerialService.js         # Parser + listener setup
  ├── components/
  │   ├── Header.jsx               # Connection indicator
  │   ├── SerialPortModal.jsx      # Port selector
  │   └── Dashboard.jsx            # Main metrics display
  └── pages/
      └── Dashboard.jsx            # Full page layout
```

---

## 🔐 Security Notes

1. **Data Validation**: All JSON is validated before use
2. **No Command Injection**: Serial data is not executed as code
3. **Type Safety**: NaN values are caught and handled
4. **Memory Safety**: Circular buffer prevents memory leaks
5. **Context Isolation**: Preload uses proper IPC bridge

---

## 📞 Support

### Check These First:
1. ESP32 firmware sending valid JSON at 115200 baud?
2. USB drivers installed for your FTDI/CH340 adapter?
3. Console logs show `[Serial]` messages?
4. DevTools open to see real-time data flow?

### Enable Verbose Logging
The application already logs everything. Check:
- `[Serial]` - Raw data from port
- `[Parser]` - JSON validation
- `[SerialService]` - Frontend events
- `[Context]` - State updates

---

## ✨ Summary

Your app now features:
- ✅ Live sensor data at 115200 baud
- ✅ Smooth real-time UI updates
- ✅ Robust error handling
- ✅ Connection status indicator
- ✅ Data averaging for stability
- ✅ 1000 reading history
- ✅ Comprehensive logging
- ✅ Zero static/cached values

All data is **live, real-time, and dynamic**! 🚀
