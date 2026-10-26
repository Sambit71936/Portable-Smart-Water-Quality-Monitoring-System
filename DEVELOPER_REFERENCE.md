# Real-Time Serial Communication - Developer Reference

## Quick Reference Guide

### Change Baud Rate

**File:** `src/context/WaterQualityContext.jsx` (Line ~168)
```javascript
// Change from:
const result = await SerialService.connect(portPath, 115200)
// To:
const result = await SerialService.connect(portPath, YOUR_BAUD_RATE)
```

Also update: `src/services/SerialService.js` (Line ~338)
```javascript
// Change default:
static async connect(portPath, baudRate = 115200)
// To:
static async connect(portPath, baudRate = YOUR_BAUD_RATE)
```

### Adjust Data Averaging

**File:** `src/services/SerialService.js` (Line ~11)
```javascript
// More readings = smoother but slower response
static MAX_READINGS = 5  // Change this number

// Recommended values:
// 1 = No averaging (raw data)
// 3-5 = Balanced smoothing (recommended)
// 10+ = Heavy smoothing (lag increases)
```

### Change No-Data Timeout

**File:** `src/context/WaterQualityContext.jsx` (Line ~135)
```javascript
// Current: 5 seconds
dataTimeoutRef.current = setTimeout(() => {
  // ...
}, 5000)  // Change milliseconds here

// Examples:
// 1000 = 1 second
// 3000 = 3 seconds
// 10000 = 10 seconds
```

### Add Sensor Calibration

**File:** `src/services/SerialService.js` (Line ~17)
```javascript
static CALIBRATION = {
  // Temperature correction
  tempOffset: 0,    // Add constant °C
  tempScale: 1.0,   // Multiply factor (0.5-1.5)
  
  // pH correction
  phOffset: 0,      // Add constant
  phScale: 1.0,     // Multiply factor
  
  // TDS correction
  tdsScale: 1.0,    // Multiply factor
  
  // Conductivity correction
  ecScale: 1.0      // Multiply factor
}

// Example: Temperature sensor reads 2°C too high
// tempOffset: -2.0

// Example: pH sensor reads 10% high
// phScale: 0.9
```

### Adjust Valid Sensor Ranges

**File:** `src/services/SerialService.js` (Line ~26)
```javascript
static RANGES = {
  temp: { min: -20, max: 100 },    // °C
  ph: { min: 0, max: 14 },         // pH scale
  tds: { min: 0, max: 5000 },      // ppm
  ec: { min: 0, max: 10000 }       // µS/cm
}

// Expand range if needed:
// temp: { min: -40, max: 150 }  // Wider range
```

---

## Add New Sensor

### Step 1: Update ESP32 Firmware
```json
{"temp":25.6,"ph":7.2,"tds":100,"ec":200,"humidity":65.5}
```

### Step 2: Extend Parser

**File:** `src/services/SerialService.js`
```javascript
// Add to RANGES
static RANGES = {
  // ... existing ...
  humidity: { min: 0, max: 100 }
}

// Add to CALIBRATION
static CALIBRATION = {
  // ... existing ...
  humidityOffset: 0,
  humidityScale: 1.0
}

// Add to parseArduinoData
const humidityParsed = parseFloat(jsonData.humidity)

// Add validation
if (isNaN(humidityParsed)) { /* error */ }

// Add to history tracking
static recentReadings = {
  // ... existing ...
  humidity: []
}

// Add averaging logic
static addReadingToHistory(reading) {
  // ... existing ...
  this.recentReadings.humidity.push(reading.humidity)
}

// Add to result object
const result = {
  // ... existing ...
  humidity: parseFloat(averagedReading.humidity.toFixed(1)),
  humidityRaw: parseFloat(humidity.toFixed(1))
}
```

### Step 3: Update Context

**File:** `src/context/WaterQualityContext.jsx`
```javascript
// Add to metrics state
const [metrics, setMetrics] = useState({
  // ... existing ...
  humidity: null
})

// Update setMetrics call
setMetrics({
  // ... existing ...
  humidity: parseFloat(parsed.humidity) || null
})
```

### Step 4: Display in UI

**File:** `src/pages/Dashboard.jsx` (or where gauges are)
```javascript
<div className="glass-panel rounded-xl p-6">
  <h3 className="text-on-surface-variant text-[10px] font-bold uppercase">
    Humidity
  </h3>
  <div className="flex items-baseline gap-1">
    <span className="text-4xl font-bold">
      {displayValue(metrics.humidity, '—')}
    </span>
    <span className="text-lg text-slate-400">%</span>
  </div>
  {/* Add gauge SVG similar to other metrics */}
</div>
```

---

## Debug Data Reception

### Check What's Being Sent
```javascript
// In Electron DevTools console:
// The app logs all raw data, look for [Serial] prefix
// Or run this to manually check:

const port = new SerialPort({ path: 'COM3', baudRate: 115200 })
port.on('data', (data) => console.log('Raw:', data.toString()))
```

### Verify JSON Format
```javascript
// In React DevTools console:
// Check parsed data from SerialService
console.log('Metrics:', metrics)

// Should show:
{
  temp: 25.6,
  ph: 7.2,
  tds: 100,
  ec: 200,
  valid: true,
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

### Monitor State Updates
```javascript
// In React DevTools console:
// Track when metrics update
window.addEventListener('storage', (e) => {
  if (e.key === 'metrics') console.log('Updated:', e.newValue)
})
```

---

## Optimize Performance

### Reduce Update Frequency
**File:** `electron/main.cjs`
```javascript
// Add debounce timer
let lastEmitTime = 0
const MIN_EMIT_INTERVAL = 500  // milliseconds

serialPort.on('data', (data) => {
  // ... existing buffer code ...
  
  const now = Date.now()
  if (now - lastEmitTime > MIN_EMIT_INTERVAL) {
    mainWindow.webContents.send('serial-data', /* ... */)
    lastEmitTime = now
  }
})
```

### Reduce History Size
**File:** `electron/main.cjs`
```javascript
// Change memory usage:
if (portReadings.length > 500) {  // Smaller than 1000
  portReadings.shift()
}
```

### Use Web Workers (Advanced)
Move JSON parsing to worker to not block UI:
```javascript
// Create worker-parser.js
self.onmessage = (e) => {
  const parsed = SerialDataParser.parseArduinoData(e.data)
  self.postMessage(parsed)
}

// In SerialService
const worker = new Worker('worker-parser.js')
worker.postMessage(rawData)
worker.onmessage = (e) => updateUI(e.data)
```

---

## Handle Different JSON Formats

### CSV Format Alternative
```python
# ESP32 sends: 25.6,7.2,100,200
# Instead of JSON

# Update parser:
static parseArduinoData(rawData) {
  try {
    const [temp, ph, tds, ec] = rawData.split(',').map(parseFloat)
    // ... validate and return ...
  }
}
```

### Multiple Sensor Nodes
```json
{
  "node": "basement",
  "temp": 25.6,
  "ph": 7.2,
  "tds": 100,
  "ec": 200
}
```

```javascript
// Update parser to handle node identifier
const node = jsonData.node  // Add to result
const id = `${node}-${Date.now()}`  // Unique ID
```

---

## Error Recovery Patterns

### Auto-Reconnect on Disconnect
```javascript
// In WaterQualityContext.jsx
serialPort.on('disconnect', async () => {
  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000))
  // Try to reconnect
  await connectToPort(connectedPort)
})
```

### Fallback to Demo Mode
```javascript
// If connection fails
if (!result.success && !liveMode) {
  setLiveMode(false)
  // Use demo data instead
  generateDemoData()
}
```

### Rate Limiting
```javascript
// Prevent too many connection attempts
const maxRetries = 5
let retryCount = 0

const attemptConnection = async () => {
  if (retryCount >= maxRetries) {
    showError("Max retries exceeded")
    return
  }
  try {
    await connectToPort(port)
    retryCount = 0
  } catch (e) {
    retryCount++
    setTimeout(attemptConnection, 2000)
  }
}
```

---

## Testing Utilities

### Send Test Data
```javascript
// Create test JSON strings
const testData = [
  '{"temp":20.0,"ph":7.0,"tds":100,"ec":200}',
  '{"temp":25.5,"ph":7.2,"tds":150,"ec":300}',
  '{"temp":30.0,"ph":6.8,"tds":200,"ec":400}'
]

// Simulate receiving:
testData.forEach(data => {
  // Manually trigger parser
  const parsed = SerialDataParser.parseArduinoData(data)
  console.log('Parsed:', parsed)
})
```

### Mock Serial Port
```javascript
// In tests:
jest.mock('serialport', () => {
  return {
    SerialPort: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      open: jest.fn(),
      close: jest.fn(),
      write: jest.fn()
    }))
  }
})
```

---

## Common Modifications

### Add Real-Time Alerts
```javascript
// In WaterQualityContext, after updateFromSerial:
if (metrics.temp > 30) {
  showAlert('Temperature too high!')
  playSound('alert.wav')
}
```

### Log to File
```javascript
// In main.cjs
const fs = require('fs')
const logStream = fs.createWriteStream('serial.log', { flags: 'a' })

serialPort.on('data', (data) => {
  logStream.write(`${new Date().toISOString()}: ${data}\n`)
})
```

### Send Commands to ESP32
```javascript
// In main.cjs
ipcMain.handle('send-serial-command', async (event, command) => {
  if (serialPort && serialPort.isOpen) {
    serialPort.write(command + '\n')
  }
})

// In React
window.electronAPI.sendSerialCommand('CALIBRATE_PH')
```

### Database Storage
```javascript
// Save readings to database instead of memory
const db = new Database('readings.db')

portReadings.push({
  data: rawString,
  timestamp: new Date().toISOString()
})

// Periodically sync to DB
setInterval(() => {
  db.insertMany(portReadings)
  portReadings = []
}, 60000)  // Every 60 seconds
```

---

## Performance Metrics

### Monitor in DevTools
```javascript
// Check memory usage
console.memory

// Check frame rate
// Lighthouse → Performance

// Check IPC performance
performance.mark('ipc-start')
// ... call IPC ...
performance.mark('ipc-end')
performance.measure('ipc', 'ipc-start', 'ipc-end')
console.table(performance.getEntriesByType('measure'))
```

---

## Advanced Topics

### Using TypeScript
```typescript
// Extend SerialDataParser.ts
interface SensorReading {
  temp: number
  ph: number
  tds: number
  ec: number
}

class SerialDataParser {
  static parseArduinoData(rawData: string): SensorReading | null {
    // Type-safe implementation
  }
}
```

### WebSocket Streaming (Remote Monitoring)
```javascript
// Send live data to remote server
ws.send(JSON.stringify({
  timestamp: new Date(),
  metrics: metrics
}))
```

### Electron Preload Utilities
```javascript
// Add helper to preload.cjs
contextBridge.exposeInMainWorld('serialUtils', {
  parseJSON: (str) => JSON.parse(str),
  formatDate: (ts) => new Date(ts).toLocaleString(),
  validateSensor: (data) => /* validation logic */
})
```

---

## Support Resources

- **Serialport Docs**: https://serialport.io/
- **Electron IPC**: https://www.electronjs.org/docs/api/ipc-main
- **React Hooks**: https://react.dev/reference/react/hooks
- **ESP32 Guides**: https://docs.espressif.com/

---

## Quick Answers

**Q: How to change COM port?**
A: Click "CONNECT DEVICE" and select different port

**Q: How to increase update speed?**
A: Reduce ESP32 sleep time, or change timeout to smaller value

**Q: How to see raw serial data?**
A: Open DevTools console, look for `[Serial]` logs

**Q: How to add more sensors?**
A: See "Add New Sensor" section above

**Q: How to store historical data?**
A: Modify portReadings array or add database

**Q: How to display data offline?**
A: Use historical data from getPortReadings() API

---

**Last Updated:** 2024 | Real-Time Serial Communication System
