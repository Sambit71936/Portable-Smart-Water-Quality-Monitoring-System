import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterQuality } from '../context/WaterQualityContext'

const Analytics = () => {
    const navigate = useNavigate()
    const { selectedRange, setSelectedRange, predictions } = useWaterQuality()

    const ranges = ['24H', '7D', '30D']

    // Mock chart data variations based on range
    const getChartPath = (type) => {
        if (type === 'temp') {
            if (selectedRange === '24H') return "M0,60 Q50,55 100,65 T200,40 T300,50 T400,45"
            if (selectedRange === '7D') return "M0,80 Q50,70 80,75 T160,40 T240,60 T320,30 T400,50"
            return "M0,70 Q100,80 200,60 T400,75"
        }
        if (type === 'ph') {
            if (selectedRange === '24H') return "M0,50 Q50,45 100,55 T200,50"
            if (selectedRange === '7D') return "M0,40 Q25,35 50,45 T100,38 T150,42 T200,40"
            return "M0,45 Q100,40 200,45"
        }
        return "M0,60 Q30,50 60,65 T120,30 T180,45 T200,35"
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Hero Analytics Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Main Chart Stack */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                        <div>
                            <span className="text-primary font-headline font-bold tracking-tighter uppercase text-xs">Performance Matrix</span>
                            <h2 className="text-3xl font-headline font-bold text-white leading-none">Historical Flux</h2>
                        </div>
                        <div className="flex gap-2 p-1 bg-surface-container-low rounded-full border border-outline-variant/10">
                            {ranges.map(range => (
                                <button 
                                    key={range}
                                    onClick={() => setSelectedRange(range)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                                        selectedRange === range 
                                        ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(129,236,255,0.4)] scale-105' 
                                        : 'text-on-surface-variant hover:text-white'
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Temperature Chart */}
                    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group border border-outline-variant/10 hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Temperature Variance</p>
                                <h3 className="text-2xl font-headline font-bold text-primary">24.8°C <span className="text-xs font-normal text-secondary ml-1">↑ 0.4%</span></h3>
                            </div>
                            <span className="material-symbols-outlined text-primary/30">device_thermostat</span>
                        </div>
                        <div className="h-40 w-full neon-grid relative rounded-lg border border-outline-variant/10 overflow-hidden">
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 100">
                                <path 
                                    className="text-primary drop-shadow-[0_0_8px_rgba(129,236,255,0.8)] transition-all duration-1000 ease-in-out" 
                                    d={getChartPath('temp')} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                ></path>
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* pH Chart */}
                        <div className="glass-panel p-6 rounded-xl overflow-hidden border border-outline-variant/10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">pH Equilibrium</p>
                                    <h3 className="text-2xl font-headline font-bold text-secondary">7.2 <span className="text-xs font-normal text-on-surface-variant ml-1">STABLE</span></h3>
                                </div>
                                <span className="material-symbols-outlined text-secondary/30">science</span>
                            </div>
                            <div className="h-32 w-full neon-grid relative rounded-lg border border-outline-variant/10">
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80">
                                    <path 
                                        className="text-secondary drop-shadow-[0_0_8px_rgba(0,255,171,0.6)] transition-all duration-1000 ease-in-out" 
                                        d={getChartPath('ph')} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2"
                                    ></path>
                                </svg>
                            </div>
                        </div>
                        {/* TDS Chart */}
                        <div className="glass-panel p-6 rounded-xl overflow-hidden border border-outline-variant/10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">TDS (PPM)</p>
                                    <h3 className="text-2xl font-headline font-bold text-tertiary">412 <span className="text-xs font-normal text-error-dim ml-1">↓ 12%</span></h3>
                                </div>
                                <span className="material-symbols-outlined text-tertiary/30">opacity</span>
                            </div>
                            <div className="h-32 w-full neon-grid relative rounded-lg border border-outline-variant/10">
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80">
                                    <path 
                                        className="text-tertiary drop-shadow-[0_0_8px_rgba(166,140,255,0.6)] transition-all duration-1000 ease-in-out" 
                                        d={getChartPath('tds')} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2"
                                    ></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Prediction & Meta */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-xl relative border border-primary/20 shadow-[0_0_40px_rgba(129,236,255,0.05)] overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 blur-[60px]"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                <h2 className="text-lg font-headline font-bold text-white">Future Prediction</h2>
                            </div>
                            <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">{predictions.trend}</p>
                            <div className="space-y-6">
                                {[
                                    { label: 'TEMP', value: predictions.temp, progress: 'w-3/4', color: 'primary' },
                                    { label: 'PH LEVEL', value: predictions.ph, progress: 'w-2/3', color: 'secondary' },
                                    { label: 'TDS', value: predictions.tds, progress: 'w-4/5', color: 'tertiary' },
                                    { label: 'EC (µS)', value: predictions.ec, progress: 'w-1/2', color: 'primary-dim' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <span className="text-xs font-medium text-on-surface-variant">{item.label}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-headline font-bold text-white">{item.value}</span>
                                            <div className="w-16 h-1 bg-surface-variant rounded-full overflow-hidden">
                                                <div className={`h-full bg-${item.color} ${item.progress} transition-all duration-1000`}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => navigate('/prognosis')}
                                className="w-full mt-10 py-4 rounded-xl bg-surface-bright/50 border border-outline-variant/30 text-primary font-headline font-bold text-sm tracking-widest uppercase hover:bg-surface-bright transition-all active:scale-[0.98]"
                            >
                                Full Prognosis
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="glass-panel p-5 rounded-xl flex items-center justify-between border border-outline-variant/10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-bold text-white">Sensor Integrity</h4>
                                    <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Node Alpha-9 Active</p>
                                </div>
                            </div>
                            <span className="text-xs font-headline font-bold text-secondary">98%</span>
                        </div>
                        <div className="glass-panel p-5 rounded-xl flex items-center justify-between border border-outline-variant/10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-tertiary text-lg">cloud_sync</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-bold text-white">Last Backup</h4>
                                    <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Encrypted Cloud</p>
                                </div>
                            </div>
                            <span className="text-xs font-headline font-bold text-on-surface-variant">2M AGO</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* World Standards Comparison */}
            <section className="glass-panel p-8 rounded-xl border border-outline-variant/10 shadow-[0_4px_32px_rgba(0,0,0,0.2)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-xl font-headline font-bold text-white">Compliance Overview</h2>
                        <p className="text-sm text-on-surface-variant">Comparative analysis against WHO drinking water guidelines.</p>
                    </div>
                    <div className="flex items-center gap-4 p-2 bg-surface-container-low rounded-xl border border-outline-variant/10">
                        <img className="w-12 h-12 rounded-lg object-cover" alt="Water crystals" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb5i2IS522GMNHDHv4bPnInXqYcEWExr5lO_KWaGgATn7arqgTOsUsKYMLktLQF_GMg3BEKM9m6R6m_iFnBcitGN7ZAlxAj3Q7wuUi9J4WC3A6iDmArmMMHSCJDZ17Ga3Y30DJLpGbm5yJSufXwMIlUftGkZ0o_RRXIBx_Bb0HMVM1tqj7NuZTBHHPu26ZGGr_rT3xKyalPO8Wk6zpEiSS1HmhPEVQSSu-NVHzz2FnDqjDyoRVZKcN5a7iTl9h4C0WkPqSbZG_eow" />
                        <div>
                            <p className="text-[10px] font-bold text-primary uppercase">Current Batch</p>
                            <p className="text-xs text-white">Potable Grade A</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Chlorine', value: '0.2', unit: 'mg/L' },
                        { label: 'Turbidity', value: '0.4', unit: 'NTU' },
                        { label: 'Nitrates', value: '14.2', unit: 'mg/L' },
                        { label: 'Fluoride', value: '0.8', unit: 'mg/L' },
                    ].map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                            <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">{item.label}</p>
                            <p className="text-xl font-headline font-bold text-white">{item.value} <span className="text-[10px] font-normal text-on-surface-variant">{item.unit}</span></p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default Analytics
