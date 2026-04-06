import express from 'express'
import multer from 'multer'
import { voiceToText } from '../controllers/voiceController.js'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
})

router.post('/voice-to-text', upload.single('audio'), voiceToText)

export default router
