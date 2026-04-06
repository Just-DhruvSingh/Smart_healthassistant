import express from 'express'
import {
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
} from '../controllers/patientController.js'

const router = express.Router()

router.get('/patients', getPatientsGrouped)
router.get('/patients/raw', getPatientsRaw)
router.get('/patients/emergency', getPatientsEmergency)
router.get('/patients/village-summary', getPatientsVillageSummary)
router.get('/patients/outbreaks', getPatientsOutbreaks)
router.get('/patients/stats', getPatientsStats)
router.post('/patients', addPatient)
router.post('/patients/:id/review', reviewPatient)
router.post('/patients/:id/prescription', addPrescription)
router.put('/patients/:id/sync', syncSinglePatient)
router.put('/patients/sync', syncPatients)

export default router
