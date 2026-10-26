import React from 'react';

/**
 * WHO Risk Assessment Card Component
 * Displays water quality risk level based on WHO standards
 */
const WhoRiskCard = ({ riskData }) => {
  if (!riskData) {
    return null;
  }

  const { level, score, details, recommendations } = riskData;

  const getRiskColor = () => {
    switch (level) {
      case 'SAFE':
        return 'from-green-600 to-emerald-600';
      case 'MODERATE':
        return 'from-yellow-600 to-amber-600';
      case 'UNSAFE':
        return 'from-red-600 to-rose-600';
      default:
        return 'from-slate-600 to-slate-700';
    }
  };

  const getRiskBgColor = () => {
    switch (level) {
      case 'SAFE':
        return 'bg-green-500/10 border-green-500/30';
      case 'MODERATE':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'UNSAFE':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  const getRiskTextColor = () => {
    switch (level) {
      case 'SAFE':
        return 'text-green-400';
      case 'MODERATE':
        return 'text-yellow-400';
      case 'UNSAFE':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/20">
      {/* Header with Gradient */}
      <div className={`bg-gradient-to-r ${getRiskColor()} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-white/80 mb-1">
              WHO Risk Assessment
            </p>
            <h2 className="text-3xl font-headline font-bold text-white tracking-tight">
              {level}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80 font-medium mb-1">Risk Score</p>
            <p className="text-4xl font-bold text-white font-mono">{score}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Parameter Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(details).map(([key, param]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border transition-all ${
                param.status === 'SAFE'
                  ? 'bg-green-500/5 border-green-500/30'
                  : param.status === 'MODERATE'
                    ? 'bg-yellow-500/5 border-yellow-500/30'
                    : 'bg-red-500/5 border-red-500/30'
              }`}
            >
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                {key === 'ph' ? 'pH' : key === 'tds' ? 'TDS' : key === 'temperature' ? 'Temp' : 'EC'}
              </p>
              <p className="text-lg font-mono font-bold text-white mb-1">
                {param.value.toFixed(1)}
              </p>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${
                  param.status === 'SAFE'
                    ? 'bg-green-500/20 text-green-400'
                    : param.status === 'MODERATE'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                }`}
              >
                {param.status}
              </span>
            </div>
          ))}
        </div>

        {/* Risk Assessment Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-headline font-bold text-slate-300">Overall Risk</p>
            <p className="text-sm font-mono font-bold text-slate-400">{score}/100</p>
          </div>
          <div className="w-full bg-surface-container/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getRiskColor()} transition-all duration-500`}
              style={{ width: `${Math.min(score, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {score < 20
              ? 'Excellent water quality'
              : score < 50
                ? 'Acceptable with minor concerns'
                : score < 80
                  ? 'Poor water quality - treatment recommended'
                  : 'Critical - immediate action required'}
          </p>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-outline-variant/20">
            <p className="text-sm font-headline font-bold text-slate-300">Recommendations</p>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-surface-container/50">
                  <span className="text-primary font-bold text-lg mt-0.5 flex-shrink-0">•</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHO Standards Reference */}
        <div className={`p-4 rounded-lg border ${getRiskBgColor()}`}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-slate-300">
            WHO Standards
          </p>
          <ul className="space-y-1 text-[10px] text-slate-400">
            <li>pH: 6.5 - 8.5</li>
            <li>TDS: ≤ 500 ppm</li>
            <li>Temperature: 5 - 30°C</li>
            <li>EC: ≤ 1000 µS/cm</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WhoRiskCard;
