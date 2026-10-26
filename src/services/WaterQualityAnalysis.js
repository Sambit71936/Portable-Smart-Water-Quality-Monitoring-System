/**
 * Water Quality Analysis Service
 * Analyzes water parameters against standards for different uses
 */

export class WaterQualityAnalysis {
  /**
   * Standards for different water uses (WHO, EPA, and regional standards)
   */
  static STANDARDS = {
    drinkingWater: {
      name: 'Drinking Water (WHO/EPA)',
      temperature: { min: 0, max: 25, optimal: '15-20' },
      ph: { min: 6.5, max: 8.5, optimal: '7.0-7.5' },
      tds: { min: 0, max: 500, optimal: '50-150' },
      ec: { min: 0, max: 1000, optimal: '100-500' }
    },
    
    irrigation: {
      name: 'Agriculture/Irrigation',
      temperature: { min: 15, max: 35, optimal: '20-30' },
      ph: { min: 5.5, max: 8.5, optimal: '6.5-7.5' },
      tds: { min: 0, max: 2000, optimal: '500-1500' },
      ec: { min: 0, max: 3000, optimal: '500-2000' }
    },
    
    aquaculture: {
      name: 'Aquaculture/Fish Farming',
      temperature: { min: 20, max: 32, optimal: '24-28' },
      ph: { min: 6.5, max: 8.0, optimal: '7.0-7.5' },
      tds: { min: 100, max: 1000, optimal: '300-700' },
      ec: { min: 200, max: 2000, optimal: '500-1200' }
    },
    
    swimming: {
      name: 'Swimming Pool Water',
      temperature: { min: 24, max: 30, optimal: '26-28' },
      ph: { min: 7.2, max: 7.8, optimal: '7.4-7.6' },
      tds: { min: 0, max: 2500, optimal: '1000-1500' },
      ec: { min: 0, max: 5000, optimal: '2000-3000' }
    },
    
    industrial: {
      name: 'Industrial Use',
      temperature: { min: 10, max: 40, optimal: '20-30' },
      ph: { min: 5.0, max: 9.0, optimal: '6.5-7.5' },
      tds: { min: 0, max: 5000, optimal: '500-3000' },
      ec: { min: 0, max: 10000, optimal: '1000-5000' }
    },
    
    wastewater: {
      name: 'Wastewater/Reclamation',
      temperature: { min: 5, max: 45, optimal: '20-30' },
      ph: { min: 4.0, max: 10.0, optimal: '6.0-8.0' },
      tds: { min: 0, max: 10000, optimal: '1000-5000' },
      ec: { min: 0, max: 15000, optimal: '2000-8000' }
    }
  }

  /**
   * Analyze water quality for all use cases
   * @param {object} metrics - {temp, ph, tds, ec}
   * @returns {object} Detailed analysis for all uses
   */
  static analyzeWaterQuality(metrics) {
    const { temp, ph, tds, ec } = metrics

    const analysis = {
      timestamp: new Date().toISOString(),
      parameters: { temp, ph, tds, ec },
      suitability: {},
      overallRating: '',
      topRecommendations: [],
      warnings: []
    }

    // Analyze for each use case
    Object.entries(this.STANDARDS).forEach(([key, standard]) => {
      analysis.suitability[key] = this.assessUseSuitability(
        key,
        standard,
        metrics
      )
    })

    // Determine overall rating
    analysis.overallRating = this.getOverallRating(analysis.suitability)

    // Get top recommendations
    analysis.topRecommendations = this.getRecommendations(analysis.suitability)

    // Add warnings for critical parameters
    analysis.warnings = this.getWarnings(metrics)

    return analysis
  }

  /**
   * Assess suitability for a specific water use
   */
  static assessUseSuitability(useKey, standard, metrics) {
    const { temp, ph, tds, ec } = metrics
    const assessment = {
      use: standard.name,
      suitability: 'SUITABLE', // SUITABLE, MARGINAL, UNSUITABLE
      score: 100,
      parameters: {},
      issues: [],
      recommendations: []
    }

    // Check each parameter
    const paramChecks = [
      { name: 'Temperature', param: temp, standard: standard.temperature, key: 'temp' },
      { name: 'pH', param: ph, standard: standard.ph, key: 'ph' },
      { name: 'TDS', param: tds, standard: standard.tds, key: 'tds' },
      { name: 'EC', param: ec, standard: standard.ec, key: 'ec' }
    ]

    let totalScore = 0
    let paramCount = 0

    paramChecks.forEach((check) => {
      const paramAssessment = this.assessParameter(
        check.name,
        check.param,
        check.standard,
        useKey
      )

      assessment.parameters[check.key] = paramAssessment

      // Accumulate issues
      if (paramAssessment.status === 'OUT_OF_RANGE') {
        assessment.suitability = 'UNSUITABLE'
        assessment.issues.push(
          `${check.name}: ${paramAssessment.message}`
        )
      } else if (paramAssessment.status === 'WARNING') {
        if (assessment.suitability !== 'UNSUITABLE') {
          assessment.suitability = 'MARGINAL'
        }
        assessment.issues.push(
          `${check.name}: ${paramAssessment.message}`
        )
      }

      // Calculate parameter score
      totalScore += paramAssessment.score
      paramCount++
    })

    // Overall score (0-100)
    assessment.score = Math.round(totalScore / paramCount)

    // Add recommendations based on issues
    if (assessment.issues.length > 0) {
      assessment.recommendations = this.generateRecommendations(
        assessment.issues,
        metrics,
        useKey
      )
    }

    return assessment
  }

  /**
   * Assess a single parameter against standards
   */
  static assessParameter(name, value, standard, useKey) {
    const { min, max, optimal } = standard
    const assessment = {
      value: value,
      status: 'OPTIMAL',
      message: `${name} is optimal`,
      score: 100
    }

    // Check if within acceptable range
    if (value < min) {
      assessment.status = 'OUT_OF_RANGE'
      assessment.message = `${name} too low: ${value} (min: ${min})`
      assessment.score = 20
    } else if (value > max) {
      assessment.status = 'OUT_OF_RANGE'
      assessment.message = `${name} too high: ${value} (max: ${max})`
      assessment.score = 20
    } else if (value < min + (max - min) * 0.15 || value > max - (max - min) * 0.15) {
      // Outside optimal range but within acceptable
      assessment.status = 'WARNING'
      assessment.message = `${name} acceptable but not optimal: ${value} (optimal: ${optimal})`
      assessment.score = 70
    } else {
      // Within optimal range
      assessment.status = 'OPTIMAL'
      assessment.message = `${name} excellent: ${value}`
      assessment.score = 100
    }

    return assessment
  }

  /**
   * Get overall rating across all uses
   */
  static getOverallRating(suitability) {
    const ratings = Object.values(suitability)
    
    // Count by suitability level
    const suitable = ratings.filter(r => r.suitability === 'SUITABLE').length
    const marginal = ratings.filter(r => r.suitability === 'MARGINAL').length
    
    if (suitable >= 4) return 'EXCELLENT'
    if (suitable >= 3) return 'GOOD'
    if (suitable >= 2) return 'FAIR'
    if (marginal > 0) return 'POOR'
    return 'UNSUITABLE'
  }

  /**
   * Get recommended uses
   */
  static getRecommendations(suitability) {
    const suitable = Object.entries(suitability)
      .filter(([_, assessment]) => assessment.suitability === 'SUITABLE')
      .map(([_, assessment]) => ({ use: assessment.use, score: assessment.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return suitable.length > 0
      ? suitable
      : [{ use: 'Limited suitable uses', score: 0 }]
  }

  /**
   * Generate specific recommendations
   */
  static generateRecommendations(issues, metrics, useKey) {
    const recommendations = []

    issues.forEach((issue) => {
      if (issue.includes('Temperature')) {
        if (metrics.temp > 30) {
          recommendations.push('Cool water by circulating or adding shade')
        } else if (metrics.temp < 15) {
          recommendations.push('Warm water through solar heating or heat exchangers')
        }
      }

      if (issue.includes('pH')) {
        if (metrics.ph > 8.5) {
          recommendations.push('Lower pH using CO₂ injection or acids (citric/acetic)')
        } else if (metrics.ph < 6.5) {
          recommendations.push('Raise pH using lime (CaCO₃) or soda ash (Na₂CO₃)')
        }
      }

      if (issue.includes('TDS')) {
        if (metrics.tds > 2000) {
          recommendations.push('Reduce TDS through reverse osmosis or distillation')
        } else if (metrics.tds < 100) {
          recommendations.push('Add minerals if needed for aquaculture (potassium, magnesium)')
        }
      }

      if (issue.includes('EC')) {
        if (metrics.ec > 5000) {
          recommendations.push('High salinity detected - requires desalination treatment')
        } else if (metrics.ec < 200) {
          recommendations.push('Low conductivity - consider adding mineral content')
        }
      }
    })

    return [
      ...new Set(recommendations) // Remove duplicates
    ]
  }

  /**
   * Get warnings for critical issues
   */
  static getWarnings(metrics) {
    const warnings = []
    const { temp, ph, tds, ec } = metrics

    // Temperature warnings
    if (temp > 35) {
      warnings.push({
        severity: 'CRITICAL',
        message: 'Temperature critically high - immediate cooling required'
      })
    } else if (temp > 30) {
      warnings.push({
        severity: 'WARNING',
        message: 'Temperature elevated - suitable for limited uses only'
      })
    }

    // pH warnings
    if (ph < 5 || ph > 9) {
      warnings.push({
        severity: 'CRITICAL',
        message: 'pH extremely out of range - requires immediate treatment'
      })
    } else if (ph < 6.5 || ph > 8.5) {
      warnings.push({
        severity: 'WARNING',
        message: 'pH outside optimal range - may affect suitability'
      })
    }

    // TDS warnings
    if (tds > 5000) {
      warnings.push({
        severity: 'CRITICAL',
        message: 'Extremely high dissolved solids - unsuitable for most uses'
      })
    } else if (tds > 3000) {
      warnings.push({
        severity: 'WARNING',
        message: 'High TDS levels limit suitable water uses'
      })
    }

    // EC warnings
    if (ec > 10000) {
      warnings.push({
        severity: 'CRITICAL',
        message: 'Extremely high conductivity - indicates high salinity'
      })
    }

    return warnings
  }

  /**
   * Get detailed summary for a specific use
   */
  static getSummaryForUse(useKey, analysis) {
    const suitability = analysis.suitability[useKey]
    if (!suitability) return null

    const summary = {
      use: suitability.use,
      suitable: suitability.suitability === 'SUITABLE',
      suitabilityLevel: suitability.suitability,
      score: suitability.score,
      parameters: suitability.parameters,
      issues: suitability.issues,
      recommendations: suitability.recommendations,
      nextSteps: this.getNextSteps(suitability)
    }

    return summary
  }

  /**
   * Get action steps based on assessment
   */
  static getNextSteps(assessment) {
    const steps = []

    if (assessment.suitability === 'SUITABLE') {
      steps.push('Water meets all standards for this use')
      steps.push('Continue regular monitoring')
    } else if (assessment.suitability === 'MARGINAL') {
      steps.push('Water may be used with caution')
      steps.push('Implement monitoring recommendations')
      steps.push('Treat parameters outside optimal range')
    } else {
      steps.push('Water requires treatment before use')
      steps.push('Address critical parameter issues')
      steps.push('Test after treatment before use')
    }

    return steps
  }
}
