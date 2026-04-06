const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

const emergencyKeywords = [
  'chest pain',
  'breathing',
  'shortness of breath',
  'unconscious',
  'seizure',
  'bleeding',
  'pregnancy bleeding',
  'stroke',
  'heart attack',
]

const baseFallbackCarePlan = (symptoms = '') => {
  const normalizedSymptoms = String(symptoms || '').toLowerCase()
  const isEmergency = emergencyKeywords.some((keyword) => normalizedSymptoms.includes(keyword))

  return {
    mode: 'offline_generic',
    source: 'Local offline rules',
    language: 'hi-IN',
    illness: isEmergency ? 'आपात स्थिति' : 'सामान्य स्वास्थ्य परामर्श',
    riskLevel: isEmergency ? 'High' : 'Low',
    medications: isEmergency ? ['तुरंत डॉक्टर से संपर्क करें'] : ['Consult Doctor'],
    firstAid: isEmergency
      ? [
          'मरीज को शांत और स्थिर रखें।',
          'यदि सांस लेने में दिक्कत है तो तुरंत नजदीकी अस्पताल ले जाएं।',
          'बेहोशी, तेज दर्द, या ज्यादा खून बहने पर आपात मदद लें।',
        ]
      : [
          'आराम करें और पर्याप्त पानी पिएं।',
          'लक्षण बढ़ने पर डॉक्टर से सलाह लें।',
        ],
    advice: isEmergency
      ? 'यह आपात स्थिति हो सकती है। तुरंत चिकित्सकीय सहायता लें।'
      : 'लक्षणों पर नजर रखें और जरूरत पड़ने पर डॉक्टर से सलाह लें।',
    emergency: isEmergency,
    disclaimer: 'यह जानकारी सामान्य निर्णय-सहायता के लिए है, अंतिम इलाज के लिए डॉक्टर की सलाह जरूरी है।',
  }
}

const carePlanSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    illness: { type: 'string' },
    riskLevel: {
      type: 'string',
      enum: ['Low', 'Medium', 'High'],
    },
    medications: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    firstAid: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    advice: { type: 'string' },
    emergency: { type: 'boolean' },
    disclaimer: { type: 'string' },
  },
  required: ['illness', 'riskLevel', 'medications', 'firstAid', 'advice', 'emergency', 'disclaimer'],
}

const normalizeCarePlan = (input, fallback) => {
  if (!input || typeof input !== 'object') {
    return fallback
  }

  const medications = Array.isArray(input.medications)
    ? input.medications.map((item) => String(item).trim()).filter(Boolean)
    : []
  const firstAid = Array.isArray(input.firstAid)
    ? input.firstAid.map((item) => String(item).trim()).filter(Boolean)
    : []

  return {
    mode: 'online_ai',
    source: 'OpenAI',
    language: 'hi-IN',
    illness: String(input.illness || fallback.illness).trim(),
    riskLevel: ['Low', 'Medium', 'High'].includes(input.riskLevel)
      ? input.riskLevel
      : fallback.riskLevel,
    medications: medications.length ? medications : fallback.medications,
    firstAid: firstAid.length ? firstAid : fallback.firstAid,
    advice: String(input.advice || fallback.advice).trim(),
    emergency: Boolean(input.emergency ?? fallback.emergency),
    disclaimer: String(input.disclaimer || fallback.disclaimer).trim(),
  }
}

const buildPrompt = ({ name, age, village, symptoms }) => {
  const patientContext = {
    name: String(name || '').trim(),
    age: Number(age) || null,
    village: String(village || '').trim(),
    symptoms: String(symptoms || '').trim(),
  }

  return [
    {
      role: 'system',
      content:
        'You are SwasthyaLink, a rural healthcare decision-support assistant. Reply in simple Hindi. Provide safe first-aid steps and only general over-the-counter medication suggestions where appropriate. Do not diagnose with certainty, do not invent prescriptions, and escalate emergencies clearly when red-flag symptoms appear. Be concise, practical, and medically cautious.',
    },
    {
      role: 'user',
      content: JSON.stringify(patientContext),
    },
  ]
}

const generateOnlineCarePlan = async ({ name, age, village, symptoms }) => {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages: buildPrompt({ name, age, village, symptoms }),
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'swasthyalink_care_plan',
          strict: true,
          schema: carePlanSchema,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('OpenAI returned an empty care plan response.')
  }

  const parsedContent = typeof content === 'string' ? JSON.parse(content) : content
  const fallback = baseFallbackCarePlan(symptoms)

  return normalizeCarePlan(parsedContent, fallback)
}

const buildCarePlan = async (input = {}) => {
  const fallback = baseFallbackCarePlan(input.symptoms)

  try {
    const onlineCarePlan = await generateOnlineCarePlan(input)

    if (onlineCarePlan) {
      return onlineCarePlan
    }
  } catch (error) {
    console.error('Online care plan generation failed:', error)
  }

  return fallback
}

export { baseFallbackCarePlan, buildCarePlan }
