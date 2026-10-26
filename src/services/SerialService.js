/**
 * Serial Service - Handles Arduino serial communication and data parsing
 * Arduino sends: temperature,ph,tds,ec (e.g., 27.5,7.2,180,320)
 */

export class SerialDataParser {
  // Store recent readings for averaging
  static recentReadings = {
    temp: [],
    ph: [],
    tds: [],
    ec: []
  }
  
  static MAX_READINGS = 5 // Keep last 5 readings for averaging

  /**
   * Sensor calibration factors (adjust based on your sensors)
   */
  static CALIBRATION = {
    tempOffset: 0,      // Temperature offset in °C
    tempScale: 1.0,     // Temperature scale factor
    phOffset: 0,        // pH offset
    phScale: 1.0,       // pH scale factor
    tdsScale: 1.0,      // TDS scale factor
    ecScale: 1.0        // EC scale factor
  }

  /**
   * Valid sensor ranges (includes 0 as valid for dry sensors)
   */
  static RANGES = {
    temp: { min: -20, max: 100 },     // Temperature in °C (allows wider range for robustness)
    ph: { min: 0, max: 14 },          // pH scale
    tds: { min: 0, max: 5000 },       // TDS in ppm (0 = distilled water)
    ec: { min: 0, max: 10000 }        // EC in µS/cm (0 = pure water)
  }

  /**
   * Parse incoming serial data (JSON format)
   * Expected format: {"temp":25.6,"ph":7.53,"tds":85,"ec":235}
   * @param {string} rawData - Raw JSON string
   * @returns {object|null} Parsed metrics or null if invalid
   */
  static parseArduinoData(rawData) {
    if (!rawData || typeof rawData !== 'string') {
      console.error('[Parser] Invalid input type:', typeof rawData)
      return null
    }

    try {
      // Clean up the data
      const cleaned = rawData.trim().replace(/\r/g, '').replace(/\n/g, '')
      
      console.log('[Parser] Raw input:', `"${rawData}"`)
      console.log('[Parser] Cleaned:', `"${cleaned}"`)

      // Try to parse JSON
      let jsonData
      try {
        jsonData = JSON.parse(cleaned)
      } catch (e) {
        console.warn('[Parser] Failed to parse JSON:', e.message)
        console.warn('[Parser] Input was:', cleaned)
        return null
      }

      // Extract required fields from JSON
      const tempParsed = parseFloat(jsonData.temp)
      const phParsed = parseFloat(jsonData.ph)
      const tdsParsed = parseFloat(jsonData.tds)
      const ecParsed = parseFloat(jsonData.ec)

      console.log('[Parser] Parsed values:', { 
        temp: tempParsed, 
        ph: phParsed, 
        tds: tdsParsed, 
        ec: ecParsed 
      })

      // Validate all values are numbers (NaN check)
      if (isNaN(tempParsed) || isNaN(phParsed) || isNaN(tdsParsed) || isNaN(ecParsed)) {
        console.error('[Parser] One or more values are NaN:', {
          temp: tempParsed,
          ph: phParsed,
          tds: tdsParsed,
          ec: ecParsed
        })
        return null
      }

      // Apply calibration corrections
      const temp = tempParsed * this.CALIBRATION.tempScale + this.CALIBRATION.tempOffset
      const ph = phParsed * this.CALIBRATION.phScale + this.CALIBRATION.phOffset
      const tds = tdsParsed * this.CALIBRATION.tdsScale
      const ec = ecParsed * this.CALIBRATION.ecScale

      // Validate ranges
      if (!this.isValidReading({ temp, ph, tds, ec })) {
        console.error('[Parser] Reading outside valid ranges:', { temp, ph, tds, ec })
        // Don't reject - still use the data but with warning
        // return null
      }

      // Successfully parsed - store for averaging
      this.addReadingToHistory({ temp, ph, tds, ec })

      // Get averaged values
      const averagedReading = this.getAveragedReading()

      const result = {
        // Raw parsed values (before averaging)
        tempRaw: parseFloat(temp.toFixed(1)),
        phRaw: parseFloat(ph.toFixed(2)),
        tdsRaw: Math.round(tds),
        ecRaw: Math.round(ec),
        
        // Averaged values (smoothed)
        temp: parseFloat(averagedReading.temp.toFixed(1)),
        ph: parseFloat(averagedReading.ph.toFixed(2)),
        tds: Math.round(averagedReading.tds),
        ec: Math.round(averagedReading.ec),
        
        raw: rawData,
        timestamp: new Date().toISOString(),
        valid: true
      }

      console.log('[Parser] Final result:', result)
      return result
    } catch (error) {
      console.error('[Parser] Exception:', error.message, 'Input:', rawData)
      return null
    }
  }

  /**
   * Validate if reading is within acceptable ranges
   * More lenient to handle low/zero values from dry sensors
   */
  static isValidReading(reading) {
    const { temp, ph, tds, ec } = reading
    const ranges = this.RANGES

    // Check for extreme outliers only (allow 0 and very low values)
    if (temp < ranges.temp.min - 10 || temp > ranges.temp.max + 10) {
      console.warn(`[Parser] Temperature ${temp}°C is extreme outlier [${ranges.temp.min - 10}, ${ranges.temp.max + 10}]`)
      return false
    }

    if (ph < ranges.ph.min - 1 || ph > ranges.ph.max + 1) {
      console.warn(`[Parser] pH ${ph} is extreme outlier [${ranges.ph.min - 1}, ${ranges.ph.max + 1}]`)
      return false
    }

    if (tds < ranges.tds.min - 100 || tds > ranges.tds.max + 500) {
      console.warn(`[Parser] TDS ${tds} is extreme outlier`)
      return false
    }

    if (ec < ranges.ec.min - 100 || ec > ranges.ec.max + 1000) {
      console.warn(`[Parser] EC ${ec} is extreme outlier`)
      return false
    }

    // At least some values should be non-zero (not all sensors disconnected)
    const nonZeroCount = [temp, ph, tds, ec].filter(v => v > 0).length
    if (nonZeroCount === 0) {
      console.warn('[Parser] All sensor values are zero - possible hardware issue')
      // Still allow it to display, don't reject it
    }

    return true
  }

  /**
   * Add reading to history for averaging
   */
  static addReadingToHistory(reading) {
    this.recentReadings.temp.push(reading.temp)
    this.recentReadings.ph.push(reading.ph)
    this.recentReadings.tds.push(reading.tds)
    this.recentReadings.ec.push(reading.ec)

    // Keep only recent readings
    if (this.recentReadings.temp.length > this.MAX_READINGS) {
      this.recentReadings.temp.shift()
      this.recentReadings.ph.shift()
      this.recentReadings.tds.shift()
      this.recentReadings.ec.shift()
    }
  }

  /**
   * Get averaged reading from recent history
   */
  static getAveragedReading() {
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b) / arr.length : 0

    return {
      temp: avg(this.recentReadings.temp),
      ph: avg(this.recentReadings.ph),
      tds: avg(this.recentReadings.tds),
      ec: avg(this.recentReadings.ec)
    }
  }

  /**
   * Reset reading history (call on disconnect)
   */
  static resetHistory() {
    this.recentReadings = {
      temp: [],
      ph: [],
      tds: [],
      ec: []
    }
  }

  /**
   * Calculate water quality metrics based on sensor data
   * @param {object} metrics - Parsed metrics {temp, ph, tds, ec}
   * @returns {object} Quality assessment
   */
  static assessWaterQuality(metrics) {
    if (!metrics) return null

    const { temp, ph, tds } = metrics
    let risk = 'LOW'
    let statusArray = []

    // Temperature check (optimal: 15-25°C)
    if (temp < 5 || temp > 35) {
      risk = 'HIGH'
      statusArray.push('Temperature out of safe range')
    } else if (temp < 15 || temp > 25) {
      statusArray.push('Temperature not optimal')
    }

    // pH check (optimal: 6.5-8.5)
    if (ph < 6.0 || ph > 9.0) {
      risk = 'HIGH'
      statusArray.push('pH outside safe range')
    } else if (ph < 6.5 || ph > 8.5) {
      if (risk !== 'HIGH') risk = 'MODERATE'
      statusArray.push('pH not optimal')
    }

    // TDS check (optimal: 100-300 ppm for drinking water)
    if (tds > 500) {
      if (risk !== 'HIGH') risk = 'MODERATE'
      statusArray.push('TDS elevated - high mineral content')
    } else if (tds > 300) {
      if (risk !== 'HIGH' && risk !== 'MODERATE') risk = 'MODERATE'
      statusArray.push('TDS slightly elevated')
    }

    return {
      risk,
      status: statusArray.length > 0 ? statusArray.join('; ') : 'Optimal',
      recommendation: SerialDataParser.generateRecommendation(temp, ph, tds)
    }
  }

  /**
   * Generate usage recommendation based on metrics
   * @param {number} temp - Temperature
   * @param {number} ph - pH
   * @param {number} tds - Total dissolved solids
   * @returns {string} Recommendation
   */
  static generateRecommendation(temp, ph, tds) {
    const recommendations = []

    if (ph > 8.5) {
      recommendations.push('Water is too alkaline. Consider using pH adjusting solution.')
    } else if (ph < 6.5) {
      recommendations.push('Water is too acidic. Aeration or pH adjustment needed.')
    }

    if (tds > 400) {
      recommendations.push('High mineral content detected. Filtration or distillation recommended.')
    }

    if (temp > 30) {
      recommendations.push('Water temperature is high. Cooling or circulation recommended.')
    } else if (temp < 10) {
      recommendations.push('Water temperature is low. Heating may be required.')
    }

    if (recommendations.length === 0) {
      return 'Water quality is excellent. Continue regular monitoring.'
    }

    return recommendations.join(' ')
  }
}

/**
 * Serial Service - React hook for managing serial connections
 */
export class SerialService {
  /**
   * Check if Electron API is available
   * @returns {boolean}
   */
  static isElectronAvailable() {
    return typeof window !== 'undefined' && window.electronAPI !== undefined
  }

  /**
   * Get available serial ports
   * @returns {Promise<Array>}
   */
  static async listPorts() {
    if (!this.isElectronAvailable()) {
      console.warn('Electron API not available')
      return []
    }

    try {
      const result = await window.electronAPI.getSerialPorts()
      if (result.success) {
        return result.data
      } else {
        console.error('Failed to list ports:', result.error)
        return []
      }
    } catch (error) {
      console.error('Error listing serial ports:', error)
      return []
    }
  }

  /**
   * Connect to serial port
   * @param {string} portPath - Path to the serial port (e.g., 'COM3')
   * @param {number} baudRate - Baud rate (default: 115200)
   * @returns {Promise<object>}
   */
  static async connect(portPath, baudRate = 115200) {
    if (!this.isElectronAvailable()) {
      return { success: false, error: 'Electron API not available' }
    }

    return await window.electronAPI.connectSerial(portPath, baudRate)
  }

  /**
   * Disconnect from serial port
   * @returns {Promise<object>}
   */
  static async disconnect() {
    if (!this.isElectronAvailable()) {
      return { success: false, error: 'Electron API not available' }
    }

    // Reset data history on disconnect
    SerialDataParser.resetHistory()
    
    return await window.electronAPI.disconnectSerial()
  }

  /**
   * Get current serial connection status
   * @returns {Promise<object>}
   */
  static async getStatus() {
    if (!this.isElectronAvailable()) {
      return { connected: false, port: null }
    }

    return await window.electronAPI.getSerialStatus()
  }

  /**
   * Setup event listeners for serial data
   * @param {Function} onData - Called when data is received
   * @param {Function} onError - Called on error
   * @param {Function} onDisconnect - Called on disconnection
   * @returns {Function} Cleanup function to remove listeners
   */
  static setupListeners(onData, onError, onDisconnect) {
    if (!this.isElectronAvailable()) {
      console.warn('Electron API not available for listeners')
      return () => {}
    }

    const dataHandler = (data) => {
      console.log('[SerialService] Data event received:', data.raw?.substring(0, 50))
      const parsed = SerialDataParser.parseArduinoData(data.raw)
      if (parsed && parsed.valid) {
        console.log('[SerialService] Parsed data successfully:', {
          temp: parsed.temp,
          ph: parsed.ph,
          tds: parsed.tds,
          ec: parsed.ec
        })
        onData(parsed)
      } else {
        console.warn('[SerialService] Failed to parse data or invalid:', data.raw)
      }
    }

    const errorHandler = (error) => {
      console.error('[SerialService] Error event:', error)
      onError(error)
    }

    const disconnectHandler = () => {
      console.log('[SerialService] Disconnected event')
      SerialDataParser.resetHistory()
      onDisconnect()
    }

    const connectedHandler = (data) => {
      console.log('[SerialService] Connected event:', data.port)
    }

    // Setup listeners - these return references we can use for cleanup
    const dataRef = window.electronAPI.onSerialData(dataHandler)
    const errorRef = window.electronAPI.onSerialError(errorHandler)
    const connectedRef = window.electronAPI.onSerialConnected(connectedHandler)
    const disconnectRef = window.electronAPI.onSerialDisconnected(disconnectHandler)

    console.log('[SerialService] Listeners set up successfully')

    // Return cleanup function
    return () => {
      console.log('[SerialService] Removing listeners...')
      try {
        if (dataRef) window.electronAPI.removeSerialDataListener(dataRef)
        if (errorRef) window.electronAPI.removeSerialErrorListener(errorRef)
        if (connectedRef) window.electronAPI.removeSerialConnectedListener(connectedRef)
        if (disconnectRef) window.electronAPI.removeSerialDisconnectedListener(disconnectRef)
        console.log('[SerialService] All listeners removed')
      } catch (e) {
        console.warn('[SerialService] Error removing listeners:', e)
      }
    }
  }
}
