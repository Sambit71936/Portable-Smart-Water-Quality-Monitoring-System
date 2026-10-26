# Testing & Deployment Guide

## Quick Start Testing

### Phase 1: Hardware Setup (5 minutes)

1. **Connect ESP32 to Computer**
   - Plug ESP32 via USB
   - Check Device Manager (COM port should appear)
   - Note the COM port (e.g., COM3, COM4)

2. **Upload Firmware**
   - Open Arduino IDE
   - File → Open → Select `ESP32_FIRMWARE.ino`
   - Select Board: "ESP32 Dev Module"
   - Select Port: Your COM port
   - Tools → Upload Speed: 115200
   - Press Upload

3. **Verify Upload**
   - Look for "[ESP32] Water Quality Monitor initialized"
   - Should see data every second in Serial Monitor

### Phase 2: App Testing (10 minutes)

1. **Start App in Dev Mode**
   ```bash
   npm run dev  # Starts Vite dev server
   ```

2. **Open Electron App**
   ```bash
   npm run electron  # In another terminal
   ```

3. **Click "CONNECT SENSOR" Button**
   - Select your ESP32 COM port
   - Click "Connect"
   - Status should show "CONNECTED (COMx)"

4. **Watch Gauge Cards**
   - Should show temperature, pH, TDS, EC values
   - Values should update every ~1 second
   - Look for timestamp updates

### Phase 3: Test Edge Cases

#### Test Case 1: Normal Data
**Expected:** ✅ All values display correctly
```json
{"temp":25.3,"ph":7.52,"tds":142,"ec":284}
```

#### Test Case 2: Zero/Low Values
**Expected:** ✅ Shows "0" not blank
```json
{"temp":5.2,"ph":7.0,"tds":0,"ec":15}
```

#### Test Case 3: Connection Loss
1. Unplug ESP32
2. **Expected:** After ~5 seconds, shows "No data received. Check sensor connection..."
3. **Expected:** UI does NOT freeze
4. Plug back in
5. **Expected:** Resumes data display

#### Test Case 4: Invalid Data
Modify firmware to send:
```json
{"temp":"invalid","ph":7.5,"tds":100,"ec":200}
```
**Expected:** Parser rejects, shows "No data received..."

---

## Debug Checklist

### ✓ Serial Communication
- [ ] ESP32 shows "[ESP32]" messages in Serial Monitor
- [ ] App shows "[Serial]" messages in Dev Tools console
- [ ] Baud rate is 9600 (both ESP32 and app)
- [ ] Data arrives every 1 second

### ✓ Data Parsing
- [ ] "[Parser] Raw input:" logs show JSON
- [ ] "[Parser] Parsed values:" shows extracted numbers
- [ ] No "NaN" values in parsed output
- [ ] "[Parser] Final result:" shows valid readings

### ✓ UI Display
- [ ] Gauge cards show numbers (not blank)
- [ ] Fallback "—" shows only when appropriate
- [ ] Status message changes as expected
- [ ] "Updated:" timestamp refreshes every second

### ✓ No UI Freeze
- [ ] Can click buttons while data arrives
- [ ] Can disconnect/reconnect without freezing
- [ ] Animations continue smoothly
- [ ] No console errors

---

## Sensor Calibration

### pH Calibration (Two-Point)

1. **Get Two Reference Solutions**
   - pH 4.0 buffer solution
   - pH 7.0 buffer solution

2. **Measure ADC Values**
   - Modify firmware, add at end of setup():
   ```cpp
   void printCalibrationValues() {
     Serial.println("\n=== CALIBRATION MODE ===");
     for (int i = 0; i < 50; i++) {
       int val = analogRead(PH_SENSOR_PIN);
       Serial.print("ADC: ");
       Serial.println(val);
       delay(200);
     }
   }
   ```
   - Dip probe in pH 4.0, record ~10 readings, average them
   - Dip probe in pH 7.0, record ~10 readings, average them

3. **Update Firmware**
   ```cpp
   const int PH_ADC_POINT1 = 370;  // Your measured pH 4 value
   const int PH_ADC_POINT2 =490;  // Your measured pH 7 value
   ```

### TDS Calibration (EC Meter Method)

1. **Get TDS Standard Solution**
   - 1500 ppm standard is recommended

2. **Measure and Compare**
   - Read TDS from our sensor
   - Compare to reference meter
   - Adjust `TDS_CALIBRATION` multiplier

3. **Formula**
   ```cpp
   const float TDS_CALIBRATION = referenceValue / ourValue;
   ```

### Temperature Calibration

1. **Use Reference Thermometer**
   - Read DS18B20 temperature
   - Compare to reference thermometer
   - Note difference

2. **Update Offset**
   ```cpp
   const float tempOffset = referenceTemp - ourTemp;
   ```

---

## Deployment Checklist

### Before Release

- [ ] ESP32 firmware tested with real sensors
- [ ] All four sensors calibrated
- [ ] pH calibration verified (±0.5 pH accuracy)
- [ ] TDS/EC calibration verified (±5% accuracy)
- [ ] Connection recovery tested (unplug/replug)
- [ ] Edge case data tested (zeros, nulls, limits)
- [ ] UI responsive during data flow
- [ ] No console errors or warnings
- [ ] Timestamps accurate and updating
- [ ] Debug logs show clean data flow

### Build for Release

```bash
# Build Vite app
npm run build

# Build Electron distribution
npm run electron:build

# Creates executables in /dist folder
```

### Troubleshooting Checklist

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "No serial ports detected" | ESP32 not plugged in | Check USB cable, drivers |
| Connection succeeds but no data | Wrong baud rate | Set both to 9600 |
| Data arrives but shows "—" | Parser rejects valid data | Check range validation |
| "No data received" message stays | ESP32 stopped sending | Check ESP32 firmware |
| Gauge card shows 0 for all | Wrong calibration | Re-calibrate sensors |
| Values change wildly | ADC noise | Add capacitor to sensor line |
| Connection drops frequently | Serial timeout | Check USB port power |

---

## Performance Optimization

### Reduce UI Updates
If gauges flicker, adjust averaging:

```javascript
// In ESP32_FIRMWARE.ino
const unsigned long SEND_INTERVAL = 2000; // Send every 2 seconds instead of 1
```

### Reduce History Size
If app slows down:

```javascript
// In WaterQualityContext.jsx
setHistory(prev => [newEntry, ...prev].slice(0, 50))  // Keep last 50 instead of 100
```

### Reduce Buffer Size
If memory is low:

```javascript
// In SerialService.js
static MAX_READINGS = 3  // Average last 3 readings instead of 5
```

---

## API Reference

### ESP32 JSON Format
```json
{
  "temp": 25.3,    // Temperature in °C
  "ph": 7.52,      // pH (0-14)
  "tds": 142,      // Total Dissolved Solids in ppm
  "ec": 284        // Electrical Conductivity in µS/cm
}
```

### React Context Metrics
```javascript
metrics: {
  temp: 25.3,              // Current temperature or null
  ph: 7.52,                // Current pH or null
  tds: 142,                // Current TDS or null
  ec: 284,                 // Current EC or null
  risk: 'LOW',             // LOW, MODERATE, or HIGH
  confidence: 98.5,        // Confidence percentage
  status: 'Optimal',       // Status message
  lastUpdate: '2:34 PM',   // Last update time
  dataReceived: true,      // Has received at least one valid reading
  noDataTimeout: false     // Timeout status
}
```

---

## Support Resources

- **Electron Serial**: https://github.com/serialport/node-serialport
- **ESP32 Setup**: https://github.com/espressif/arduino-esp32
- **DS18B20 Library**: https://github.com/milesburton/Arduino-Temperature-Control-Library
- **React Docs**: https://react.dev

---

## Common Modifications

### Change Auto-Timeout Duration
```javascript
// In WaterQualityContext.jsx
dataTimeoutRef.current = setTimeout(() => {
  setMetrics(prev => ({
    ...prev,
    status: 'No data received...'
  }))
}, 10000)  // Changed from 5000ms to 10000ms
```

### Change Sensor Ranges
```javascript
// In SerialService.js
static RANGES = {
  temp: { min: -30, max: 150 },  // Industrial temp range
  ph: { min: 0, max: 14 },
  tds: { min: 0, max: 10000 },   // Higher TDS limit
  ec: { min: 0, max: 50000 }
}
```

### Add New Sensor
1. Update ESP32 to read new sensor
2. Update JSON format
3. Add card in Dashboard.jsx
4. Update context metrics
5. Add validation in parser

---

## Final Verification

Run this final checklist:

```
✓ ESP32 firmware uploaded
✓ Serial data shows in Arduino Serial Monitor
✓ App connects to ESP32
✓ Gauge cards show values
✓ "—" shows only when no data
✓ Status message changes appropriately
✓ Zero values display (not rejected)
✓ No UI freezes
✓ Disconnect/reconnect works
✓ All sensors calibrated
```

**Ready for deployment!** 🚀

