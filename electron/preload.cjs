const { contextBridge, ipcRenderer } = require('electron')

// Store references to wrapped callbacks for proper cleanup
const listenerReferences = new Map()

contextBridge.exposeInMainWorld('electronAPI', {
  // Serial port operations
  getSerialPorts: () => ipcRenderer.invoke('get-serial-ports'),
  connectSerial: (portPath, baudRate) => ipcRenderer.invoke('connect-serial', portPath, baudRate),
  disconnectSerial: () => ipcRenderer.invoke('disconnect-serial'),
  getSerialStatus: () => ipcRenderer.invoke('get-serial-status'),
  getPortReadings: () => ipcRenderer.invoke('get-port-readings'),
  clearPortReadings: () => ipcRenderer.invoke('clear-port-readings'),

  // Event listeners - properly handle continuous events with reference tracking
  onSerialData: (callback) => {
    const wrappedCallback = (event, data) => {
      try {
        callback(data)
      } catch (err) {
        console.error('[Preload] Error in serial-data callback:', err)
      }
    }
    ipcRenderer.on('serial-data', wrappedCallback)
    // Store reference for cleanup
    const callbackId = Symbol('serial-data')
    listenerReferences.set(callbackId, { event: 'serial-data', callback: wrappedCallback })
    return callbackId
  },
  
  onSerialError: (callback) => {
    const wrappedCallback = (event, error) => {
      try {
        callback(error)
      } catch (err) {
        console.error('[Preload] Error in serial-error callback:', err)
      }
    }
    ipcRenderer.on('serial-error', wrappedCallback)
    const callbackId = Symbol('serial-error')
    listenerReferences.set(callbackId, { event: 'serial-error', callback: wrappedCallback })
    return callbackId
  },
  
  onSerialConnected: (callback) => {
    const wrappedCallback = (event, data) => {
      try {
        callback(data)
      } catch (err) {
        console.error('[Preload] Error in serial-connected callback:', err)
      }
    }
    ipcRenderer.on('serial-connected', wrappedCallback)
    const callbackId = Symbol('serial-connected')
    listenerReferences.set(callbackId, { event: 'serial-connected', callback: wrappedCallback })
    return callbackId
  },
  
  onSerialDisconnected: (callback) => {
    const wrappedCallback = (event) => {
      try {
        callback()
      } catch (err) {
        console.error('[Preload] Error in serial-disconnected callback:', err)
      }
    }
    ipcRenderer.on('serial-disconnected', wrappedCallback)
    const callbackId = Symbol('serial-disconnected')
    listenerReferences.set(callbackId, { event: 'serial-disconnected', callback: wrappedCallback })
    return callbackId
  },

  // Remove listeners by reference ID
  removeSerialDataListener: (callbackId) => {
    if (listenerReferences.has(callbackId)) {
      const { event, callback } = listenerReferences.get(callbackId)
      ipcRenderer.removeListener(event, callback)
      listenerReferences.delete(callbackId)
    }
  },
  removeSerialErrorListener: (callbackId) => {
    if (listenerReferences.has(callbackId)) {
      const { event, callback } = listenerReferences.get(callbackId)
      ipcRenderer.removeListener(event, callback)
      listenerReferences.delete(callbackId)
    }
  },
  removeSerialConnectedListener: (callbackId) => {
    if (listenerReferences.has(callbackId)) {
      const { event, callback } = listenerReferences.get(callbackId)
      ipcRenderer.removeListener(event, callback)
      listenerReferences.delete(callbackId)
    }
  },
  removeSerialDisconnectedListener: (callbackId) => {
    if (listenerReferences.has(callbackId)) {
      const { event, callback } = listenerReferences.get(callbackId)
      ipcRenderer.removeListener(event, callback)
      listenerReferences.delete(callbackId)
    }
  }
})
