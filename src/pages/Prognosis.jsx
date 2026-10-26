import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterQuality } from '../context/WaterQualityContext'

const Prognosis = () => {
  const navigate = useNavigate()
  const { predictions } = useWaterQuality()

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-slate-400 hover:text-white transition-all border border-outline-variant/10"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
        <div>
          <p className="text-primary font-label text-[10px] tracking-[0.2em] uppercase mb-1">AI Diagnostic Hub</p>
          <h2 className="font-headline text-4xl font-bold tracking-tighter text-white">Full Prognosis</h2>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Prediction Card */}
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden border border-primary/20">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <span className="material-symbols-outlined text-9xl">auto_awesome</span>
          </div>
          <h3 className="text-lg font-headline font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Projected Metrics (Next 24h)
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            {[
              { label: 'Temperature', value: predictions.temp, trend: 'increasing', change: '+0.4°C' },
              { label: 'Acidity (pH)', value: predictions.ph, trend: 'decreasing', change: '-0.1' },
              { label: 'TDS (PPM)', value: predictions.tds, trend: 'increasing', change: '+23 ppm' },
              { label: 'EC (µS/cm)', value: predictions.ec, trend: 'stable', change: '0' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-2xl font-headline font-extrabold text-white">{item.value}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 font-bold text-xs ${item.trend === 'increasing' ? 'text-tertiary' : item.trend === 'decreasing' ? 'text-secondary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">
                      {item.trend === 'increasing' ? 'trending_up' : item.trend === 'decreasing' ? 'trending_down' : 'trending_flat'}
                    </span>
                    {item.change}
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">Variance</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk & Explanation */}
        <div className="space-y-8">
          <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
            <h3 className="text-lg font-headline font-bold text-white mb-6">Risk Level Prediction</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="188.4 251.2" strokeLinecap="round" strokeWidth="12"></circle>
                  <circle className="text-tertiary drop-shadow-[0_0_12px_rgba(166,140,255,0.4)]" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="94.2 251.2" strokeLinecap="round" strokeWidth="12"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pt-2">
                  <span className="font-headline font-bold text-lg text-white">50%</span>
                </div>
              </div>
              <div>
                <span className="text-tertiary font-headline font-extrabold text-3xl tracking-tight uppercase">MODERATE</span>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">System predicts a temporary shift outside optimal thresholds within the next 14-16 hours.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-primary"></div>
            <h3 className="text-lg font-headline font-bold text-white mb-4">AI Interpretation</h3>
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {predictions.trend} This is likely caused by the localized temperature increase leading to higher mineral solubility in the system node.
              </p>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  Recommendation
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">Increase flow rate by 15% and check filtration membranes before 20:00 tonight to maintain Grade A potable status.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="glass-panel p-8 rounded-2xl border border-outline-variant/10">
        <h3 className="text-lg font-headline font-bold text-white mb-8">Long-term Reliability Trend</h3>
        <div className="h-48 w-full neon-grid relative rounded-xl border border-outline-variant/10 overflow-hidden px-4">
          <svg className="w-full h-full" viewBox="0 0 800 160">
            <path className="text-primary/20" d="M0,80 L800,80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"></path>
            <path className="text-primary drop-shadow-[0_0_15px_rgba(129,236,255,0.5)]" d="M0,120 Q100,110 200,100 T400,60 T600,40 T800,30" fill="none" stroke="currentColor" strokeWidth="3"></path>
            <path className="text-secondary/40" d="M0,130 Q100,125 200,115 T400,90 T600,85 T800,80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4"></path>
            <circle cx="400" cy="60" r="4" className="text-primary" fill="currentColor"></circle>
            <text x="410" y="55" className="fill-white text-[10px] font-bold">Predicted Intersection</text>
          </svg>
          <div className="flex justify-between mt-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            <span>Current Week</span>
            <span>Projection</span>
            <span>End of Month</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Prognosis
