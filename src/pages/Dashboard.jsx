import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterQuality } from '../context/WaterQualityContext'
import WaterSuitabilityAnalysis from '../components/WaterSuitabilityAnalysis'
import LocationBasedComparison from '../components/LocationBasedComparison'

// Helper function to display sensor values with fallback
const displayValue = (value, fallback = 'No Sample', unit = '') => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback
  }
  return `${value}${unit}`
}

const Dashboard = () => {
    const navigate = useNavigate()
    const { 
        isConnected, 
        isRefreshing, 
        metrics, 
        refreshData, 
        exportData, 
        availablePorts,
        connectedPort,
        connectToPort,
        disconnectFromPort,
        serialError,
        setSerialError
    } = useWaterQuality()
    const [showSerialModal, setShowSerialModal] = useState(false)
    const [selectedPort, setSelectedPort] = useState(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [lastUpdateTime, setLastUpdateTime] = useState(null)

    // Track when data was last updated
    useEffect(() => {
        if (metrics.lastUpdate) {
            setLastUpdateTime(metrics.lastUpdate)
        }
    }, [metrics.lastUpdate])

    const handleConnect = async () => {
        if (!selectedPort) return
        
        setIsConnecting(true)
        try {
            const result = await connectToPort(selectedPort.path)
            if (result.success) {
                setShowSerialModal(false)
            }
        } catch (error) {
            console.error('Connection error:', error)
        } finally {
            setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        await disconnectFromPort()
    }

    const handleExport = async (type) => {
        alert(`Exporting data as ${type.toUpperCase()}... Please wait.`)
        await exportData(type)
        alert(`${type.toUpperCase()} report generated successfully!`)
    }

    const hasData = metrics.dataReceived && metrics.temp !== null && metrics.ph !== null && metrics.tds !== null && metrics.ec !== null

    return (
        <div className="space-y-8 relative">
            {/* Refreshing Overlay */}
            {isRefreshing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="font-headline font-bold text-primary tracking-widest animate-pulse uppercase text-xs">Synchronizing Data...</p>
                    </div>
                </div>
            )}

            {/* Serial Port Modal */}
            {showSerialModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
                    <div className="glass-panel w-full max-w-md rounded-2xl p-8 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse"></div>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-headline font-bold text-white tracking-tight">Connect to Sensor</h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Select a COM port...</p>
                            </div>
                            <button onClick={() => setShowSerialModal(false)} className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        {serialError && (
                            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30">
                                <p className="text-error text-xs font-medium">{serialError}</p>
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            {availablePorts && availablePorts.length > 0 ? (
                                availablePorts.map(port => (
                                    <button 
                                        key={port.path}
                                        onClick={() => setSelectedPort(port)}
                                        className={`w-full glass-panel group p-4 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] border ${selectedPort?.path === port.path ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedPort?.path === port.path ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                                                <span className="material-symbols-outlined text-xl">usb</span>
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-headline font-bold text-sm text-white">{port.path}</h4>
                                                <p className="text-[10px] text-slate-500 font-medium">{port.manufacturer || 'Unknown Device'}</p>
                                            </div>
                                        </div>
                                        {selectedPort?.path === port.path && (
                                            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 rounded-xl bg-surface-container/50 border border-outline-variant/20 text-center">
                                    <p className="text-slate-400 text-xs font-medium">No serial ports detected. Connect an ESP32 or Arduino to your computer.</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleConnect}
                            disabled={!selectedPort || isConnecting}
                            className="w-full py-3 rounded-xl bg-primary text-on-primary font-headline font-bold text-[10px] tracking-widest uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                </div>
            )}

            {/* Action Row */}
            <section className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex gap-3 flex-wrap">
                    {isConnected ? (
                        <>
                            <button 
                                onClick={handleDisconnect}
                                className="font-headline font-bold text-xs py-3 px-6 rounded-full flex items-center gap-2 transition-all active:scale-95 bg-secondary text-on-secondary shadow-[0_0_20px_rgba(0,255,171,0.3)]"
                            >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                {connectedPort ? `CONNECTED (${connectedPort})` : 'CONNECTED'}
                            </button>
                            <button 
                                onClick={handleDisconnect}
                                className="glass-panel text-error font-headline font-bold text-xs py-3 px-6 rounded-full flex items-center gap-2 hover:bg-error/10 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                                DISCONNECT
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setShowSerialModal(true)}
                            className="font-headline font-bold text-xs py-3 px-6 rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(129,236,255,0.3)] bg-primary text-on-primary hover:opacity-90"
                        >
                            <span className="material-symbols-outlined text-sm">cable</span>
                            CONNECT SENSOR
                        </button>
                    )}
                    <button 
                        onClick={refreshData}
                        disabled={!isConnected}
                        className="glass-panel text-primary font-headline font-bold text-xs py-3 px-6 rounded-full flex items-center gap-2 hover:bg-surface-bright/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin text-white' : ''}`}>refresh</span>
                        REFRESH
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {isConnected && hasData && (
                        <div className="glass-panel px-4 py-2 rounded-lg border border-outline-variant/20">
                            <p className="text-[10px] text-slate-400 font-medium">Updated: {lastUpdateTime || 'just now'}</p>
                        </div>
                    )}
                    <div className="glass-panel p-1 rounded-full flex items-center">
                        <button className="px-4 py-1.5 rounded-full text-[10px] font-bold font-headline bg-primary text-on-primary">°C</button>
                        <button className="px-4 py-1.5 rounded-full text-[10px] font-bold font-headline text-slate-500">°F</button>
                    </div>
                </div>
            </section>

            {/* Main Gauges Grid */}
            {!isConnected ? (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-panel rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl"></div>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">cable</span>
                                <p className="text-slate-400 text-sm font-medium">No sensor connected</p>
                                <p className="text-slate-500 text-xs mt-1">Connect to a serial port to see live data</p>
                            </div>
                        </div>
                    ))}
                </section>
            ) : (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Card 1: Temp */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">Temperature</h3>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-headline font-bold text-on-surface transition-all duration-700 ${isRefreshing ? 'blur-sm opacity-50' : ''}`}>{displayValue(metrics.temp, '—')}</span>
                                <span className="text-lg text-slate-400 font-headline">°C</span>
                            </div>
                        </div>
                        <span className="bg-secondary-container/30 text-secondary text-[10px] px-2.5 py-1 rounded-md font-bold border border-secondary/20">ACCEPTABLE</span>
                    </div>
                    <div className="relative flex justify-center pt-4">
                        <svg className="gauge-svg w-40 h-40" viewBox="0 0 100 100">
                            <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="125.6 251.2" strokeLinecap="round" strokeWidth="8"></circle>
                            <circle className="drop-shadow-[0_0_8px_rgba(0,255,171,0.4)] transition-all duration-1000 ease-in-out" cx="50" cy="50" fill="transparent" r="40" stroke="url(#tempGradient)" strokeDasharray={`${(metrics.temp / 50) * 125.6} 251.2`} strokeLinecap="round" strokeWidth="8"></circle>
                            <defs>
                                <linearGradient id="tempGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: 'var(--tw-color-primary)' }}></stop>
                                    <stop offset="100%" style={{ stopColor: 'var(--tw-color-secondary)' }}></stop>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center pt-8">
                            <span className="material-symbols-outlined text-primary-dim text-3xl">device_thermostat</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: pH */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">pH Level</h3>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-headline font-bold text-on-surface transition-all duration-700 ${isRefreshing ? 'blur-sm opacity-50' : ''}`}>{displayValue(metrics.ph, '—')}</span>
                                <span className="text-lg text-slate-400 font-headline">pH</span>
                            </div>
                        </div>
                        <span className="bg-secondary text-on-secondary text-[10px] px-2.5 py-1 rounded-md font-bold shadow-[0_0_15px_rgba(0,255,171,0.3)]">EXCELLENT</span>
                    </div>
                    <div className="relative flex justify-center pt-4">
                        <svg className="gauge-svg w-40 h-40" viewBox="0 0 100 100">
                            <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="125.6 251.2" strokeLinecap="round" strokeWidth="8"></circle>
                            <circle className="drop-shadow-[0_0_8px_rgba(0,255,171,0.6)] transition-all duration-1000 ease-in-out" cx="50" cy="50" fill="transparent" r="40" stroke="url(#phGradient)" strokeDasharray={`${(metrics.ph / 14) * 125.6} 251.2`} strokeLinecap="round" strokeWidth="8"></circle>
                            <defs>
                                <linearGradient id="phGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: 'var(--tw-color-secondary)' }}></stop>
                                    <stop offset="100%" style={{ stopColor: 'var(--tw-color-secondary-dim)' }}></stop>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center pt-8">
                            <span className="material-symbols-outlined text-secondary text-3xl">science</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: TDS */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">TDS</h3>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-headline font-bold text-on-surface transition-all duration-700 ${isRefreshing ? 'blur-sm opacity-50' : ''}`}>{displayValue(metrics.tds, '—')}</span>
                                <span className="text-lg text-slate-400 font-headline">ppm</span>
                            </div>
                        </div>
                        <span className="bg-primary-container/30 text-primary text-[10px] px-2.5 py-1 rounded-md font-bold border border-primary/20">GOOD</span>
                    </div>
                    <div className="relative flex justify-center pt-4">
                        <svg className="gauge-svg w-40 h-40" viewBox="0 0 100 100">
                            <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="125.6 251.2" strokeLinecap="round" strokeWidth="8"></circle>
                            <circle className="drop-shadow-[0_0_8px_rgba(129,236,255,0.4)] transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" stroke="#81ecff" strokeDasharray={`${(metrics.tds / 1000) * 125.6} 251.2`} strokeLinecap="round" strokeWidth="8"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center pt-8">
                            <span className="material-symbols-outlined text-primary text-3xl">blur_on</span>
                        </div>
                    </div>
                </div>

                {/* Card 4: EC */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-bright/10 rounded-full blur-3xl group-hover:bg-surface-bright/20 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-1">Conductivity</h3>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-4xl font-headline font-bold text-on-surface transition-all duration-700 ${isRefreshing ? 'blur-sm opacity-50' : ''}`}>{displayValue(metrics.ec, '—')}</span>
                                <span className="text-lg text-slate-400 font-headline">µS/cm</span>
                            </div>
                        </div>
                        <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-2.5 py-1 rounded-md font-bold border border-outline-variant/30">NORMAL</span>
                    </div>
                    <div className="relative flex justify-center pt-4">
                        <svg className="gauge-svg w-40 h-40" viewBox="0 0 100 100">
                            <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="125.6 251.2" strokeLinecap="round" strokeWidth="8"></circle>
                            <circle className="drop-shadow-[0_0_8px_rgba(166,171,184,0.4)] transition-all duration-1000" cx="50" cy="50" fill="transparent" r="40" stroke="#a6abb8" strokeDasharray={`${(metrics.ec / 2000) * 125.6} 251.2`} strokeLinecap="round" strokeWidth="8"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center pt-8">
                            <span className="material-symbols-outlined text-on-surface-variant text-3xl">bolt</span>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* Risk Level */}
            {hasData && (
            <section className="glass-panel rounded-xl p-8 mb-10">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-on-surface-variant text-xs font-bold tracking-[0.2em] uppercase mb-2">Current Risk Level</h2>
                        <span className={`text-5xl font-headline font-bold transition-colors duration-700 ${metrics.risk === 'HIGH' ? 'text-error' : metrics.risk === 'MODERATE' ? 'text-tertiary' : 'text-secondary'}`}>
                            {metrics.risk || 'UNKNOWN'}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Confidence Rating</span>
                        <p className="text-primary font-headline font-bold">{metrics.confidence || '-'}%</p>
                    </div>
                </div>
                <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden flex relative">
                    <div className={`h-full transition-all duration-1000 ${metrics.risk === 'HIGH' ? 'bg-error w-3/4' : metrics.risk === 'MODERATE' ? 'bg-tertiary w-1/2' : 'bg-secondary w-1/3 shadow-[0_0_15px_rgba(0,255,171,0.5)]'}`}></div>
                    <div className="h-full bg-surface-container-highest/50 flex-grow"></div>
                    <div className="absolute inset-0 flex justify-between px-1">
                        <div className="h-full w-px bg-background/20"></div>
                        <div className="h-full w-px bg-background/20"></div>
                        <div className="h-full w-px bg-background/20"></div>
                    </div>
                </div>
                <div className="flex justify-between mt-3 text-[9px] font-bold text-slate-500 tracking-tighter uppercase">
                    <span>Safe</span>
                    <span>Moderate</span>
                    <span>Critical</span>
                </div>
            </section>
            )}

            {/* Water Usage Analysis */}
            <section className="mb-12">
                <h2 className="text-on-surface font-headline font-bold text-xl tracking-tight mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                    Water Usage Analysis
                </h2>
                <div className="space-y-4">
                    {[
                        { tag: 'Drinking', status: metrics.ph > 8.5 ? 'Caution' : 'Suitable', desc: 'Mineral levels and pH are within WHO safety limits for human consumption.', icon: 'local_drink', color: metrics.ph > 8.5 ? 'tertiary' : 'secondary' },
                        { tag: 'Irrigation', status: 'Suitable', desc: 'Sodium and conductivity levels are excellent for crop growth and soil health.', icon: 'potted_plant', color: 'secondary' },
                        { tag: 'Aquaculture', status: 'Caution', desc: 'pH levels are near upper thresholds for sensitive aquatic species. Monitor closely.', icon: 'set_meal', color: 'tertiary' },
                        { tag: 'Household', status: 'Suitable', desc: 'Low hardness levels ensure longevity of household pipes and appliances.', icon: 'home_repair_service', color: 'secondary' },
                        { tag: 'Industrial', status: 'Not Suitable', desc: 'Mineral composition exceeds tolerance for high-precision manufacturing coolant.', icon: 'factory', color: 'error-dim' },
                    ].map((item, idx) => (
                        <div key={idx} className={`surface-container-low p-5 rounded-xl border-l-4 border-${item.color} flex items-center gap-6 group hover:bg-surface-container-high transition-colors`}>
                            <div className={`w-12 h-12 rounded-full bg-${item.color}/10 flex items-center justify-center text-${item.color}`}>
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-headline font-bold text-sm tracking-wide">{item.tag}</h4>
                                    <span className={`bg-${item.color}/20 text-${item.color} text-[9px] font-bold px-2 py-0.5 rounded uppercase`}>{item.status}</span>
                                </div>
                                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                            <span className={`material-symbols-outlined ${item.status === 'Suitable' ? 'text-slate-600 group-hover:text-secondary' : item.status === 'Caution' ? 'text-tertiary/50' : 'text-error-dim'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                {item.status === 'Suitable' ? 'check_circle' : item.status === 'Caution' ? 'warning' : 'error'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Water Suitability Analysis */}
            <section className="mb-10">
                <h2 className="text-xl font-headline font-bold text-on-surface mb-4">Water Suitability Analysis</h2>
                <WaterSuitabilityAnalysis />
            </section>

            <LocationBasedComparison />

            {/* Final Actions */}
            <section className="flex flex-col gap-4 mb-12">
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleExport('pdf')}
                        className="surface-container-highest border border-outline-variant/20 py-4 rounded-xl flex items-center justify-center gap-3 font-headline font-bold text-xs hover:bg-surface-bright/30 transition-all border-b-2 border-b-primary/40 active:translate-y-px"
                    >
                        <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                        Export PDF Report
                    </button>
                    <button 
                        onClick={() => handleExport('csv')}
                        className="surface-container-highest border border-outline-variant/20 py-4 rounded-xl flex items-center justify-center gap-3 font-headline font-bold text-xs hover:bg-surface-bright/30 transition-all border-b-2 border-b-secondary/40 active:translate-y-px"
                    >
                        <span className="material-symbols-outlined text-secondary">csv</span>
                        Export CSV Data
                    </button>
                </div>
                <button 
                    onClick={() => navigate('/who-standards')}
                    className="relative group bg-surface-container-high p-[1px] rounded-xl overflow-hidden active:scale-[0.98] transition-transform"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-tertiary to-secondary animate-pulse group-hover:opacity-100 opacity-50"></div>
                    <div className="relative bg-background m-[1px] py-5 rounded-[11px] flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-primary">verified</span>
                        <span className="font-headline font-extrabold tracking-widest text-sm uppercase">View WHO Standards</span>
                    </div>
                </button>
            </section>
        </div>
    )
}

export default Dashboard
