const API_BASE_URL = 'http://localhost:5000'

const handleResponse = async (response) => {
  const payload = await response.json()

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed.')
  }

  return payload.data
}

const fetchPatients = async () => {
  const response = await fetch(`${API_BASE_URL}/patients/raw`)
  return handleResponse(response)
}

const fetchPriorityGroups = async () => {
  const response = await fetch(`${API_BASE_URL}/patients`)
  return handleResponse(response)
}

const fetchEmergencyPatients = async () => {
  const response = await fetch(`${API_BASE_URL}/patients/emergency`)
  return handleResponse(response)
}

const fetchVillageSummary = async () => {
  const response = await fetch(`${API_BASE_URL}/patients/village-summary`)
  return handleResponse(response)
}

const fetchOutbreaks = async () => {
  const response = await fetch(`${API_BASE_URL}/patients/outbreaks`)
  return handleResponse(response)
}

const fetchPatientStats = async () => {
  const response = await fetch(`${API_BASE_URL}/patients/stats`)
  return handleResponse(response)
}

const createPatient = async (patientData) => {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData),
  })

  return handleResponse(response)
}

const voiceToText = async (audioBlob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'voice.webm')

  const response = await fetch(`${API_BASE_URL}/api/voice-to-text`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse(response)
}

const fetchCarePlan = async (patientData) => {
  const response = await fetch(`${API_BASE_URL}/patients/care-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData),
  })

  return handleResponse(response)
}

const syncAllPatients = async () => {
  const response = await fetch(`${API_BASE_URL}/patients/sync`, {
    method: 'PUT',
  })

  return handleResponse(response)
}

const syncPatient = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}/sync`, {
    method: 'PUT',
  })

  return handleResponse(response)
}

const markPatientReviewed = async (patientId) => {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}/review`, {
    method: 'POST',
  })

  return handleResponse(response)
}

const updatePatientPrescription = async (patientId, prescription) => {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}/prescription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prescription }),
  })

  return handleResponse(response)
}

const fetchDoctorInsights = async () => {
  const [priorityGroups, emergencyPatients, villageSummary, outbreaks, stats] = await Promise.all([
    fetchPriorityGroups(),
    fetchEmergencyPatients(),
    fetchVillageSummary(),
    fetchOutbreaks(),
    fetchPatientStats(),
  ])

  return {
    priorityGroups,
    emergencyPatients,
    villageSummary,
    outbreaks,
    stats,
  }
}

export {
  createPatient,
  fetchDoctorInsights,
  fetchEmergencyPatients,
  fetchOutbreaks,
  fetchPatients,
  fetchPatientStats,
  fetchPriorityGroups,
  fetchVillageSummary,
  fetchCarePlan,
  markPatientReviewed,
  voiceToText,
  syncAllPatients,
  syncPatient,
  updatePatientPrescription,
}
