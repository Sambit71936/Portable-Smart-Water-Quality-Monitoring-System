import { waterQualityDataset } from '../data/waterQualityDataset';

/**
 * Calculate Haversine distance between two coordinates in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Find the nearest location in dataset to given coordinates
 */
export const getNearestLocation = (lat, lng, dataset = waterQualityDataset) => {
  if (!dataset || dataset.length === 0) return null;

  let minDist = Infinity;
  let nearest = null;

  dataset.forEach((point) => {
    const dist = calculateDistance(lat, lng, point.lat, point.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = { ...point, distance: parseFloat(dist.toFixed(2)) };
    }
  });

  return nearest;
};

/**
 * Find nearby locations within a radius (in km)
 */
export const getNearbyLocations = (lat, lng, radiusKm = 50, dataset = waterQualityDataset) => {
  return dataset
    .map((point) => ({
      ...point,
      distance: calculateDistance(lat, lng, point.lat, point.lng),
    }))
    .filter((point) => point.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * WHO Standards for drinking water
 */
const WHO_STANDARDS = {
  ph: { min: 6.5, max: 8.5, optimal: 7.0 },
  tds: { max: 500, optimal: 150 }, // ppm
  temperature: { min: 5, max: 30, optimal: 20 }, // °C
  ec: { max: 1000, optimal: 500 }, // µS/cm
};

/**
 * Calculate risk level based on WHO standards
 * Returns: { level: 'SAFE' | 'MODERATE' | 'UNSAFE', score: 0-100, details: {} }
 */
export const calculateWhoRiskLevel = (metrics) => {
  const { ph, tds, temperature, ec } = metrics;

  let riskScore = 0;
  const details = {};

  // pH assessment (optimal: 7.0, range: 6.5-8.5)
  details.ph = { value: ph, status: 'SAFE' };
  if (ph < WHO_STANDARDS.ph.min || ph > WHO_STANDARDS.ph.max) {
    riskScore += 40;
    details.ph.status = 'UNSAFE';
  } else if (Math.abs(ph - WHO_STANDARDS.ph.optimal) > 0.5) {
    riskScore += 10;
    details.ph.status = 'MODERATE';
  }

  // TDS assessment (max: 500 ppm)
  details.tds = { value: tds, status: 'SAFE' };
  if (tds > WHO_STANDARDS.tds.max) {
    riskScore += 30;
    details.tds.status = 'UNSAFE';
  } else if (tds > WHO_STANDARDS.tds.max * 0.8) {
    riskScore += 15;
    details.tds.status = 'MODERATE';
  }

  // Temperature assessment (range: 5-30°C, optimal: 20°C)
  details.temperature = { value: temperature, status: 'SAFE' };
  if (temperature < WHO_STANDARDS.temperature.min || temperature > WHO_STANDARDS.temperature.max) {
    riskScore += 20;
    details.temperature.status = 'UNSAFE';
  } else if (Math.abs(temperature - WHO_STANDARDS.temperature.optimal) > 5) {
    riskScore += 5;
    details.temperature.status = 'MODERATE';
  }

  // EC assessment (max: 1000 µS/cm)
  details.ec = { value: ec, status: 'SAFE' };
  if (ec > WHO_STANDARDS.ec.max) {
    riskScore += 10;
    details.ec.status = 'UNSAFE';
  } else if (ec > WHO_STANDARDS.ec.max * 0.8) {
    riskScore += 5;
    details.ec.status = 'MODERATE';
  }

  // Determine overall risk level
  let riskLevel = 'SAFE';
  if (riskScore >= 50) {
    riskLevel = 'UNSAFE';
  } else if (riskScore >= 20) {
    riskLevel = 'MODERATE';
  }

  return {
    level: riskLevel,
    score: riskScore,
    details,
    recommendations: getWhoRecommendations(riskLevel, details),
  };
};

/**
 * Get recommendations based on risk level and parameter details
 */
export const getWhoRecommendations = (riskLevel, details) => {
  const recommendations = [];

  if (details.ph?.status === 'UNSAFE') {
    recommendations.push(
      'pH is outside WHO range (6.5-8.5). Water may be too acidic or alkaline.'
    );
  }

  if (details.tds?.status === 'UNSAFE') {
    recommendations.push(
      'TDS exceeds 500 ppm. Consider additional filtration or alternative water source.'
    );
  }

  if (details.temperature?.status === 'UNSAFE') {
    recommendations.push(
      'Temperature is outside safe range. Water may be too hot or too cold.'
    );
  }

  if (details.ec?.status === 'UNSAFE') {
    recommendations.push(
      'Electrical conductivity indicates high mineral concentration. Boiling or filtration recommended.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Water quality meets WHO standards. Safe for consumption.');
  }

  return recommendations;
};

/**
 * Compare sensor data with dataset location data
 */
export const compareWithDataset = (sensorMetrics, locationData) => {
  if (!locationData) {
    return {
      error: 'No location data available',
      comparison: null,
    };
  }

  const comparison = {
    parameters: [
      {
        name: 'pH',
        sensor: sensorMetrics.ph,
        dataset: locationData.ph,
        difference: parseFloat((sensorMetrics.ph - locationData.ph).toFixed(2)),
        unit: '',
        status: getComparisonStatus(sensorMetrics.ph, locationData.ph, 0.5),
      },
      {
        name: 'TDS',
        sensor: sensorMetrics.tds,
        dataset: locationData.tds,
        difference: Math.round(sensorMetrics.tds - locationData.tds),
        unit: 'ppm',
        status: getComparisonStatus(sensorMetrics.tds, locationData.tds, 50),
      },
      {
        name: 'Temperature',
        sensor: sensorMetrics.temp,
        dataset: locationData.temperature,
        difference: parseFloat((sensorMetrics.temp - locationData.temperature).toFixed(1)),
        unit: '°C',
        status: getComparisonStatus(sensorMetrics.temp, locationData.temperature, 2),
      },
      {
        name: 'EC',
        sensor: sensorMetrics.ec,
        dataset: locationData.ec,
        difference: Math.round(sensorMetrics.ec - locationData.ec),
        unit: 'µS/cm',
        status: getComparisonStatus(sensorMetrics.ec, locationData.ec, 50),
      },
    ],
    summary: generateComparisonSummary(sensorMetrics, locationData),
  };

  return comparison;
};

/**
 * Determine comparison status: similar, better, worse
 */
const getComparisonStatus = (sensorValue, datasetValue, threshold) => {
  const diff = Math.abs(sensorValue - datasetValue);
  if (diff <= threshold) return 'SIMILAR';
  return sensorValue < datasetValue ? 'BETTER' : 'WORSE';
};

/**
 * Generate a human-readable comparison summary
 */
const generateComparisonSummary = (sensor, dataset) => {
  const sensorRisk = calculateWhoRiskLevel(sensor);
  const datasetRisk = calculateWhoRiskLevel({
    ph: dataset.ph,
    tds: dataset.tds,
    temperature: dataset.temperature,
    ec: dataset.ec,
  });

  let summary = '';
  if (sensorRisk.level === datasetRisk.level) {
    summary = `Your water and the regional dataset show similar risk levels (${sensorRisk.level}).`;
  } else if (sensorRisk.score < datasetRisk.score) {
    summary = `Your water is cleaner than the regional average (${sensorRisk.level} vs ${datasetRisk.level}).`;
  } else {
    summary = `Your water shows higher contamination than the regional average (${sensorRisk.level} vs ${datasetRisk.level}).`;
  }

  return summary;
};

/**
 * Get all monitoring stations
 */
export const getAllStations = () => {
  return waterQualityDataset;
};

/**
 * Export data for a location
 */
export const exportLocationData = (location, format = 'json') => {
  const riskAssessment = calculateWhoRiskLevel({
    ph: location.ph,
    tds: location.tds,
    temperature: location.temperature,
    ec: location.ec,
  });

  const data = {
    ...location,
    riskAssessment,
    timestamp: new Date().toISOString(),
  };

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'csv') {
    return Object.entries(data)
      .map(([key, value]) => `${key},${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join('\n');
  }

  return data;
};
