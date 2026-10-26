# AQUA Monitor - Quick Start (Arduino Serial Mode)

## 🚀 Getting Started (30 seconds)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
- Opens Electron window with your app
- Dev server runs at http://localhost:5173
- Electron auto-reloads on code changes

### 3. Connect Arduino
1. Plug Arduino into USB
2. Click **"CONNECT DEVICE"** button (top right)
3. Select COM port from list
4. Click **"Connect"**
5. Watch dashboard update in real-time! 🎉

---

## 📡 Arduino Code (Copy-Paste Ready)

```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  float temp = 25.5;      // Get from your temp sensor
  float ph = 7.2;         // Get from your pH sensor
  int tds = 200;          // Get from your TDS sensor
  int ec = 400;           // Get from your EC sensor
  
  // Send in this exact format:
  Serial.print(temp);
  Serial.print(",");
  Serial.print(ph);
  Serial.print(",");
  Serial.print(tds);
  Serial.print(",");
  Serial.println(ec);
  
  delay(1000);  // Send every 1 second
}
```

---

## 🎯 What Each Sensor Reads

| Sensor | Range | Unit | What It Means |
|--------|-------|------|---------------|
| Temperature | 0-50°C | °C | Water heat level |
| pH | 0-14 | pH | Acidity/Alkalinity |
| TDS | 0-5000 | ppm | Total Dissolved Solids |
| EC | 0-10000 | μS/cm | Electrical Conductivity |

---

## 🟢 Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 CONNECTED (COM3) | Arduino synced | Monitor readings |
| 🔴 DISCONNECTED | No Arduino | Click CONNECT |
| ⚠️ Error message | Connection failed | Check cable/code |

---

## 📊 Dashboard Updates

When connected and sending data:
- ✅ Temperature card updates
- ✅ pH card updates  
- ✅ TDS/EC cards update
- ✅ Risk level recalculates
- ✅ History logs new reading
- ✅ Recommendations auto-generate

---

## 🔴 Risk Levels

```
LOW      → All parameters optimal ✓
MODERATE → Some slight issues ⚠️
HIGH     → Critical problems ✗
```

Example:
- Temp: 27°C (warm, ok)
- pH: 8.8 (too alkaline) ⚠️
- TDS: 150 (good)
- **Result: MODERATE risk**

---

## 📚 File Structure

```
electron/
  └── main.cjs              ← Handles serial communication
src/
  ├── services/
  │   └── SerialService.js  ← Data parsing & validation
  ├── components/
  │   ├── Header.jsx        ← CONNECT DEVICE button
  │   └── SerialPortModal.jsx ← Port selector
  └── context/
      └── WaterQualityContext.jsx ← State management
```

---

## 🐛 Quick Fixes

**"No ports detected?"**
→ Install [Arduino USB drivers](https://www.arduino.cc/en/software)

**"Connection failed?"**
→ Check Arduino Serial Monitor shows data at 9600 baud

**"Data not updating?"**
→ Check format: `number,number,number,number`

---

## 📖 Full Documentation
See [SERIAL_SETUP.md](./SERIAL_SETUP.md) for:
- Complete Arduino sketch
- Detailed sensor setup
- Customization options
- Troubleshooting guide
- API reference

---

**Ready to go! Happy monitoring! 💧**
