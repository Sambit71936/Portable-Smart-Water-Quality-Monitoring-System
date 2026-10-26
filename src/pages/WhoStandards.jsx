import React from 'react'

const WhoStandards = () => {
    const parameters = [
        { name: 'pH', desc: 'Acidity/Alkalinity', current: '7.40', standard: '6.5 - 8.5', icon: 'science', status: 'SAFE', color: 'secondary' },
        { name: 'TDS', desc: 'Total Dissolved Solids', current: '115', standard: '< 500', unit: 'mg/L', icon: 'opacity', status: 'SAFE', color: 'secondary' },
        { name: 'Temp', desc: 'Water Temperature', current: '27.9', standard: '< 30', unit: '°C', icon: 'thermostat', status: 'SAFE', color: 'secondary' },
        { name: 'EC', desc: 'Electrical Conductivity', current: '189', standard: '< 400', unit: 'µS/cm', icon: 'electric_bolt', status: 'SAFE', color: 'secondary' },
    ]

    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div className="mb-10">
                <p className="text-primary font-headline tracking-widest text-xs uppercase mb-2">Compliance Dashboard</p>
                <h2 className="text-4xl font-headline font-bold tracking-tight text-on-surface leading-none">WHO Standards</h2>
                <p className="text-on-surface-variant mt-3 max-w-xl text-sm leading-relaxed">
                    Real-time comparison of current sensor telemetry against the World Health Organization guidelines for potable water quality.
                </p>
            </div>

            {/* Comparison Table */}
            <div className="space-y-4">
                <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-headline font-bold text-outline">
                    <div className="col-span-4">Parameter</div>
                    <div className="col-span-3 text-center">Current Value</div>
                    <div className="col-span-3 text-center">WHO Standard</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                {parameters.map((param, idx) => (
                    <div key={idx} className="glass-panel ghost-border rounded-xl p-6 transition-all duration-300 hover:bg-surface-bright/10 group">
                        <div className="grid grid-cols-12 items-center">
                            <div className="col-span-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">{param.icon}</span>
                                </div>
                                <div>
                                    <p className="font-headline font-bold text-lg">{param.name}</p>
                                    <p className="text-[10px] text-outline uppercase tracking-wider font-medium">{param.desc}</p>
                                </div>
                            </div>
                            <div className="col-span-3 text-center">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="font-headline text-2xl font-light text-on-surface">{param.current}</span>
                                    {param.unit && <span className="text-[10px] text-outline font-bold">{param.unit}</span>}
                                </div>
                            </div>
                            <div className="col-span-3 text-center">
                                <span className="font-body text-sm text-on-surface-variant">{param.standard}</span>
                            </div>
                            <div className="col-span-2 flex justify-end items-center gap-2">
                                <span className={`text-[10px] font-headline font-bold text-${param.color} uppercase tracking-widest`}>{param.status}</span>
                                <div className={`w-2 h-2 rounded-full bg-${param.color} shadow-[0_0_8px_#00ffab]`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Additional Context Card */}
            <div className="mt-8 p-6 rounded-xl border border-primary/10 bg-primary/5 flex gap-6 items-start">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <span className="material-symbols-outlined">info</span>
                </div>
                <div>
                    <h4 className="font-headline font-bold text-on-surface uppercase tracking-wider text-sm mb-1">Standard Reference</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                        The values displayed are benchmarked against the 4th edition of the World Health Organization (WHO) Guidelines for Drinking-water Quality. Last synchronized with global standards on Oct 2023.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default WhoStandards
