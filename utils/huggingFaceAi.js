import axios from 'axios'

const HF_API_KEY = process.env.HF_API_KEY || process.env.HUGGING_FACE_API_KEY
const HF_ASR_MODEL = process.env.HF_ASR_MODEL || 'openai/whisper-small'
const HF_CLASSIFIER_MODEL = process.env.HF_CLASSIFIER_MODEL || 'facebook/bart-large-mnli'

const buildAuthHeaders = (contentType) => {
  if (!HF_API_KEY) {
    throw new Error('HF_API_KEY is not configured.')
  }

  return {
    Authorization: `Bearer ${HF_API_KEY}`,
    'Content-Type': contentType,
  }
}

const transcribeAudio = async ({ buffer, mimetype }) => {
  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${HF_ASR_MODEL}`,
    buffer,
    {
      headers: buildAuthHeaders(mimetype || 'audio/wav'),
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: 'json',
      validateStatus: () => true,
    },
  )

  if (response.status >= 400) {
    const errorMessage =
      response.data?.error || response.data?.message || `Speech-to-text failed (${response.status}).`
    throw new Error(errorMessage)
  }

  const transcript = String(response.data?.text || '').trim()

  if (!transcript) {
    throw new Error('Hugging Face did not return any transcription text.')
  }

  return transcript
}

const classifySymptoms = async (text) => {
  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${HF_CLASSIFIER_MODEL}`,
    {
      inputs: text,
      parameters: {
        candidate_labels: ['emergency', 'moderate', 'normal'],
      },
    },
    {
      headers: buildAuthHeaders('application/json'),
      timeout: 120000,
      validateStatus: () => true,
    },
  )

  if (response.status >= 400) {
    const errorMessage =
      response.data?.error || response.data?.message || `Classification failed (${response.status}).`
    throw new Error(errorMessage)
  }

  const labels = response.data?.labels || []
  const scores = response.data?.scores || []
  const topLabel = labels[0] || 'normal'
  const topScore = scores[0] || 0

  return {
    label: topLabel,
    score: topScore,
    labels,
    scores,
  }
}

export { classifySymptoms, transcribeAudio }
