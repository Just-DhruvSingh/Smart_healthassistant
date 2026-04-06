import {
  createPatient,
  getAllPatients,
  getPatientById,
  getVisitCountByKey,
  syncAllPatients,
  syncPatientById,
  updatePatientById,
} from '../models/patientModel.js'
import {
  getEmergencyPatients,
  getGroupedPatients,
  getOutbreaks,
  getPatientStats,
  getVillageSummary,
} from '../utils/doctorAnalytics.js'
import { buildPrescription } from '../utils/prescriptionEngine.js'
import { analyzeTriage } from '../utils/triageEngine.js'

const sendSMSAlert = (patient) => {
  console.log('SMS sent to doctor for emergency patient')
  console.log(`Emergency patient: ${patient.name}`)
}

const enrichPatientInput = (body = {}) => {
  const cleanName = String(body.name || '').trim()
  const cleanSymptoms = String(body.symptoms || '').trim()
  const cleanVillage = String(body.village || 'Unknown Village').trim() || 'Unknown Village'
  const familyId = String(body.familyId || cleanName).trim() || cleanName
  const triage = analyzeTriage(cleanSymptoms)
  const emergency = triage.level === 'High'
  const prescription = buildPrescription(cleanSymptoms)
  const visitCount = getVisitCountByKey(familyId)

  return {
    cleanName,
    cleanSymptoms,
    cleanVillage,
    familyId,
    triage,
    emergency,
    prescription,
    visitCount,
  }
}

const getPatientsGrouped = (req, res, next) => {
  try {
    const patients = getAllPatients()
    const groupedPatients = getGroupedPatients(patients)

    console.log(`[GET] /patients -> grouped ${patients.length} patient(s)`)

    res.status(200).json({
      success: true,
      message: 'Patients grouped successfully.',
      data: groupedPatients,
    })
  } catch (error) {
    next(error)
  }
}

const getPatientsRaw = (req, res, next) => {
  try {
    const patients = getAllPatients()

    console.log(`[GET] /patients/raw -> returned ${patients.length} patient(s)`)

    res.status(200).json({
      success: true,
      message: 'Patients fetched successfully.',
      data: patients,
    })
  } catch (error) {
    next(error)
  }
}

const getPatientsEmergency = (req, res, next) => {
  try {
    const patients = getEmergencyPatients(getAllPatients())

    res.status(200).json({
      success: true,
      message: 'Emergency patients fetched successfully.',
      data: patients,
    })
  } catch (error) {
    next(error)
  }
}

const getPatientsVillageSummary = (req, res, next) => {
  try {
    const summary = getVillageSummary(getAllPatients())

    res.status(200).json({
      success: true,
      message: 'Village summary fetched successfully.',
      data: summary,
    })
  } catch (error) {
    next(error)
  }
}

const getPatientsOutbreaks = (req, res, next) => {
  try {
    const outbreaks = getOutbreaks(getAllPatients())

    res.status(200).json({
      success: true,
      message: 'Outbreaks fetched successfully.',
      data: outbreaks,
    })
  } catch (error) {
    next(error)
  }
}

const getPatientsStats = (req, res, next) => {
  try {
    const stats = getPatientStats(getAllPatients())

    res.status(200).json({
      success: true,
      message: 'Patient stats fetched successfully.',
      data: stats,
    })
  } catch (error) {
    next(error)
  }
}

const addPatient = (req, res, next) => {
  try {
    const { name, age, symptoms, offlineGuidance, village, familyId } = req.body

    if (!name || age === undefined || !symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, and symptoms are required.',
      })
    }

    const parsedAge = Number(age)

    if (Number.isNaN(parsedAge) || parsedAge < 0) {
      return res.status(400).json({
        success: false,
        message: 'Age must be a valid non-negative number.',
      })
    }

    const normalized = enrichPatientInput({ name, symptoms, village, familyId })
    const patient = createPatient({
      name: normalized.cleanName,
      age: parsedAge,
      symptoms: normalized.cleanSymptoms,
      village: normalized.cleanVillage,
      familyId: normalized.familyId,
      status: 'offline',
      triage: normalized.triage,
      emergency: normalized.emergency,
      prescription: normalized.prescription,
      visitCount: normalized.visitCount,
      offlineGuidance: offlineGuidance || null,
      reviewed: false,
    })

    console.log(
      `[POST] /patients -> created ${patient.name} (${patient.id}) | triage=${patient.triage.level} | visit=${patient.visitCount}`,
    )

    if (patient.emergency) {
      sendSMSAlert(patient)
    }

    res.status(201).json({
      success: true,
      message: 'Patient created.',
      data: patient,
    })
  } catch (error) {
    next(error)
  }
}

const syncPatients = (req, res, next) => {
  try {
    const syncedCount = syncAllPatients()
    const patients = getAllPatients()

    console.log(`[PUT] /patients/sync -> synced ${syncedCount} patient(s)`)

    res.status(200).json({
      success: true,
      message: 'Patients synced.',
      data: {
        syncedCount,
        patients,
      },
    })
  } catch (error) {
    next(error)
  }
}

const syncSinglePatient = (req, res, next) => {
  try {
    const { id } = req.params
    const patient = syncPatientById(id)

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      })
    }

    console.log(`[PUT] /patients/${id}/sync -> synced patient ${patient.name}`)

    res.status(200).json({
      success: true,
      message: 'Patient synced.',
      data: patient,
    })
  } catch (error) {
    next(error)
  }
}

const reviewPatient = (req, res, next) => {
  try {
    const { id } = req.params
    const patient = updatePatientById(id, {
      reviewed: true,
      reviewedAt: new Date().toISOString(),
    })

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Patient marked as reviewed.',
      data: patient,
    })
  } catch (error) {
    next(error)
  }
}

const addPrescription = (req, res, next) => {
  try {
    const { id } = req.params
    const { prescription } = req.body
    const patient = getPatientById(id)

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      })
    }

    const finalPrescription = prescription || buildPrescription(patient.symptoms)
    const updatedPatient = updatePatientById(id, {
      prescription: finalPrescription,
    })

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully.',
      data: updatedPatient,
    })
  } catch (error) {
    next(error)
  }
}

export {
  addPatient,
  addPrescription,
  getPatientsEmergency,
  getPatientsGrouped,
  getPatientsOutbreaks,
  getPatientsRaw,
  getPatientsStats,
  getPatientsVillageSummary,
  reviewPatient,
  syncPatients,
  syncSinglePatient,
}
