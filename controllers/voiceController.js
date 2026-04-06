import { classifySymptoms, transcribeAudio } from '../utils/huggingFaceAi.js'

const voiceToText = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required.',
      })
    }

    const text = await transcribeAudio({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
    })

    let classification = null

    try {
      classification = await classifySymptoms(text)
    } catch (classificationError) {
      console.error('Symptom classification failed:', classificationError)
    }

    console.log(`[POST] /api/voice-to-text -> "${text}"`)

    res.status(200).json({
      success: true,
      message: 'Voice processed successfully.',
      data: {
        text,
        classification,
      },
    })
  } catch (error) {
    next(error)
  }
}

export { voiceToText }
