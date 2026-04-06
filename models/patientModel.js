const patients = []

const getAllPatients = () => patients

const createPatient = (patientData) => {
  const newPatient = {
    id: Date.now().toString(),
    name: patientData.name,
    age: patientData.age,
    symptoms: patientData.symptoms,
    status: patientData.status || 'offline',
    createdAt: new Date().toISOString(),
  }

  patients.push(newPatient)
  return newPatient
}

const syncAllPatients = () => {
  let syncedCount = 0

  patients.forEach((patient) => {
    if (patient.status !== 'synced') {
      patient.status = 'synced'
      patient.syncedAt = new Date().toISOString()
      syncedCount += 1
    }
  })

  return syncedCount
}

const syncPatientById = (patientId) => {
  const patient = patients.find((currentPatient) => currentPatient.id === patientId)

  if (!patient) {
    return null
  }

  patient.status = 'synced'
  patient.syncedAt = new Date().toISOString()

  return patient
}

export { createPatient, getAllPatients, syncAllPatients, syncPatientById }
