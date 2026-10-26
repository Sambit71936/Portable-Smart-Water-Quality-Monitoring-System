import React from 'react'

const FilterModal = ({ isOpen, onClose, selectedFilter, onSelect }) => {
  if (!isOpen) return null

  const options = ['All', 'Optimal', 'Alert']

  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-6 bg-background/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-t-3xl md:rounded-2xl p-8 overflow-hidden relative border border-outline-variant/20 animate-in slide-in-from-bottom-full duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse"></div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-headline font-bold text-white tracking-tight">Filter Archives</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Select record status to display</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="space-y-3">
          {options.map(option => (
            <button
              key={option}
              onClick={() => {
                onSelect(option)
                onClose()
              }}
              className={`w-full p-5 rounded-xl border flex items-center justify-between transition-all active:scale-[0.98] ${
                selectedFilter === option
                  ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(129,236,255,0.1)]'
                  : 'bg-surface-container-low border-outline-variant/10 hover:border-primary/30'
              }`}
            >
              <span className={`font-headline font-bold text-sm ${selectedFilter === option ? 'text-primary' : 'text-slate-300'}`}>
                {option}
              </span>
              {selectedFilter === option && (
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 rounded-xl bg-surface-container-highest border border-outline-variant/10 text-slate-400 font-headline font-bold text-[10px] tracking-widest uppercase hover:text-white hover:bg-surface-bright/20 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default FilterModal
