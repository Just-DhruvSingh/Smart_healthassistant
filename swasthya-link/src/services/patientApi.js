const API_BASE_URL = 'http://localhost:5000'

const handleResponse = async (response) => {
  const payload = await response.json()

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed.')
  }

  return payload.data
}

const fetchPatients = async () => {
  const response = await fetch(`${API_BASE_URL}/patients`)
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

export { createPatient, fetchPatients, syncAllPatients, syncPatient }
