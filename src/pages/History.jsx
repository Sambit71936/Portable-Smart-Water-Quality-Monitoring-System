import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWaterQuality } from '../context/WaterQualityContext'
import FilterModal from '../components/FilterModal'

const History = () => {
    const navigate = useNavigate()
    const { history, historyFilter, setHistoryFilter, loadArchive, exportData } = useWaterQuality()
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const filteredEntries = history.filter(entry => 
        historyFilter === 'All' ? true : entry.type === historyFilter
    )

    const handleExport = () => {
        alert('Compiling system archives... Generating report.')
        exportData('pdf').then(() => {
            alert('Full history report exported successfully!')
        })
    }

    return (
        <main className="space-y-10 pb-12">
            {/* Editorial Header Section */}
            <div className="mb-10">
                <p className="text-primary font-label text-xs tracking-[0.2em] uppercase mb-2">System Archives</p>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <h2 className="font-headline text-5xl font-bold tracking-tighter text-white">History</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsFilterOpen(true)}
                            className={`px-4 py-2 rounded-full border transition-all text-xs font-medium flex items-center gap-2 ${historyFilter !== 'All' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-variant/40 border-outline-variant/15 text-on-surface-variant hover:bg-surface-bright'}`}
                        >
                            <span className="material-symbols-outlined text-sm">filter_list</span>
                            {historyFilter === 'All' ? 'Filter' : historyFilter}
                        </button>
                        <button 
                            onClick={handleExport}
                            className="bg-surface-variant/40 backdrop-blur px-4 py-2 rounded-full border border-outline-variant/15 text-xs font-medium flex items-center gap-2 hover:bg-surface-bright transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            <FilterModal 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                selectedFilter={historyFilter}
                onSelect={setHistoryFilter}
            />

            {/* History Feed */}
            <div className="grid grid-cols-1 gap-6">
                {filteredEntries.map((entry, idx) => (
                    <div key={idx} className={`glass-card glow-border rounded-xl p-6 transition-all duration-300 ${entry.type === 'Alert' ? 'border-l-error/40' : entry.type === 'Optimal' ? 'border-l-secondary/40' : ''}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div className="flex flex-col">
                                <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold mb-1">{entry.date}</span>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-headline text-xl font-semibold tracking-tight">System Reading #{entry.id}</h3>
                                    <span className={`px-3 py-0.5 rounded-full bg-${entry.type === 'Alert' ? 'error' : entry.type === 'Optimal' ? 'secondary' : entry.type === 'Calibration' ? 'tertiary' : 'slate-500'}/10 border border-${entry.type === 'Alert' ? 'error' : entry.type === 'Optimal' ? 'secondary' : entry.type === 'Calibration' ? 'tertiary' : 'slate-500'}/30 text-${entry.type === 'Alert' ? 'error' : entry.type === 'Optimal' ? 'secondary' : entry.type === 'Calibration' ? 'tertiary' : 'slate-400'} text-[10px] font-bold uppercase tracking-wider`}>
                                        {entry.type}
                                    </span>
                                </div>
                            </div>
                            <div className="h-px flex-grow bg-outline-variant/10 hidden md:block mx-8"></div>
                            <button 
                                onClick={() => navigate(`/history/${entry.id}`)}
                                className="p-2 rounded-full bg-surface-container-highest hover:bg-primary/10 hover:text-primary transition-all group"
                            >
                                <span className="material-symbols-outlined transform group-hover:rotate-45 transition-transform">open_in_full</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: 'Temperature', value: entry.values.temp, unit: '°C', color: entry.values.temp > 30 ? 'error' : '' },
                                { label: 'Acidity (pH)', value: entry.values.ph, unit: 'pH', color: entry.values.ph > 8.5 ? 'error' : '' },
                                { label: 'TDS', value: entry.values.tds, unit: 'ppm' },
                                { label: 'EC', value: entry.values.ec, unit: 'μS' },
                            ].map((metric, midx) => (
                                <div key={midx} className="flex flex-col gap-1">
                                    <p className="text-on-surface-variant text-[10px] uppercase font-medium">{metric.label}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`font-headline text-3xl font-bold ${metric.color === 'error' ? 'text-error' : ''}`}>{metric.value}</span>
                                        <span className="text-sm text-on-surface-variant">{metric.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredEntries.length === 0 && (
                    <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-slate-700 text-6xl mb-4">search_off</span>
                        <h3 className="text-xl font-headline font-bold text-white mb-2">No Records Found</h3>
                        <p className="text-on-surface-variant text-sm">There are no {historyFilter.toLowerCase()} records in the system archive.</p>
                        <button onClick={() => setHistoryFilter('All')} className="mt-6 text-primary font-bold text-xs uppercase tracking-widest hover:underline">Clear Filter</button>
                    </div>
                )}
            </div>

            {/* Load More Section */}
            <div className="mt-12 flex justify-center">
                <button 
                    onClick={loadArchive}
                    className="group flex items-center gap-3 text-sm font-bold tracking-widest uppercase py-4 px-8 rounded-full border border-outline-variant/20 hover:border-primary/50 transition-all font-headline bg-surface-container-low"
                >
                    Load Archive
                    <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">expand_more</span>
                </button>
            </div>
        </main>
    )
}

export default History
