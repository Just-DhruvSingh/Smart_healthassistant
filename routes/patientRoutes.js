import express from 'express'
import {
  addPatient,
  getPatients,
  syncPatients,
  syncSinglePatient,
} from '../controllers/patientController.js'

const router = express.Router()

router.get('/patients', getPatients)
router.post('/patients', addPatient)
router.put('/patients/:id/sync', syncSinglePatient)
router.put('/patients/sync', syncPatients)

export default router
