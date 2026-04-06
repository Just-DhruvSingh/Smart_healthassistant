const guidanceRules = [
  {
    illness: 'सांस या सीने से जुड़ी आपात स्थिति',
    keywords: ['chest pain', 'breathing', 'shortness of breath', 'सीने में दर्द', 'सांस', 'साँस'],
    riskLevel: 'High',
    medications: ['एस्पिरिन केवल प्रशिक्षित सलाह पर', 'तुरंत डॉक्टर से संपर्क करें'],
    firstAid: [
      'मरीज को सीधा बैठाएं और तंग कपड़े ढीले करें।',
      'अगर सांस बहुत तेज चल रही है तो तुरंत नजदीकी अस्पताल ले जाएं।',
      'बेहोशी या बहुत दर्द होने पर इमरजेंसी सहायता बुलाएं।',
    ],
    advice: 'यह आपात स्थिति हो सकती है। तुरंत चिकित्सकीय सहायता लें।',
  },
  {
    illness: 'बुखार / वायरल संक्रमण',
    keywords: ['fever', 'bukhar', 'बुखार', 'temperature', 'ताप'],
    riskLevel: 'Medium',
    medications: ['Paracetamol', 'पानी और आराम'],
    firstAid: [
      'मरीज को आराम दें और हल्के कपड़े पहनाएं।',
      'पानी, ORS या नींबू पानी देते रहें।',
      'अगर बुखार 3 दिन से अधिक रहे तो डॉक्टर से सलाह लें।',
    ],
    advice: 'बुखार मध्यम जोखिम का हो सकता है। पानी और तापमान पर नज़र रखें।',
  },
  {
    illness: 'उल्टी / डिहाइड्रेशन',
    keywords: ['vomiting', 'उल्टी', 'ulti', 'nausea', 'मतली'],
    riskLevel: 'Medium',
    medications: ['ORS', 'हल्का भोजन'],
    firstAid: [
      'थोड़ा-थोड़ा ORS या पानी देते रहें।',
      'तेल-मसाले वाला खाना फिलहाल न दें।',
      'अगर उल्टी लगातार हो तो क्लिनिक ले जाएं।',
    ],
    advice: 'डिहाइड्रेशन का खतरा हो सकता है। ORS देना शुरू करें।',
  },
  {
    illness: 'खांसी / सांस संबंधी संक्रमण',
    keywords: ['cough', 'खांसी', 'khansi', 'cold', 'जुकाम'],
    riskLevel: 'Medium',
    medications: ['गरम पानी', 'Doctor consultation if persistent'],
    firstAid: [
      'गरम पानी दें और आराम कराएं।',
      'अगर सांस फूल रही है या खांसी लंबी चल रही है तो डॉक्टर दिखाएं।',
    ],
    advice: 'सांस की तकलीफ बढ़े तो तुरंत जांच कराएं।',
  },
  {
    illness: 'दस्त / डायरिया',
    keywords: ['diarrhea', 'diarrhoea', 'loose motion', 'दस्त', 'पतला मल', 'डायरिया'],
    riskLevel: 'Medium',
    medications: ['ORS', 'जिंक (स्वास्थ्यकर्मी की सलाह से)'],
    firstAid: [
      'हर दस्त के बाद ORS या साफ पानी देते रहें।',
      'मरीज को सूखा और साफ रखें।',
      'अगर बार-बार दस्त हो रहे हैं तो जल्दी जांच कराएं।',
    ],
    advice: 'डिहाइड्रेशन से बचाना सबसे जरूरी है। ORS तुरंत शुरू करें।',
  },
  {
    illness: 'कमजोरी / थकान',
    keywords: ['weakness', 'fatigue', 'कमजोरी', 'थकान', 'चक्कर'],
    riskLevel: 'Low',
    medications: ['पानी', 'हल्का पौष्टिक भोजन', 'Consult Doctor'],
    firstAid: [
      'मरीज को आराम दें और पानी पिलाएं।',
      'अगर कमजोरी लगातार रहे तो ब्लड प्रेशर और शुगर की जांच कराएं।',
    ],
    advice: 'कमजोरी लंबी चले तो चिकित्सकीय जांच जरूरी है।',
  },
  {
    illness: 'चोट / घाव',
    keywords: ['injury', 'wound', 'cut', 'चोट', 'घाव', 'कट', 'खून'],
    riskLevel: 'Medium',
    medications: ['एंटीसेप्टिक क्रीम', 'Consult Doctor if deep injury'],
    firstAid: [
      'घाव को साफ पानी से धोएं।',
      'साफ कपड़े या गॉज से दबाव देकर खून रोकें।',
      'गहरा घाव हो तो तुरंत अस्पताल ले जाएं।',
    ],
    advice: 'टिटनेस और संक्रमण का ध्यान रखें। जरूरत हो तो क्लिनिक जाएं।',
  },
  {
    illness: 'गर्भावस्था संबंधी देखभाल',
    keywords: ['pregnancy', 'pregnant', 'गर्भ', 'प्रेग्नेंसी', 'गर्भवती'],
    riskLevel: 'Medium',
    medications: ['आयरन-फोलिक एसिड (डॉक्टर सलाह से)', 'पोषण और आराम'],
    firstAid: [
      'आराम करें और पानी पर्याप्त पिएं।',
      'अगर पेट दर्द, bleeding, या सूजन हो तो तुरंत जांच कराएं।',
      'नियमित ANC विजिट कराना जरूरी है।',
    ],
    advice: 'गर्भावस्था में किसी भी गंभीर लक्षण पर तुरंत स्वास्थ्य केंद्र जाएं।',
  },
  {
    illness: 'डिहाइड्रेशन / पानी की कमी',
    keywords: ['dehydration', 'पानी की कमी', 'मुंह सूखना', 'चक्कर', 'कम पेशाब'],
    riskLevel: 'Medium',
    medications: ['ORS', 'साफ पानी', 'नारियल पानी यदि उपलब्ध हो'],
    firstAid: [
      'थोड़ा-थोड़ा करके ORS देते रहें।',
      'धूप या गर्मी से दूर रखें।',
      'बेहोशी या बहुत कमजोरी हो तो तुरंत अस्पताल ले जाएं।',
    ],
    advice: 'पानी की कमी गंभीर हो सकती है। ORS और निगरानी जरूरी है।',
  },
]

const extractAge = (input = '') => {
  const match = input.match(/\d+/)
  return match ? Number(match[0]) : ''
}

const extractName = (input = '') =>
  input
    .replace(/mera naam|mera name|my name is|नाम है/gi, '')
    .trim()

const buildOfflineCarePlan = (symptoms = '') => {
  const normalizedSymptoms = symptoms.toLowerCase()
  const matchedRule =
    guidanceRules.find((rule) =>
      rule.keywords.some((keyword) => normalizedSymptoms.includes(keyword.toLowerCase())),
    ) || null

  if (!matchedRule) {
    return {
      illness: 'सामान्य स्वास्थ्य परामर्श',
      riskLevel: 'Low',
      medications: ['Consult Doctor'],
      firstAid: [
        'आराम करें और पर्याप्त पानी पिएं।',
        'लक्षण बढ़ने पर स्वास्थ्य कार्यकर्ता या डॉक्टर से मिलें।',
      ],
      advice: 'लक्षणों पर नज़र रखें और जरूरत पड़ने पर डॉक्टर से सलाह लें।',
    }
  }

  return matchedRule
}

const formatCarePlanSpeech = (carePlan) =>
  `संभावित समस्या ${carePlan.illness}. जोखिम स्तर ${carePlan.riskLevel}. दवा सुझाव ${carePlan.medications.join(', ')}. प्राथमिक सहायता ${carePlan.firstAid.join(' ')}. सलाह ${carePlan.advice}`

export { buildOfflineCarePlan, extractAge, extractName, formatCarePlanSpeech }
