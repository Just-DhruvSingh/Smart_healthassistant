import { fetchCarePlan } from '../services/patientApi'
import { buildOfflineCarePlan } from './offlineCareAssistant'

const normalizeCarePlan = (carePlan, fallback) => {
  if (!carePlan || typeof carePlan !== 'object') {
    return fallback
  }

  const medications = Array.isArray(carePlan.medications)
    ? carePlan.medications.map((item) => String(item).trim()).filter(Boolean)
    : []
  const firstAid = Array.isArray(carePlan.firstAid)
    ? carePlan.firstAid.map((item) => String(item).trim()).filter(Boolean)
    : []

  return {
    mode: carePlan.mode || 'online_ai',
    source: carePlan.source || 'Online AI',
    language: carePlan.language || 'hi-IN',
    illness: String(carePlan.illness || fallback.illness).trim(),
    riskLevel: ['Low', 'Medium', 'High'].includes(carePlan.riskLevel)
      ? carePlan.riskLevel
      : fallback.riskLevel,
    medications: medications.length ? medications : fallback.medications,
    firstAid: firstAid.length ? firstAid : fallback.firstAid,
    advice: String(carePlan.advice || fallback.advice).trim(),
    emergency: Boolean(carePlan.emergency ?? fallback.emergency ?? false),
    disclaimer: String(carePlan.disclaimer || fallback.disclaimer || '').trim(),
  }
}

const resolveCarePlan = async ({ name, age, village, symptoms }, isOnline) => {
  const cleanSymptoms = String(symptoms || '').trim()
  const fallback = buildOfflineCarePlan(cleanSymptoms)

  if (!cleanSymptoms) {
    return {
      mode: 'idle',
      source: 'Awaiting symptoms',
      carePlan: fallback,
    }
  }

  if (!isOnline) {
    return {
      mode: 'offline_generic',
      source: 'Offline generic guidance',
      carePlan: fallback,
    }
  }

  try {
    const response = await fetchCarePlan({
      name,
      age,
      village,
      symptoms: cleanSymptoms,
      language: 'hi-IN',
    })

    return {
      mode: response?.mode || 'online_ai',
      source: response?.carePlan?.source || 'OpenAI',
      carePlan: normalizeCarePlan(response?.carePlan, fallback),
    }
  } catch (error) {
    console.error('Online care plan request failed, using offline fallback:', error)

    return {
      mode: 'offline_fallback',
      source: 'Offline fallback',
      carePlan: fallback,
    }
  }
}

export { normalizeCarePlan, resolveCarePlan }
