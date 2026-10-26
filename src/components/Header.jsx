import { useState, useEffect } from 'react'
import { useWaterQuality } from '../context/WaterQualityContext'
import SerialPortModal from './SerialPortModal'

const Header = () => {
    const { isConnected, connectedPort, metrics, liveMode } = useWaterQuality()
    const [showSerialModal, setShowSerialModal] = useState(false)
    const [dataReceived, setDataReceived] = useState(false)
    
    // Show data status indicator
    useEffect(() => {
        if (metrics.dataReceived) {
            setDataReceived(true)
        }
    }, [metrics.dataReceived])
    
    // Determine connection status text and color
    const getStatusInfo = () => {
        if (!isConnected) {
            return {
                text: 'DISCONNECTED',
                color: 'text-error',
                bgColor: 'bg-error/20',
                borderColor: 'border-error/30',
                dotColor: 'bg-error shadow-[0_0_8px_rgba(255,113,108,0.8)]'
            }
        }
        
        if (isConnected && !dataReceived) {
            return {
                text: 'CONNECTING...',
                color: 'text-warning',
                bgColor: 'bg-warning/20',
                borderColor: 'border-warning/30',
                dotColor: 'bg-warning animate-pulse shadow-[0_0_8px_rgba(255,200,0,0.8)]'
            }
        }
        
        if (isConnected && dataReceived && !liveMode) {
            return {
                text: 'CONNECTED (DEMO)',
                color: 'text-secondary',
                bgColor: 'bg-secondary/20',
                borderColor: 'border-secondary/30',
                dotColor: 'bg-secondary animate-pulse shadow-[0_0_8px_rgba(0,255,171,0.8)]'
            }
        }
        
        return {
            text: `LIVE DATA (${connectedPort})`,
            color: 'text-secondary',
            bgColor: 'bg-secondary/20',
            borderColor: 'border-secondary/30',
            dotColor: 'bg-secondary animate-pulse shadow-[0_0_8px_rgba(0,255,171,0.8)]'
        }
    }
    
    const statusInfo = getStatusInfo()
    
    return (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#0d141e]/60 backdrop-blur-md border-b border-[#81ecff]/15 shadow-[0_8px_32px_0_rgba(0,229,255,0.1)]">
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00E5FF] text-2xl" data-icon="water_drop">water_drop</span>
                <div className="flex flex-col">
                    <h1 className="text-[#00E5FF] font-headline font-bold tracking-widest text-sm uppercase">AQUA MONITOR</h1>
                    <span className="text-[10px] text-slate-500 font-medium tracking-[0.2em] uppercase">Smart Water Quality Testing System</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Data Status Indicator (only show when connected) */}
                {isConnected && (
                    <div className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 flex items-center gap-2 transition-all duration-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${dataReceived ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(129,236,255,0.8)]' : 'bg-slate-600'}`}></span>
                        <span className={`${dataReceived ? 'text-primary' : 'text-slate-600'} font-headline text-[10px] font-bold tracking-tighter uppercase`}>
                            {dataReceived ? 'DATA STREAMING' : 'WAITING FOR DATA'}
                        </span>
                    </div>
                )}

                {/* Connect Device Button */}
                <button
                    onClick={() => setShowSerialModal(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary-bright active:bg-primary text-on-primary rounded-lg font-semibold text-sm transition-colors duration-200 flex items-center gap-2"
                >
                    <span className="text-lg">⚙️</span>
                    CONNECT DEVICE
                </button>

                {/* Connection Status */}
                <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} px-3 py-1 rounded-full border flex items-center gap-2 transition-all duration-500`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`}></span>
                    <span className={`${statusInfo.color} font-headline text-[10px] font-bold tracking-tighter uppercase`}>
                        {statusInfo.text}
                    </span>
                </div>
            </div>

            {/* Serial Port Modal */}
            <SerialPortModal isOpen={showSerialModal} onClose={() => setShowSerialModal(false)} />
        </header>
    )
}

export default Header
