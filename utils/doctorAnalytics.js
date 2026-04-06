const normalizeText = (value = '') => value.toString().trim().toLowerCase()

const getPriorityLevel = (patient) => {
  if (patient.emergency || patient.triage?.level === 'High') {
    return 'high'
  }

  if (patient.triage?.level === 'Medium') {
    return 'medium'
  }

  return 'low'
}

const getGroupedPatients = (patients = []) =>
  patients.reduce(
    (accumulator, patient) => {
      const level = getPriorityLevel(patient)
      accumulator[level].push(patient)
      return accumulator
    },
    { high: [], medium: [], low: [] },
  )

const getEmergencyPatients = (patients = []) =>
  patients.filter((patient) => patient.emergency || patient.triage?.level === 'High')

const getVillageSummary = (patients = []) => {
  const villageMap = new Map()

  patients.forEach((patient) => {
    const village = patient.village || 'Unknown Village'
    const summary = villageMap.get(village) || {
      village,
      totalPatients: 0,
      highRisk: 0,
    }

    summary.totalPatients += 1
    if (patient.emergency || patient.triage?.level === 'High') {
      summary.highRisk += 1
    }

    villageMap.set(village, summary)
  })

  return Array.from(villageMap.values()).sort((left, right) => right.totalPatients - left.totalPatients)
}

const getOutbreaks = (patients = []) => {
  const outbreakMap = new Map()

  patients.forEach((patient) => {
    const village = patient.village || 'Unknown Village'
    const symptom = normalizeText(patient.symptoms).split(/[,.]/)[0].trim() || 'unknown symptom'
    const key = `${village}::${symptom}`

    const outbreak = outbreakMap.get(key) || {
      village,
      symptom,
      count: 0,
    }

    outbreak.count += 1
    outbreakMap.set(key, outbreak)
  })

  return Array.from(outbreakMap.values())
    .filter((outbreak) => outbreak.count > 3)
    .map((outbreak) => ({
      ...outbreak,
      alert: 'Possible outbreak',
    }))
}

const getPatientStats = (patients = []) => {
  const totalPatients = patients.length
  const highRiskCount = patients.filter((patient) => patient.emergency || patient.triage?.level === 'High').length

  const symptomCounts = new Map()
  patients.forEach((patient) => {
    const symptom = normalizeText(patient.symptoms).split(/[,.]/)[0].trim()
    if (!symptom) {
      return
    }

    symptomCounts.set(symptom, (symptomCounts.get(symptom) || 0) + 1)
  })

  const mostCommonSymptoms = Array.from(symptomCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([symptom, count]) => ({ symptom, count }))

  return {
    totalPatients,
    highRiskCount,
    mostCommonSymptoms,
  }
}

export {
  getEmergencyPatients,
  getGroupedPatients,
  getOutbreaks,
  getPatientStats,
  getPriorityLevel,
  getVillageSummary,
}
