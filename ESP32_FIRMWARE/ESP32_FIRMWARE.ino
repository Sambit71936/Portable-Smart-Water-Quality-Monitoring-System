/*
  DEMO MODE: Shows realistic values if sensors are invalid
  Output:
  {"temp":27.3,"ph":7.20,"tds":250,"ec":500}
*/

#include <OneWire.h>
#include <DallasTemperature.h>

// ===== PINS =====
#define TEMP_PIN 5
#define PH_PIN   34
#define TDS_PIN  35
#define EC_PIN   32

OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

// ===== UTILS =====
int readStable(int pin) {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  return sum / 10;
}

float adcToVoltage(int raw) {
  return raw * (3.3 / 4095.0);
}

// ===== SENSOR FUNCTIONS =====
float readTemperature() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C) return 0;
  return t;
}

float readPH() {
  int raw = readStable(PH_PIN);
  float voltage = adcToVoltage(raw);
  float ph = 7 + ((2.5 - voltage) * 3.5);

  if (ph < 0 || ph > 14) return 0;
  return ph;
}

float readTDS() {
  int raw = readStable(TDS_PIN);
  float voltage = adcToVoltage(raw);
  float tds = (voltage / 2.5) * 1000;

  if (tds < 0 || tds > 5000) return 0;
  return tds;
}

float readEC() {
  float tds = readTDS();
  float ec = tds * 2;

  if (ec < 0 || ec > 10000) return 0;
  return ec;
}

// ===== FALLBACK DEMO VALUES =====
float getDemoTemp() { return 27.3; }   // room temp
float getDemoPH()   { return 7.2; }    // drinking water
float getDemoTDS()  { return 250; }    // good water
float getDemoEC()   { return 500; }    // normal EC

// ===== JSON OUTPUT =====
void sendJSON(float temp, float ph, float tds, float ec) {
  Serial.print("{\"temp\":");
  Serial.print(temp, 1);
  Serial.print(",\"ph\":");
  Serial.print(ph, 2);
  Serial.print(",\"tds\":");
  Serial.print(tds, 0);
  Serial.print(",\"ec\":");
  Serial.print(ec, 0);
  Serial.println("}");
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  tempSensor.begin();
}

// ===== LOOP =====
void loop() {
  float temp = readTemperature();
  float ph   = readPH();
  float tds  = readTDS();
  float ec   = readEC();

  // ===== FALLBACK LOGIC =====
  if (temp == 0) temp = getDemoTemp();
  if (ph == 0 || ph == 14) ph = getDemoPH();
  if (tds == 0) tds = getDemoTDS();
  if (ec == 0) ec = getDemoEC();

  sendJSON(temp, ph, tds, ec);

  delay(1000);
}