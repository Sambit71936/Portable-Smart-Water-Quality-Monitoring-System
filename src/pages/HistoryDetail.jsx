import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWaterQuality } from '../context/WaterQualityContext'

const HistoryDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { history } = useWaterQuality()

    const entry = history.find(e => e.id === id)

    if (!entry) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-center">
                <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
                <h2 className="text-2xl font-headline font-bold text-white mb-2">Record Not Found</h2>
                <p className="text-on-surface-variant text-sm mb-8">The requested archive reading #{id} could not be located.</p>
                <button 
                  onClick={() => navigate('/history')}
                  className="bg-primary text-on-primary font-bold px-8 py-3 rounded-full transition-all"
                >
                  Return to History
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-slate-400 hover:text-white transition-all border border-outline-variant/10"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
                <div>
                  <p className="text-slate-500 font-label text-[10px] tracking-[0.2em] uppercase mb-1">{entry.date}</p>
                  <h2 className="font-headline text-4xl font-bold tracking-tighter text-white uppercase">Reading #{entry.id}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Metrics Stack */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
                        <div className="flex items-center gap-3 mb-8">
                          <span className={`w-3 h-3 rounded-full animate-pulse bg-${entry.type === 'Alert' ? 'error' : 'secondary'}`}></span>
                          <h3 className="text-lg font-headline font-bold text-white uppercase tracking-tight">Status: {entry.status}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Temperature', value: entry.values.temp, unit: '°C', icon: 'device_thermostat', color: 'primary' },
                                { label: 'Acidity (pH)', value: entry.values.ph, unit: 'pH', icon: 'science', color: 'secondary' },
                                { label: 'TDS (Total Dissolved Solids)', value: entry.values.tds, unit: 'ppm', icon: 'opacity', color: 'tertiary' },
                                { label: 'Electrical Conductivity', value: entry.values.ec, unit: 'μS/cm', icon: 'bolt', color: 'primary-dim' },
                            ].map((item, idx) => (
                                <div key={idx} className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/5 group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                      <span className={`material-symbols-outlined text-${item.color} text-lg`}>{item.icon}</span>
                                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{item.label}</p>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-3xl font-headline font-extrabold text-white">{item.value}</span>
                                      <span className="text-sm text-slate-500">{item.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-2xl border-l-4 border-primary bg-primary/5">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Deep Context Analysis</h4>
                        <p className="text-white font-headline text-xl leading-snug">The system detected a deviation in <span className="text-primary font-bold">water mineralization</span> which triggered the current status.</p>
                        <div className="mt-8 flex gap-4">
                          <div className="flex-1 p-4 rounded-xl bg-background/50 border border-outline-variant/10">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Calibration Confidence</span>
                            <p className="text-lg font-headline font-bold text-white">99.2%</p>
                          </div>
                          <div className="flex-1 p-4 rounded-xl bg-background/50 border border-outline-variant/10">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sensor Latency</span>
                            <p className="text-lg font-headline font-bold text-white">42ms</p>
                          </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden bg-gradient-to-br from-surface-variant/20 to-surface-container-low">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <span className="material-symbols-outlined text-6xl">water_damage</span>
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-outline-variant/10 pb-4">Water Usage Recommendation</h4>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-8 italic">
                          "{entry.rec}"
                        </p>
                        <div className="space-y-3">
                          {[
                            { label: 'Drinking Grade', status: entry.type === 'Alert' ? 'CAUTION' : 'OPTIMAL', color: entry.type === 'Alert' ? 'tertiary' : 'secondary' },
                            { label: 'Irrigation Suitability', status: 'STABLE', color: 'secondary' },
                            { label: 'Aquatic Life Safety', status: 'MONITOR', color: 'primary' },
                          ].map((rec, idx) => (
                            <div key={idx} className="flex justify-between items-center py-3 border-b border-outline-variant/5 last:border-0">
                              <span className="text-xs text-slate-400">{rec.label}</span>
                              <span className={`text-[10px] font-extrabold text-${rec.color} tracking-tighter uppercase`}>{rec.status}</span>
                            </div>
                          ))}
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-2xl bg-surface-container-high border border-outline-variant/10">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Risk Level Analysis</p>
                        <div className="flex items-center gap-4">
                          <span className={`text-3xl font-headline font-extrabold ${entry.type === 'Alert' ? 'text-error' : 'text-secondary'}`}>
                            {entry.type === 'Alert' ? 'HIGH' : 'LOW'}
                          </span>
                          <span className="material-symbols-outlined text-slate-700">trending_flat</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-4 leading-relaxed">This reading was logged manually. Cross-referenced with WHO drinking standards for node compliance.</p>
                    </div>

                    <button className="w-full py-4 rounded-xl bg-surface-bright/30 border border-outline-variant/20 text-on-surface font-headline font-bold text-xs uppercase tracking-[0.2em] hover:bg-surface-bright transition-all active:scale-[0.98]">
                      Export Reading Data
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HistoryDetail
