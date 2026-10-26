const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { SerialPort } = require('serialport')
const path = require('path')

let mainWindow
let serialPort = null
let portReadings = []
let isDev
let serialBuffer = '' // Buffer to accumulate serial data until newline

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../public/favicon.ico')
  })

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const setupAppListeners = () => {
  app.whenReady().then(() => {
    createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

// IPC Handlers for Serial Communication

// List available serial ports
ipcMain.handle('get-serial-ports', async () => {
  try {
    const ports = await SerialPort.list()
    console.log(`[Serial] Found ${ports.length} port(s):`, ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer,
      productId: p.productId,
      vendorId: p.vendorId
    })))
    return {
      success: true,
      data: ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer || 'Unknown',
        productId: port.productId,
        vendorId: port.vendorId
      }))
    }
  } catch (error) {
    console.error('[Serial] Error listing ports:', error)
    return { success: false, error: error.message }
  }
})

// Connect to serial port
ipcMain.handle('connect-serial', async (event, portPath, baudRate = 115200) => {
  try {
    console.log(`[Serial] Attempting to connect to ${portPath} at ${baudRate} baud...`)
    
    // Close any existing connection
    if (serialPort) {
      try {
        if (serialPort.isOpen) {
          console.log('[Serial] Closing previous connection...')
          await serialPort.close()
        }
      } catch (e) {
        console.warn('[Serial] Error closing previous connection:', e.message)
      }
      serialPort = null
    }

    // Create new connection
    serialPort = new SerialPort({
      path: portPath,
      baudRate: baudRate,
      autoOpen: true  // Changed to true so it opens immediately
    })

    // Setup event handlers BEFORE opening
    serialPort.on('open', () => {
      console.log(`[Serial] Connection opened to ${portPath}`)
      if (mainWindow) {
        mainWindow.webContents.send('serial-connected', {
          port: portPath,
          timestamp: new Date().toISOString()
        })
      }
    })

    serialPort.on('data', (data) => {
      // Accumulate data into buffer until we get a complete line
      serialBuffer += data.toString('utf8')
      
      console.log('[Serial] Raw data received:', `"${data.toString('utf8')}"`)
      console.log('[Serial] Buffer state:', `"${serialBuffer}"`)
      
      // Process complete lines (lines ending with \n or \r\n)
      const lines = serialBuffer.split(/\r?\n/)
      
      // Keep the incomplete line in the buffer (last element if it doesn't end with newline)
      serialBuffer = lines[lines.length - 1]
      
      // Process all complete lines (excluding the incomplete one at the end)
      for (let i = 0; i < lines.length - 1; i++) {
        const rawString = lines[i].trim()
        
        if (rawString && rawString.length > 0) {
          console.log(`[Serial] ✓ Complete line received (${rawString.length} chars): "${rawString}"`)
          
          // Send to frontend immediately for real-time updates
          if (mainWindow && mainWindow.webContents) {
            console.log('[Serial] Sending to frontend for parsing...')
            // Use send for async (non-blocking) IPC event
            mainWindow.webContents.send('serial-data', {
              raw: rawString,
              timestamp: new Date().toISOString()
            })
          }

          // Also store in history for retrieval
          portReadings.push({
            data: rawString,
            timestamp: new Date().toISOString()
          })

          // Keep only last 1000 readings in memory
          if (portReadings.length > 1000) {
            portReadings.shift()
          }
        }
      }
      
      // Log buffer overflow errors (for debugging)
      if (serialBuffer.length > 100) {
        console.warn(`[Serial] Buffer getting large without newline: "${serialBuffer.substring(0, 100)}..."`)
      }
    })

    serialPort.on('error', (error) => {
      console.error('[Serial] Port error:', error)
      if (mainWindow) {
        mainWindow.webContents.send('serial-error', {
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    })

    serialPort.on('close', () => {
      console.log('[Serial] Connection closed')
      serialBuffer = '' // Clear buffer on disconnect
      if (mainWindow) {
        mainWindow.webContents.send('serial-disconnected', {
          timestamp: new Date().toISOString()
        })
      }
    })

    // Wait a bit for the port to actually open
    await new Promise((resolve, reject) => {
      if (serialPort.isOpen) {
        console.log('[Serial] Port is now open')
        resolve()
      } else {
        const timeout = setTimeout(() => {
          reject(new Error('Port failed to open within timeout'))
        }, 2000)
        
        serialPort.once('open', () => {
          clearTimeout(timeout)
          resolve()
        })
        
        serialPort.once('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      }
    })

    return {
      success: true,
      message: `Connected to ${portPath} at ${baudRate} baud`,
      port: portPath
    }
  } catch (error) {
    console.error('[Serial] Connection failed:', error.message)
    
    // Clean up on failure
    if (serialPort) {
      try {
        serialPort.close()
      } catch (e) {
        // ignore
      }
      serialPort = null
    }
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Disconnect from serial port
ipcMain.handle('disconnect-serial', async () => {
  try {
    if (serialPort && serialPort.isOpen) {
      await serialPort.close()
      serialPort = null
      serialBuffer = '' // Clear buffer on disconnect
      return { success: true, message: 'Disconnected from serial port' }
    }
    serialBuffer = '' // Clear buffer even if not connected
    return { success: true, message: 'No active connection' }
  } catch (error) {
    serialBuffer = '' // Clear buffer on error too
    return { success: false, error: error.message }
  }
})

// Get connection status
ipcMain.handle('get-serial-status', () => {
  return {
    connected: serialPort && serialPort.isOpen,
    port: serialPort ? serialPort.path : null
  }
})

// Get stored readings
ipcMain.handle('get-port-readings', () => {
  return portReadings
})

// Clear stored readings
ipcMain.handle('clear-port-readings', () => {
  portReadings = []
  return { success: true }
})

// Initialize isDev and set up app
;(async () => {
  try {
    const module = await import('electron-is-dev')
    isDev = module.default
  } catch (err) {
    console.error('Failed to import electron-is-dev:', err)
    isDev = false
  }
  
  // Now that isDev is loaded, set up the app listeners
  setupAppListeners()
})()
