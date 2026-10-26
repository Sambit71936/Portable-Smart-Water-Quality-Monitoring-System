import React from 'react';

/**
 * LocationDataCards Component
 * Displays selected location data, sensor data, and comparison results
 */
const LocationDataCards = ({ locationData, sensorData, comparisonData }) => {
  if (!locationData && !sensorData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full flex items-center justify-center p-12 rounded-xl bg-surface-container/50 border border-outline-variant/20">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">
              location_on
            </span>
            <p className="text-slate-400 text-sm font-medium">
              Click on the map to select a location and view water quality data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Location Data Card */}
      {locationData && (
        <div className="glass-panel rounded-2xl p-6 border border-outline-variant/20 hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-headline font-bold text-white tracking-tight">
                Dataset Location
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                {locationData.source}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">map</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-lg bg-surface-container/50">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">
                Location
              </p>
              <p className="font-headline font-bold text-white text-sm line-clamp-2">
                {locationData.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-surface-container/50">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-1">
                  Latitude
                </p>
                <p className="font-mono font-bold text-slate-300 text-xs">
                  {locationData.lat.toFixed(4)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-surface-container/50">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-1">
                  Longitude
                </p>
                <p className="font-mono font-bold text-slate-300 text-xs">
                  {locationData.lng.toFixed(4)}
                </p>
              </div>
            </div>

            {locationData.distance && (
              <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                <p className="text-[10px] text-secondary font-medium uppercase tracking-widest mb-1">
                  Distance
                </p>
                <p className="font-mono font-bold text-secondary text-sm">
                  {locationData.distance.toFixed(1)} km
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-outline-variant/20">
            <DataParameterRow
              label="pH"
              value={locationData.ph}
              unit=""
              status={getParameterStatus(locationData.ph, 'ph')}
            />
            <DataParameterRow
              label="TDS"
              value={locationData.tds}
              unit="ppm"
              status={getParameterStatus(locationData.tds, 'tds')}
            />
            <DataParameterRow
              label="Temperature"
              value={locationData.temperature}
              unit="°C"
              status={getParameterStatus(locationData.temperature, 'temperature')}
            />
            {locationData.ec && (
              <DataParameterRow
                label="EC"
                value={locationData.ec}
                unit="µS/cm"
                status={getParameterStatus(locationData.ec, 'ec')}
              />
            )}
          </div>
        </div>
      )}

      {/* Sensor Data Card */}
      {sensorData && (
        <div className="glass-panel rounded-2xl p-6 border border-outline-variant/20 hover:border-secondary/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-headline font-bold text-white tracking-tight">
                Sensor Reading
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                Live Data
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-xl">sensors</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {sensorData.deviceName && (
              <div className="p-3 rounded-lg bg-surface-container/50">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-1">
                  Device
                </p>
                <p className="font-headline font-bold text-white text-sm">
                  {sensorData.deviceName}
                </p>
              </div>
            )}

            {sensorData.timestamp && (
              <div className="p-3 rounded-lg bg-surface-container/50">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-1">
                  Last Reading
                </p>
                <p className="font-mono font-bold text-slate-300 text-xs">
                  {new Date(sensorData.timestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-outline-variant/20">
            <DataParameterRow label="pH" value={sensorData.ph} unit="" />
            <DataParameterRow label="TDS" value={sensorData.tds} unit="ppm" />
            <DataParameterRow label="Temperature" value={sensorData.temp} unit="°C" />
            {sensorData.ec && <DataParameterRow label="EC" value={sensorData.ec} unit="µS/cm" />}
            {sensorData.do && <DataParameterRow label="DO" value={sensorData.do} unit="mg/L" />}
          </div>
        </div>
      )}

      {/* Comparison Card */}
      {comparisonData && (
        <div className="glass-panel rounded-2xl p-6 border border-outline-variant/20 hover:border-tertiary/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-headline font-bold text-white tracking-tight">
                Comparison
              </h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                Analysis
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-xl">compare</span>
            </div>
          </div>

          {comparisonData.summary && (
            <div className="mb-6 p-4 rounded-lg bg-tertiary/5 border border-tertiary/20">
              <p className="text-xs text-slate-300 leading-relaxed">
                {comparisonData.summary}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {comparisonData.parameters?.slice(0, 4).map((param, idx) => (
              <ComparisonParameterRow key={idx} param={param} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Data Parameter Row Component
 */
const DataParameterRow = ({ label, value, unit, status }) => {
  const statusColor =
    status === 'SAFE'
      ? 'text-green-400'
      : status === 'MODERATE'
        ? 'text-yellow-400'
        : status === 'UNSAFE'
          ? 'text-red-400'
          : 'text-slate-400';

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container/50 transition-colors">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-slate-200 text-sm">
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        {unit && <span className="text-[10px] text-slate-500 font-medium">{unit}</span>}
        {status && <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor}`}>
          {status}
        </span>}
      </div>
    </div>
  );
};

/**
 * Comparison Parameter Row Component
 */
const ComparisonParameterRow = ({ param }) => {
  const statusColor =
    param.status === 'SIMILAR'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      : param.status === 'BETTER'
        ? 'bg-green-500/10 text-green-400 border-green-500/30'
        : 'bg-red-500/10 text-red-400 border-red-500/30';

  const icon =
    param.status === 'SIMILAR' ? '≈' : param.status === 'BETTER' ? '✓' : '⚠';

  return (
    <div className="p-3 rounded-lg bg-surface-container/30 border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-headline font-bold text-slate-300">{param.name}</span>
        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${statusColor}`}>
          {icon} {param.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex gap-4">
          <span className="text-slate-500">
            Sensor: <span className="text-slate-300 font-mono font-bold">{param.sensor.toFixed(1)}</span>
          </span>
          <span className="text-slate-500">
            Dataset: <span className="text-slate-300 font-mono font-bold">{param.dataset.toFixed(1)}</span>
          </span>
        </div>
        <span className="text-slate-400">
          Δ <span className="text-slate-300 font-mono font-bold">{param.difference > 0 ? '+' : ''}{param.difference}</span>
        </span>
      </div>
    </div>
  );
};

/**
 * Get parameter status based on WHO standards
 */
const getParameterStatus = (value, paramType) => {
  const WHO_STANDARDS = {
    ph: { min: 6.5, max: 8.5 },
    tds: { max: 500 },
    temperature: { min: 5, max: 30 },
    ec: { max: 1000 },
  };

  const standard = WHO_STANDARDS[paramType];
  if (!standard) return '';

  if (paramType === 'ph') {
    if (value >= standard.min && value <= standard.max) return 'SAFE';
    return 'UNSAFE';
  } else if (paramType === 'tds') {
    if (value <= standard.max * 0.6) return 'SAFE';
    if (value <= standard.max) return 'MODERATE';
    return 'UNSAFE';
  } else if (paramType === 'temperature') {
    if (value >= standard.min && value <= standard.max) return 'SAFE';
    return 'MODERATE';
  } else if (paramType === 'ec') {
    if (value <= standard.max * 0.5) return 'SAFE';
    if (value <= standard.max) return 'MODERATE';
    return 'UNSAFE';
  }

  return '';
};

export default LocationDataCards;
