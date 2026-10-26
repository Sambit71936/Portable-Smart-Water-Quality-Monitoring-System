const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

function pseudoRandom01(seed) {
  // Deterministic pseudo-random in [0,1)
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function seedFromLatLon(lat, lon) {
  // Stable seed across sessions for same coordinates
  return lat * 1000 + lon * 1000 + lat * lon
}

export function simulateLocationWaterQuality(lat, lon) {
  const seed = seedFromLatLon(lat, lon)

  const r1 = pseudoRandom01(seed + 1)
  const r2 = pseudoRandom01(seed + 2)
  const r3 = pseudoRandom01(seed + 3)
  const r4 = pseudoRandom01(seed + 4)

  // Reasonable ranges for a "regional" baseline
  const ph = clamp(6.6 + r1 * 1.8, 6.0, 9.0) // ~6.6–8.4
  const tds = Math.round(clamp(120 + r2 * 420, 50, 900)) // ppm
  const temperature = parseFloat(clamp(22 + r3 * 10, 10, 40).toFixed(1)) // °C
  const ec = Math.round(clamp(180 + r4 * 820, 100, 2000)) // µS/cm

  return { ph: parseFloat(ph.toFixed(2)), tds, temperature, ec }
}

const IDEAL = {
  ph: 7.0,
  temperature: 25.0,
}

export function compareSensorToLocation(sensor, location) {
  const diffs = {
    ph: parseFloat((sensor.ph - location.ph).toFixed(2)),
    tds: Math.round(sensor.tds - location.tds),
    temperature: parseFloat((sensor.temp - location.temperature).toFixed(1)),
    ec: Math.round(sensor.ec - location.ec),
  }

  const score = {
    ph: Math.abs(sensor.ph - IDEAL.ph) - Math.abs(location.ph - IDEAL.ph),
    temperature:
      Math.abs(sensor.temp - IDEAL.temperature) - Math.abs(location.temperature - IDEAL.temperature),
    tds: sensor.tds - location.tds, // lower is better
    ec: sensor.ec - location.ec, // lower is better
  }

  const classify = (metric) => {
    const v = score[metric]
    const threshold = metric === 'ph' ? 0.15 : metric === 'temperature' ? 0.7 : metric === 'tds' ? 25 : 40
    if (Math.abs(v) <= threshold) return 'similar'
    return v < 0 ? 'better' : 'worse'
  }

  const verdict = {
    ph: classify('ph'),
    tds: classify('tds'),
    temperature: classify('temperature'),
    ec: classify('ec'),
  }

  const explanation = (metric) => {
    const v = verdict[metric]
    if (v === 'similar') return 'Water quality is similar.'

    if (metric === 'tds') {
      return v === 'better'
        ? 'Your water has lower TDS than this region.'
        : 'Higher contamination detected (higher TDS than this region).'
    }
    if (metric === 'ec') {
      return v === 'better'
        ? 'Your water shows lower conductivity than this region.'
        : 'Higher mineral/ion concentration detected (higher EC than this region).'
    }
    if (metric === 'ph') {
      return v === 'better'
        ? 'Your pH is closer to neutral than this region.'
        : 'Your pH is further from neutral than this region.'
    }
    // temperature
    return v === 'better'
      ? 'Your temperature is closer to the ideal range than this region.'
      : 'Your temperature deviates more from the ideal range than this region.'
  }

  return { diffs, verdict, explanation }
}

