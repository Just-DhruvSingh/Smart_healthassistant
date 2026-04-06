import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, MicOff, Volume2, WandSparkles } from 'lucide-react'
import {
  buildOfflineCarePlan,
  extractAge,
  extractName,
  formatCarePlanSpeech,
} from '../utils/offlineCareAssistant'

const prompts = [
  {
    key: 'name',
    label: 'नाम',
    question: 'नमस्ते। कृपया अपना नाम बताइए।',
  },
  {
    key: 'age',
    label: 'उम्र',
    question: 'आपकी उम्र कितनी है?',
  },
  {
    key: 'symptoms',
    label: 'समस्या',
    question: 'आपको क्या परेशानी हो रही है? अपने लक्षण बताइए।',
  },
]

const isEmbeddedPreview = () => {
  try {
    return window.top !== window.self
  } catch {
    return true
  }
}

function VoiceAssistant({ onApplyDetails, isOnline }) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null
  const SpeechRecognitionPhrase = window.SpeechRecognitionPhrase || null
  const recognitionRef = useRef(null)
  const stepIndexRef = useRef(0)
  const [isListening, setIsListening] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [voiceSupported] = useState(SpeechRecognition !== null)
  const [micPermission, setMicPermission] = useState('prompt')
  const [recognitionMode, setRecognitionMode] = useState('standard')
  const [answers, setAnswers] = useState({
    name: '',
    age: '',
    symptoms: '',
  })
  const [transcriptPreview, setTranscriptPreview] = useState('')
  const [voiceStatus, setVoiceStatus] = useState(
    SpeechRecognition
      ? 'हिंदी वॉइस असिस्टेंट तैयार है। पहले माइक्रोफोन अनुमति दें, फिर मरीज बोल सकता है।'
      : 'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। Chrome या Edge में साइट खोलें।',
  )

  const currentPrompt = prompts[stepIndex]
  const carePlan = useMemo(() => buildOfflineCarePlan(answers.symptoms), [answers.symptoms])

  useEffect(() => {
    stepIndexRef.current = stepIndex
  }, [stepIndex])

  const speakPrompt = useCallback((text) => {
    if (!window.speechSynthesis || !text) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'hi-IN'
    window.speechSynthesis.speak(utterance)
  }, [])

  const handleFinalTranscript = useCallback(
    (key, transcript) => {
      if (!key || !transcript) {
        return
      }

      let nextValue = transcript

      if (key === 'name') {
        nextValue = extractName(transcript)
      }

      if (key === 'age') {
        nextValue = extractAge(transcript)
      }

      setAnswers((currentAnswers) => {
        const nextAnswers = {
          ...currentAnswers,
          [key]: nextValue,
        }

        if (key === 'symptoms') {
          onApplyDetails({
            ...nextAnswers,
            offlineGuidance: buildOfflineCarePlan(nextAnswers.symptoms),
          })
          setVoiceStatus('आवाज़ से विवरण भर दिया गया है। अब रिकॉर्ड सेव किया जा सकता है।')
        } else {
          const nextStep = stepIndexRef.current + 1
          setStepIndex(nextStep)
          setVoiceStatus(`"${transcript}" दर्ज हो गया। अब अगला सवाल पूछें।`)
        }

        return nextAnswers
      })
    },
    [onApplyDetails],
  )

  useEffect(() => {
    if (!SpeechRecognition) {
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    if (SpeechRecognitionPhrase) {
      recognition.phrases = [
        new SpeechRecognitionPhrase('बुखार', 6),
        new SpeechRecognitionPhrase('उल्टी', 6),
        new SpeechRecognitionPhrase('दस्त', 6),
        new SpeechRecognitionPhrase('कमजोरी', 5),
        new SpeechRecognitionPhrase('चोट', 5),
        new SpeechRecognitionPhrase('गर्भवती', 5),
        new SpeechRecognitionPhrase('सांस', 7),
      ]
    }

    recognition.onstart = () => {
      setIsListening(true)
      setTranscriptPreview('')
    }

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim()

      setTranscriptPreview(transcript)

      const latestResult = event.results[event.results.length - 1]

      if (latestResult?.isFinal) {
        handleFinalTranscript(currentPrompt?.key, transcript)
      }
    }

    recognition.onspeechend = () => {
      recognition.stop()
    }

    recognition.onnomatch = () => {
      setVoiceStatus('आवाज़ साफ़ समझ नहीं आई। कृपया फिर से धीरे और साफ़ बोलें।')
    }

    recognition.onerror = (event) => {
      setIsListening(false)

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicPermission('denied')
        setVoiceStatus(
          'माइक्रोफोन की अनुमति नहीं मिली। Address bar के पास mic/lock icon से इस साइट को Allow करें।',
        )
        return
      }

      if (event.error === 'no-speech') {
        setVoiceStatus('कोई आवाज़ नहीं मिली। माइक्रोफोन के पास बोलें और फिर से कोशिश करें।')
        return
      }

      if (event.error === 'audio-capture') {
        setVoiceStatus(
          'माइक्रोफोन से आवाज़ नहीं मिल रही। देखिए कि दूसरा app माइक्रोफोन तो use नहीं कर रहा।',
        )
        return
      }

      if (event.error === 'language-not-supported') {
        setVoiceStatus(
          'हिंदी speech pack उपलब्ध नहीं है। Chrome/Edge update करें या online mode में फिर कोशिश करें।',
        )
        return
      }

      if (event.error === 'network') {
        setVoiceStatus(
          'यह browser Hindi speech recognition के लिए network मांग रहा है। Online Chrome/Edge में खोलें या on-device speech support वाला browser use करें।',
        )
        return
      }

      setVoiceStatus(`वॉइस इनपुट में दिक्कत आई: ${event.error}.`)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [SpeechRecognition, SpeechRecognitionPhrase, currentPrompt?.key, handleFinalTranscript])

  const requestMicrophoneAccess = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceStatus(
        'इस ब्राउज़र में microphone API उपलब्ध नहीं है। Chrome या Edge में localhost URL खोलें।',
      )
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setMicPermission('granted')
      return true
    } catch (error) {
      console.error('Microphone permission failed:', error)
      setMicPermission('denied')
      setVoiceStatus(
        'माइक्रोफोन की अनुमति बंद है। Browser settings में जाकर Microphone = Allow करें और page reload करें।',
      )
      return false
    }
  }

  const prepareRecognitionMode = async () => {
    if (!SpeechRecognition) {
      return false
    }

    if (!('available' in SpeechRecognition) || !('install' in SpeechRecognition)) {
      setRecognitionMode('standard')
      return true
    }

    try {
      const availability = await SpeechRecognition.available({
        langs: ['hi-IN'],
        processLocally: true,
      })

      if (availability === 'available') {
        recognitionRef.current.processLocally = true
        setRecognitionMode('local')
        return true
      }

      if (availability === 'downloadable' || availability === 'downloading') {
        setVoiceStatus('हिंदी speech pack डाउनलोड हो रहा है। पूरा होने के बाद दोबारा mic शुरू करें।')
        const installResult = await SpeechRecognition.install({
          langs: ['hi-IN'],
          processLocally: true,
        })

        if (installResult) {
          recognitionRef.current.processLocally = true
          setRecognitionMode('local')
          setVoiceStatus('हिंदी speech pack install हो गया। अब फिर से mic शुरू करें।')
          return false
        }

        setVoiceStatus('हिंदी speech pack install नहीं हो पाया। फिलहाल normal voice mode try करें।')
        recognitionRef.current.processLocally = false
        setRecognitionMode('standard')
        return true
      }

      recognitionRef.current.processLocally = false
      setRecognitionMode('standard')

      if (!isOnline) {
        setVoiceStatus(
          'इस browser में Hindi on-device speech available नहीं है। Offline speech input अभी संभव नहीं है। कृपया symptoms टाइप करें।',
        )
        return false
      }

      return true
    } catch (error) {
      console.error('Speech availability check failed:', error)
      recognitionRef.current.processLocally = false
      setRecognitionMode('standard')
      return true
    }
  }

  const startListening = async () => {
    if (!recognitionRef.current || !currentPrompt) {
      return
    }

    if (!window.isSecureContext) {
      setVoiceStatus('Microphone access के लिए site को localhost या HTTPS पर खोलना जरूरी है।')
      return
    }

    if (isEmbeddedPreview()) {
      setVoiceStatus(
        'IDE preview में microphone अक्सर block होता है। App को Chrome/Edge के normal tab में localhost URL पर खोलें।',
      )
      return
    }

    const hasPermission =
      micPermission === 'granted' ? true : await requestMicrophoneAccess()

    if (!hasPermission) {
      return
    }

    const canStart = await prepareRecognitionMode()

    if (!canStart) {
      return
    }

    setVoiceStatus(
      `${currentPrompt.question} ${recognitionMode === 'local' ? 'On-device mode active.' : ''}`,
    )

    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Recognition start failed:', error)
      setVoiceStatus(
        'Voice recognition start नहीं हो पाया। Chrome/Edge का नया tab खोलकर फिर कोशिश करें।',
      )
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const restartAssistant = () => {
    setAnswers({
      name: '',
      age: '',
      symptoms: '',
    })
    setTranscriptPreview('')
    setStepIndex(0)
    setVoiceStatus('वॉइस असिस्टेंट रीसेट हो गया है। अब फिर से नाम से शुरू करें।')
  }

  const speakCarePlan = () => {
    speakPrompt(formatCarePlanSpeech(carePlan))
  }

  return (
    <aside className="rounded-3xl border border-teal-100 bg-teal-50 p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
            Hindi Voice Assist
          </p>
          <h3 className="mt-2 font-heading text-xl font-semibold">
            बोलिए, ऐप मरीज की जानकारी भर देगा
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
            Mic {micPermission}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{voiceStatus}</p>

      {micPermission === 'denied' ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          इस साइट को microphone access दें:
          {' '}
          address bar के पास lock/mic icon पर क्लिक करें →
          {' '}
          <span className="font-semibold">Microphone = Allow</span>
          {' '}
          →
          {' '}
          page reload करें।
        </div>
      ) : null}

      {!window.isSecureContext ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mic के लिए site को `http://localhost:5173` या किसी HTTPS URL पर खोलना जरूरी है।
        </div>
      ) : null}

      {isEmbeddedPreview() ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          IDE preview/webview में mic block हो सकता है. बेहतर नतीजे के लिए app को Chrome या Edge के
          normal tab में खोलें।
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={!voiceSupported}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-medical-primary px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? 'Listening...' : 'Hindi Voice Start'}
        </button>

        <button
          type="button"
          onClick={requestMicrophoneAccess}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-medical-primary"
        >
          <Mic className="h-4 w-4" />
          Enable Microphone
        </button>

        <button
          type="button"
          onClick={() => speakPrompt(currentPrompt?.question || prompts[0].question)}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-medical-primary"
        >
          <Volume2 className="h-4 w-4" />
          प्रश्न सुनें
        </button>

        <button
          type="button"
          onClick={speakCarePlan}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700"
        >
          <Volume2 className="h-4 w-4" />
          सलाह सुनें
        </button>

        <button
          type="button"
          onClick={restartAssistant}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
        >
          <WandSparkles className="h-4 w-4" />
          Reset
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 p-4">
        <p className="text-sm font-semibold text-medical-primary">
          Current Question: {currentPrompt?.label || 'पूरा हो गया'}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {transcriptPreview || 'मरीज की आवाज यहाँ दिखाई देगी।'}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">नाम</p>
          <p className="mt-2 text-sm font-medium text-medical-text">{answers.name || '-'}</p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">उम्र</p>
          <p className="mt-2 text-sm font-medium text-medical-text">{answers.age || '-'}</p>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            परेशानी
          </p>
          <p className="mt-2 text-sm font-medium text-medical-text">
            {answers.symptoms || '-'}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4">
        <p className="text-sm font-semibold text-medical-primary">Offline Care Guidance</p>
        <p className="mt-2 text-sm text-slate-700">
          संभावित समस्या: <span className="font-semibold">{carePlan.illness}</span>
        </p>
        <p className="mt-2 text-sm text-slate-700">
          जोखिम स्तर: <span className="font-semibold">{carePlan.riskLevel}</span>
        </p>
        <p className="mt-2 text-sm text-slate-700">
          दवा सुझाव: <span className="font-semibold">{carePlan.medications.join(', ')}</span>
        </p>
        <p className="mt-2 text-sm text-slate-700">First aid:</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {carePlan.firstAid.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-medium text-slate-700">{carePlan.advice}</p>
      </div>
    </aside>
  )
}

export default VoiceAssistant
