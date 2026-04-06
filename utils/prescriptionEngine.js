const buildPrescription = (symptoms = '') => {
  const normalizedSymptoms = symptoms.toLowerCase()
  const suggestions = []

  if (normalizedSymptoms.includes('fever')) {
    suggestions.push('Paracetamol')
  }

  if (normalizedSymptoms.includes('vomiting')) {
    suggestions.push('ORS')
  }

  if (suggestions.length === 0) {
    return 'Consult Doctor'
  }

  return suggestions.join(', ')
}

export { buildPrescription }
