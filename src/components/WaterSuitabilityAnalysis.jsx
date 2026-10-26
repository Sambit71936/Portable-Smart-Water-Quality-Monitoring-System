import { useState } from 'react'
import { useWaterQuality } from '../context/WaterQualityContext'

export default function WaterSuitabilityAnalysis() {
  const { waterAnalysis, metrics } = useWaterQuality()
  const [selectedUse, setSelectedUse] = useState('drinkingWater')

  if (!waterAnalysis) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-outline text-center">
        <p className="text-on-surface-variant">Connect device and collect data to view suitability analysis</p>
      </div>
    )
  }

  const suitability = waterAnalysis.suitability[selectedUse]
  if (!suitability) return null

  const getSuitabilityColor = (level) => {
    switch (level) {
      case 'SUITABLE':
        return 'text-green-400'
      case 'MARGINAL':
        return 'text-yellow-400'
      case 'UNSUITABLE':
        return 'text-red-400'
      default:
        return 'text-on-surface'
    }
  }

  const getSuitabilityBgColor = (level) => {
    switch (level) {
      case 'SUITABLE':
        return 'bg-green-600 bg-opacity-20 border-green-600'
      case 'MARGINAL':
        return 'bg-yellow-600 bg-opacity-20 border-yellow-600'
      case 'UNSUITABLE':
        return 'bg-red-600 bg-opacity-20 border-red-600'
      default:
        return 'bg-outline bg-opacity-10'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#ffff00'
    if (score >= 40) return '#ff9900'
    return '#ff3333'
  }

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className={`p-4 rounded-lg border ${getSuitabilityBgColor(waterAnalysis.overallRating)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">Overall Water Quality Rating</p>
            <p className={`text-2xl font-bold ${getSuitabilityColor(waterAnalysis.overallRating)}`}>
              {waterAnalysis.overallRating}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant mb-2">Suitable Uses</p>
            <p className="text-lg font-semibold text-primary">
              {waterAnalysis.topRecommendations.length > 0 
                ? waterAnalysis.topRecommendations.length 
                : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Top Recommendations */}
      {waterAnalysis.topRecommendations.length > 0 && (
        <div className="bg-surface rounded-lg border border-outline p-4">
          <p className="text-sm font-semibold text-on-surface mb-3">Recommended Uses</p>
          <div className="space-y-2">
            {waterAnalysis.topRecommendations.map((rec, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-outline bg-opacity-10 rounded">
                <span className="text-on-surface text-sm">{rec.use}</span>
                <span className="text-primary font-bold text-sm">{rec.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {waterAnalysis.warnings.length > 0 && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-400 mb-3">⚠ Warnings</p>
          <div className="space-y-2">
            {waterAnalysis.warnings.map((warning, idx) => (
              <p key={idx} className="text-xs text-on-surface">
                <span className={warning.severity === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-yellow-400'}>
                  [{warning.severity}]
                </span>
                {' '}{warning.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Use Case Selection */}
      <div className="bg-surface rounded-lg border border-outline p-4">
        <p className="text-sm font-semibold text-on-surface mb-3">Check Suitability For</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(waterAnalysis.suitability).map(([key, assessment]) => (
            <button
              key={key}
              onClick={() => setSelectedUse(key)}
              className={`p-2 rounded text-xs font-medium transition-colors ${
                selectedUse === key
                  ? 'bg-primary text-on-primary'
                  : `${getSuitabilityBgColor(assessment.suitability)} ${getSuitabilityColor(assessment.suitability)}`
              }`}
            >
              {assessment.use.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Assessment */}
      <div className={`rounded-lg border p-4 ${getSuitabilityBgColor(suitability.suitability)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-on-surface">{suitability.use}</h3>
          <div className="text-right">
            <p className={`text-2xl font-bold ${getSuitabilityColor(suitability.suitability)}`}>
              {suitability.suitability}
            </p>
            <p className="text-xs text-on-surface-variant">Score: {suitability.score}/100</p>
          </div>
        </div>

        {/* Score Visualization */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-on-surface-variant">Suitability Score</span>
            <span className="text-sm font-bold" style={{ color: getScoreColor(suitability.score) }}>
              {suitability.score}%
            </span>
          </div>
          <div className="w-full bg-outline bg-opacity-20 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${suitability.score}%`,
                backgroundColor: getScoreColor(suitability.score)
              }}
            />
          </div>
        </div>

        {/* Parameter Status */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold text-on-surface-variant">Parameter Status</p>
          {Object.entries(suitability.parameters).map(([key, param]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-surface bg-opacity-20 rounded">
              <div className="flex-1">
                <p className="text-xs text-on-surface capitalize font-medium">{key}</p>
                <p className="text-xs text-on-surface-variant">{param.value}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold ${
                  param.status === 'OPTIMAL' ? 'text-green-400' :
                  param.status === 'WARNING' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {param.status}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Issues */}
        {suitability.issues.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-on-surface-variant mb-2">Issues Found</p>
            <ul className="space-y-1">
              {suitability.issues.map((issue, idx) => (
                <li key={idx} className="text-xs text-on-surface-variant flex items-start">
                  <span className="mr-2">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {suitability.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-on-surface-variant mb-2">Recommended Actions</p>
            <ul className="space-y-1">
              {suitability.recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-primary flex items-start">
                  <span className="mr-2">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
