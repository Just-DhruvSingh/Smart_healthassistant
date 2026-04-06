import {
  createPatient,
  getAllPatients,
  syncAllPatients,
  syncPatientById,
} from '../models/patientModel.js'

const getPatients = (req, res, next) => {
  try {
    const patients = getAllPatients()

    console.log(`[GET] /patients -> returned ${patients.length} patient(s)`)

    res.status(200).json({
      success: true,
      message: 'Patients fetched successfully.',
      data: patients,
    })
  } catch (error) {
    next(error)
  }
}

const addPatient = (req, res, next) => {
  try {
    const { name, age, symptoms, status } = req.body

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
        message: 'Age must be a valid positive number.',
      })
    }

    const patient = createPatient({
      name: String(name).trim(),
      age: parsedAge,
      symptoms: String(symptoms).trim(),
      status: status || 'offline',
    })

    console.log(`[POST] /patients -> added patient ${patient.name} (${patient.id})`)

    res.status(201).json({
      success: true,
      message: 'Patient added successfully.',
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
      message: 'Patients synced successfully.',
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
      message: 'Patient synced successfully.',
      data: patient,
    })
  } catch (error) {
    next(error)
  }
}

export { addPatient, getPatients, syncPatients, syncSinglePatient }
