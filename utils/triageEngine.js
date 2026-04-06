const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword))

const analyzeTriage = (symptoms = '') => {
  const normalizedSymptoms = symptoms.toLowerCase()

  const highRiskKeywords = [
    'chest pain',
    'breathing',
    'shortness of breath',
    'severe bleeding',
    'unconscious',
    'stroke',
    'seizure',
  ]

  const mediumRiskKeywords = [
    'fever',
    'vomiting',
    'diarrhea',
    'dehydration',
    'cough',
    'infection',
    'fatigue',
  ]

  if (includesAny(normalizedSymptoms, highRiskKeywords)) {
    return {
      score: 85,
      level: 'High',
      advice: 'Seek immediate medical help and escalate the case urgently.',
    }
  }

  if (includesAny(normalizedSymptoms, mediumRiskKeywords)) {
    return {
      score: 55,
      level: 'Medium',
      advice: 'Monitor closely, provide supportive care, and consult a clinician soon.',
    }
  }

  return {
    score: 20,
    level: 'Low',
    advice: 'Provide routine observation and schedule a standard consultation.',
  }
}

export { analyzeTriage }
