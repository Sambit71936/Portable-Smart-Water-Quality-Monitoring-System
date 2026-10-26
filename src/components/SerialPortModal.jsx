import { useEffect, useState } from 'react'
import { useWaterQuality } from '../context/WaterQualityContext'

export default function SerialPortModal({ isOpen, onClose }) {
  const {
    availablePorts,
    connectedPort,
    serialError,
    refreshSerialPorts,
    connectToPort,
    disconnectFromPort,
    isConnected
  } = useWaterQuality()

  const [selectedPort, setSelectedPort] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadPorts()
    }
  }, [isOpen])

  const loadPorts = async () => {
    setIsLoading(true)
    try {
      await refreshSerialPorts()
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!selectedPort) {
      setConnectionStatus('Please select a port')
      return
    }

    setIsLoading(true)
    setConnectionStatus('Connecting...')

    try {
      const result = await connectToPort(selectedPort)
      if (result.success) {
        setConnectionStatus('Connected successfully!')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setConnectionStatus(`Connection failed: ${result.error}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    setConnectionStatus('Disconnecting...')

    try {
      await disconnectFromPort()
      setConnectionStatus('Disconnected')
      setSelectedPort(null)
      setTimeout(() => {
        onClose()
      }, 1000)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4 border border-outline">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-on-surface">Connect Arduino Device</h2>
          <button
            onClick={onClose}
            className="text-on-surface hover:text-primary transition-colors"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Connection Status */}
        {isConnected && (
          <div className="mb-4 p-3 bg-green-600 bg-opacity-20 border border-green-600 rounded text-green-400 text-sm">
            ✓ Connected to {connectedPort}
          </div>
        )}

        {serialError && (
          <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-600 rounded text-red-400 text-sm">
            ⚠ {serialError}
          </div>
        )}

        {connectionStatus && (
          <div className="mb-4 p-3 bg-primary bg-opacity-20 border border-primary rounded text-primary text-sm">
            {connectionStatus}
          </div>
        )}

        {/* Port Selection */}
        <div className="mb-4">
          <label className="block text-sm text-on-surface-variant mb-2">
            Available Ports
          </label>

          {isLoading && !availablePorts.length ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin">⚙️</div>
              <span className="ml-2 text-on-surface-variant">Loading ports...</span>
            </div>
          ) : availablePorts.length === 0 ? (
            <div className="p-4 bg-outline bg-opacity-20 rounded text-on-surface-variant text-sm text-center">
              No serial ports detected. Connect your Arduino and try again.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availablePorts.map((port) => (
                <label
                  key={port.path}
                  className="flex items-center p-3 bg-outline bg-opacity-10 rounded cursor-pointer hover:bg-opacity-20 transition-colors border border-outline"
                >
                  <input
                    type="radio"
                    name="port"
                    value={port.path}
                    checked={selectedPort === port.path}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    disabled={isLoading || isConnected}
                    className="mr-3 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-on-surface font-medium">{port.path}</div>
                    <div className="text-xs text-on-surface-variant">
                      {port.manufacturer || 'Unknown'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {!isLoading && availablePorts.length > 0 && (
            <button
              onClick={loadPorts}
              className="mt-2 text-xs text-primary hover:text-primary-bright transition-colors underline"
              disabled={isLoading}
            >
              Refresh Ports
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isConnected ? (
            <>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600 disabled:opacity-50 text-white rounded transition-colors"
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-outline text-on-surface rounded hover:bg-opacity-20 transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleConnect}
                disabled={isLoading || !selectedPort || !availablePorts.length}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-bright disabled:bg-primary disabled:opacity-50 text-on-primary rounded transition-colors"
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-outline text-on-surface rounded hover:bg-opacity-20 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-outline bg-opacity-10 rounded text-xs text-on-surface-variant">
          <p className="font-semibold mb-1">Settings:</p>
          <p>• Baud Rate: 9600</p>
          <p>• Data: temperature,ph,tds,ec</p>
          <p>• Update: Every 1 second</p>
        </div>
      </div>
    </div>
  )
}
