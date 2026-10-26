# Real-Time Serial Communication - Quick Test Checklist

## Pre-Flight Checklist

- [ ] ESP32 firmware sends JSON every 1 second
- [ ] Baud rate set to **115200**
- [ ] JSON format: `{"temp":X,"ph":Y,"tds":Z,"ec":W}`
- [ ] USB cable connected (data cable, not charge-only)
- [ ] USB drivers installed for your serial adapter
- [ ] Port visible in Device Manager/System Report

## Application Tests

### Test 1: Port Detection
```bash
npm run dev
```
- [ ] Electron app starts
- [ ] Click "CONNECT DEVICE"
- [ ] COM ports appear in modal
- [ ] Your ESP32 port listed (e.g., COM3)

### Test 2: Connection
- [ ] Select COM port
- [ ] Click "Connect"
- [ ] Header shows "CONNECTING..."
- [ ] After 1-2 seconds: "LIVE DATA (COM3)"
- [ ] "DATA STREAMING" indicator turns GREEN
- [ ] Modal closes

### Test 3: Live Data Reception
- [ ] Temperature gauge shows value (not "—")
- [ ] pH shows value
- [ ] TDS shows value
- [ ] EC shows value
- [ ] All values between valid ranges
- [ ] "Last Update" timestamp exists

### Test 4: Real-Time Updates
- [ ] Modify ESP32 sensor value
- [ ] Change temp by 1°C
- [ ] Wait 1 second
- [ ] Dashboard updates instantly
- [ ] No static values
- [ ] Smooth gauge animation

### Test 5: Error Handling
- [ ] Disconnect USB cable
- [ ] App shows "DISCONNECTED"
- [ ] After 5s: "No data received"
- [ ] No crash or errors
- [ ] Can reconnect without restart

### Test 6: Reconnection
- [ ] Reconnect USB
- [ ] Data received again
- [ ] Header shows "LIVE DATA" again
- [ ] Gauges update
- [ ] All working without app restart

### Test 7: Invalid Data
- [ ] Send malformed JSON: `{"temp":"abc"}`
- [ ] Console shows parse error
- [ ] Metrics don't update for that packet
- [ ] App continues running
- [ ] Next valid packet processes normally

### Test 8: Multiple Reconnects
- [ ] Connect/disconnect 3 times
- [ ] Each time works smoothly
- [ ] No memory leaks or hangs
- [ ] Listeners properly cleaned up

## Performance Checks

- [ ] CPU usage stays low (<5% idle)
- [ ] Memory stable (~200-300MB)
- [ ] No memory growth over time
- [ ] Smooth gauge animations (60fps)
- [ ] No lag when switching pages

## DevTools Console Checks

Open **Ctrl+Shift+I** → Console tab:

- [ ] `[Serial]` logs show incoming data
- [ ] `[Parser]` logs show successful parsing
- [ ] `[SerialService]` logs show data callbacks
- [ ] `[Context]` logs show state updates
- [ ] No red error messages
- [ ] No memory warnings

## Visual Confirmation

### Header Status Bar
- [ ] Connection indicator shows port
- [ ] Data streaming indicator present
- [ ] Colors correct (green = live, red = disconnected)
- [ ] Status text updates properly

### Dashboard Gauges
- [ ] Temperature: Shows value, colored gradient
- [ ] pH: Shows value, proper scale
- [ ] TDS: Shows value in ppm
- [ ] EC: Shows value in µS/cm
- [ ] All animated smoothly

### Status Messages
- [ ] "LIVE DATA (COM3)" when connected
- [ ] "WAITING FOR DATA" when connecting
- [ ] "DATA STREAMING" with green dot when receiving
- [ ] Last update time visible

## Data Validation

### Valid Ranges (After Acceptance)
```
Temperature:  -20 to 100°C ✓
pH:            0 to 14 ✓
TDS:           0 to 5000 ppm ✓
EC:            0 to 10000 µS/cm ✓
```

All values in range? ✓

### Zero Values
- [ ] TDS shows 0 (not blank)
- [ ] EC shows 0 (not blank)
- [ ] No NaN errors
- [ ] Valid in UI

## Troubleshooting If Failed

### Port Not Listed
```javascript
// In DevTools console:
window.electronAPI.getSerialPorts()
// Should show your device
```

### Connection Fails
1. Check COM port is correct
2. Verify 115200 baud rate
3. Look at `[Serial]` logs
4. Check DevTools for error details

### Data Not Updating
1. Check ESP32 is sending JSON
2. Verify JSON format is exact
3. Look for `[Parser]` errors
4. Check all 4 fields present

### Gauges Show "—"
1. Wait 2-3 seconds for first packet
2. Check `metrics.dataReceived` in console
3. Verify no NaN in ESP32 reading
4. Look at `[Parser]` logs

---

## Success Criteria ✓

- ✅ Live data visible in gauges
- ✅ Smooth real-time updates
- ✅ No static values
- ✅ Connection status accurate
- ✅ Error handling robust
- ✅ Reconnection works
- ✅ No crashes or hangs

Once all tests pass → **System Ready for Deployment** 🚀
