const patients = []

const getAllPatients = () => patients

const getVisitCountByKey = (key) =>
  patients.filter(
    (patient) => (patient.familyId || patient.name).toLowerCase() === key.toLowerCase(),
  ).length + 1

const getVisitCountByName = (name) => getVisitCountByKey(name)

const createPatient = (patientData) => {
  const familyId = patientData.familyId || patientData.name
  const newPatient = {
    id: Date.now().toString(),
    name: patientData.name,
    age: patientData.age,
    symptoms: patientData.symptoms,
    village: patientData.village || 'Unknown Village',
    familyId,
    status: patientData.status || 'offline',
    triage: patientData.triage,
    emergency: patientData.emergency || false,
    prescription: patientData.prescription,
    visitCount: patientData.visitCount,
    offlineGuidance: patientData.offlineGuidance || null,
    reviewed: Boolean(patientData.reviewed),
    reviewedAt: patientData.reviewedAt || null,
    createdAt: new Date().toISOString(),
  }

  patients.push(newPatient)
  return newPatient
}

const getPatientById = (patientId) =>
  patients.find((currentPatient) => currentPatient.id === patientId) || null

const updatePatientById = (patientId, updates = {}) => {
  const patient = getPatientById(patientId)

  if (!patient) {
    return null
  }

  Object.assign(patient, updates)
  return patient
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

export {
  createPatient,
  getAllPatients,
  getPatientById,
  getVisitCountByName,
  getVisitCountByKey,
  updatePatientById,
  syncAllPatients,
  syncPatientById,
}
