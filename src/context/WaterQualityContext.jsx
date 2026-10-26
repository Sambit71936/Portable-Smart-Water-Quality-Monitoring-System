import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { SerialService, SerialDataParser } from '../services/SerialService'
import { WaterQualityAnalysis } from '../services/WaterQualityAnalysis'

const WaterQualityContext = createContext()

export const WaterQualityProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedRange, setSelectedRange] = useState('7D')
  const [historyFilter, setHistoryFilter] = useState('All')
  const [waterAnalysis, setWaterAnalysis] = useState(null)
  const [availablePorts, setAvailablePorts] = useState([])
  const [connectedPort, setConnectedPort] = useState(null)
  const [serialError, setSerialError] = useState(null)
  const [liveMode, setLiveMode] = useState(false)
  const cleanupListenersRef = useRef(null)
  const dataTimeoutRef = useRef(null)
  const lastDataTimeRef = useRef(null)
  
  const [metrics, setMetrics] = useState({
    temp: null,
    ph: null,
    tds: null,
    ec: null,
    risk: null,
    confidence: null,
    status: 'Waiting for sensor data...',
    lastUpdate: null,
    dataReceived: false,
    noDataTimeout: false
  })

  const [history, setHistory] = useState([
    { id: '8292', date: 'Oct 12, 10:24 AM', type: 'Alert', values: { temp: 24.2, ph: 8.4, tds: 142, ec: 284 }, status: 'Requires Attention', rec: 'Increase filtration duration and check for mineral deposits.' },
    { id: '8291', date: 'Oct 12, 06:12 AM', type: 'Optimal', values: { temp: 22.8, ph: 7.2, tds: 138, ec: 276 }, status: 'Stable', rec: 'Water quality is excellent. No action required.' },
    { id: '8290', date: 'Oct 11, 09:45 PM', type: 'Calibration', values: { temp: 23.1, ph: 7.0, tds: 145, ec: 290 }, status: 'System Calibrating', rec: 'Routine calibration in progress. Metrics may vary.' },
    { id: '8289', date: 'Oct 11, 02:30 PM', type: 'Log', values: { temp: 22.5, ph: 7.3, tds: 140, ec: 280 }, status: 'Optimal', rec: 'All parameters within recommended safety limits.' }
  ])

  const [predictions] = useState({
    temp: '25.2°C',
    ph: '7.1',
    tds: '435',
    ec: '680',
    trend: 'Stable with slight mineralization spike in next 14h.',
    riskPrediction: 'LOW to MODERATE'
  })

  // Initialize serial service on mount
  useEffect(() => {
    const initSerial = async () => {
      if (SerialService.isElectronAvailable()) {
        // Get initial port status
        const status = await SerialService.getStatus()
        if (status.connected) {
          setIsConnected(true)
          setConnectedPort(status.port)
          setLiveMode(true)
        }

        // List available ports
        const ports = await SerialService.listPorts()
        setAvailablePorts(ports)
      }
    }

    initSerial()

    // Cleanup
    return () => {
      console.log('[Context] Cleanup: Removing listeners')
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current()
      }
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current)
      }
    }
  }, [])

  const refreshData = () => {
    // Only refresh if connected to serial port
    if (!isConnected) {
      setSerialError('Not connected to sensor. Please connect to a serial port first.')
      return
    }
    
    // If already in live mode, data is auto-updating from serial
    // This is just a manual refresh trigger
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 500)
  }

  // Update metrics from serial data
  const updateFromSerial = (temperature, ph, tds, ec) => {
    // Debug logging
    console.log('[Context] Received serial data:', { temperature, ph, tds, ec })
    
    // Mark that we received data
    lastDataTimeRef.current = Date.now()
    
    // Clear any pending timeout
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current)
    }
    
    // Check for NaN and provide defaults
    const temp = typeof temperature === 'number' && !isNaN(temperature) ? temperature : null
    const phVal = typeof ph === 'number' && !isNaN(ph) ? ph : null
    const tdsVal = typeof tds === 'number' && !isNaN(tds) ? tds : null
    const ecVal = typeof ec === 'number' && !isNaN(ec) ? ec : null

    console.log('[Context] Values after NaN check:', { temp, phVal, tdsVal, ecVal })
    
    const assessment = SerialDataParser.assessWaterQuality({ temp, ph: phVal, tds: tdsVal })
    
    // Perform comprehensive water quality analysis
    const analysis = WaterQualityAnalysis.analyzeWaterQuality({
      temp,
      ph: phVal,
      tds: tdsVal,
      ec: ecVal
    })
    
    setMetrics({
      temp,
      ph: phVal,
      tds: tdsVal,
      ec: ecVal,
      risk: assessment.risk,
      confidence: 98.5,
      status: assessment.status,
      recommendation: assessment.recommendation,
      lastUpdate: new Date().toLocaleTimeString(),
      dataReceived: true,
      noDataTimeout: false
    })
    
    // Store the detailed analysis
    setWaterAnalysis(analysis)

    // Add to history
    const newEntry = {
      id: Math.floor(8000 + Math.random() * 200).toString(),
      date: new Date().toLocaleString(),
      type: assessment.risk === 'HIGH' ? 'Alert' : 'Optimal',
      values: { temp, ph: phVal, tds: tdsVal, ec: ecVal },
      status: assessment.status,
      rec: assessment.recommendation
    }
    setHistory(prev => [newEntry, ...prev].slice(0, 100))

    // Set timeout to show "no data" message if data stops flowing
    dataTimeoutRef.current = setTimeout(() => {
      console.warn('[Context] No data received for 5 seconds')
      setMetrics(prev => ({
        ...prev,
        status: 'No data received. Check sensor connection...',
        noDataTimeout: true
      }))
    }, 5000)
  }

  // Connect to serial port
  const connectToPort = async (portPath) => {
    try {
      setSerialError(null)
      console.log('[Context] Connecting to port:', portPath)
      
      const result = await SerialService.connect(portPath, 115200)
      
      if (result.success) {
        setConnectedPort(portPath)
        setIsConnected(true)
        setLiveMode(true)
        
        // Reset metrics to waiting state
        setMetrics(prev => ({
          ...prev,
          status: 'Connected! Waiting for first data...',
          dataReceived: false
        }))

        // Setup listeners
        const cleanup = SerialService.setupListeners(
          (parsed) => {
            console.log('[Context] SerialService callback with:', parsed)
            updateFromSerial(parsed.temp, parsed.ph, parsed.tds, parsed.ec)
          },
          (error) => {
            console.error('[Context] Serial error:', error)
            setSerialError(error.error || 'Serial connection error')
          },
          () => {
            console.log('[Context] Serial disconnected')
            setIsConnected(false)
            setConnectedPort(null)
            setLiveMode(false)
          }
        )

        cleanupListenersRef.current = cleanup
        return { success: true }
      } else {
        console.error('[Context] Connection failed:', result.error)
        setSerialError(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('[Context] Connection exception:', error.message)
      setSerialError(error.message)
      return { success: false, error: error.message }
    }
  }

  // Disconnect from serial port
  const disconnectFromPort = async () => {
    try {
      setSerialError(null)
      console.log('[Context] Disconnecting from serial port')
      
      // Clear timeout
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current)
        dataTimeoutRef.current = null
      }
      
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current()
      }

      const result = await SerialService.disconnect()
      setIsConnected(false)
      setConnectedPort(null)
      setLiveMode(false)
      
      // Reset metrics
      setMetrics(prev => ({
        ...prev,
        status: 'Disconnected',
        dataReceived: false
      }))
      
      return result
    } catch (error) {
      console.error('[Context] Disconnect error:', error.message)
      setSerialError(error.message)
      return { success: false, error: error.message }
    }
  }

  // Refresh serial ports
  const refreshSerialPorts = async () => {
    const ports = await SerialService.listPorts()
    setAvailablePorts(ports)
    return ports
  }

  // Toggle between live and demo mode
  const toggleMode = (mode) => {
    if (mode === 'live' && isConnected) {
      setLiveMode(true)
    } else if (mode === 'demo') {
      setLiveMode(false)
    }
  }

  const loadArchive = () => {
    const newId = Math.floor(8000 + Math.random() * 200).toString()
    const newEntry = {
      id: newId,
      date: 'Oct 10, 11:15 AM',
      type: Math.random() > 0.5 ? 'Optimal' : 'Alert',
      values: { temp: 21.9, ph: 7.1, tds: 130, ec: 260 },
      status: 'Stable',
      rec: 'Parameters are well within safe thresholds.'
    }
    setHistory(prev => [newEntry, ...prev])
  }

  const exportData = (format) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Generated ${format.toUpperCase()} report.`)
        resolve()
      }, 2000)
    })
  }

  const value = {
    isConnected, setIsConnected,
    isRefreshing, refreshData,
    selectedRange, setSelectedRange,
    historyFilter, setHistoryFilter,
    metrics, history, predictions,
    waterAnalysis,
    loadArchive, exportData,
    // Serial connection
    availablePorts, setAvailablePorts,
    connectedPort, setConnectedPort,
    serialError, setSerialError,
    liveMode, setLiveMode,
    connectToPort,
    disconnectFromPort,
    refreshSerialPorts,
    toggleMode,
    updateFromSerial
  }

  return (
    <WaterQualityContext.Provider value={value}>
      {children}
    </WaterQualityContext.Provider>
  )
}

export const useWaterQuality = () => {
  const context = useContext(WaterQualityContext)
  if (!context) throw new Error('useWaterQuality must be used within a WaterQualityProvider')
  return context
}
