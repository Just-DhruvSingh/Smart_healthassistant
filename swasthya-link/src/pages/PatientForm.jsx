import { useEffect, useRef, useState } from 'react'
import { CircleAlert, PhoneCall, Save } from 'lucide-react'
import VoiceAssistant from '../components/VoiceAssistant'
import { voiceToText } from '../services/patientApi'
import { resolveCarePlan } from '../utils/carePlanResolver'
import { buildOfflineCarePlan } from '../utils/offlineCareAssistant'

const initialFormState = {
  name: '',
  age: '',
  village: '',
  symptoms: '',
  offlineGuidance: null,
}

function PatientForm({ onSaveOffline, isSaving, feedbackMessage, isOnline }) {
  const [formValues, setFormValues] = useState(initialFormState)
  const [voiceStatus, setVoiceStatus] = useState({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    classification: null,
    error: '',
  })
  const [carePlanPreview, setCarePlanPreview] = useState({
    mode: 'idle',
    source: 'Awaiting symptoms',
    carePlan: buildOfflineCarePlan(''),
    loading: false,
  })
  const previewRequestRef = useRef(0)
  const mediaRecorderRef = useRef(null)
  const voiceChunksRef = useRef([])
  const voiceStopTimerRef = useRef(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  useEffect(() => {
    const symptoms = String(formValues.symptoms || '').trim()

    if (!symptoms) {
      const timer = window.setTimeout(() => {
        setCarePlanPreview({
          mode: 'idle',
          source: isOnline
            ? 'Type symptoms to get AI guidance'
            : 'Type symptoms to get offline guidance',
          carePlan: buildOfflineCarePlan(''),
          loading: false,
        })
      }, 0)

      return () => window.clearTimeout(timer)
    }

    const currentRequest = previewRequestRef.current + 1
    previewRequestRef.current = currentRequest
    const loadingTimer = window.setTimeout(() => {
      setCarePlanPreview((currentPreview) => ({
        ...currentPreview,
        loading: true,
        source: isOnline ? 'Analyzing with online AI...' : 'Preparing offline guidance...',
      }))
    }, 0)

    const timer = window.setTimeout(async () => {
      const result = await resolveCarePlan(formValues, isOnline)

      if (previewRequestRef.current === currentRequest) {
        setCarePlanPreview({
          ...result,
          loading: false,
        })
      }
    }, 700)

    return () => {
      window.clearTimeout(loadingTimer)
      window.clearTimeout(timer)
    }
  }, [formValues, isOnline])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const carePlanResult = await resolveCarePlan(formValues, isOnline)

    await onSaveOffline({
      name: formValues.name || 'Unnamed Patient',
      age: Number(formValues.age) || 0,
      village: formValues.village || 'Unknown Village',
      symptoms: formValues.symptoms || 'Symptoms not specified.',
      offlineGuidance: carePlanResult.carePlan,
      guidanceMode: carePlanResult.mode,
      guidanceSource: carePlanResult.source,
    })
    setFormValues(initialFormState)
  }

  const handleVoiceDetailsApply = (details) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      name: details.name || currentValues.name,
      age: details.age || currentValues.age,
      village: details.village || currentValues.village,
      symptoms: details.symptoms || currentValues.symptoms,
      offlineGuidance: details.offlineGuidance || currentValues.offlineGuidance,
    }))
  }

  const startVoiceCapture = async () => {
    if (!isOnline) {
      setVoiceStatus((currentState) => ({
        ...currentState,
        error: 'Online voice transcription is available only when the system is connected.',
      }))
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceStatus((currentState) => ({
        ...currentState,
        error: 'This browser does not support microphone recording.',
      }))
      return
    }

    try {
      setVoiceStatus({
        isRecording: true,
        isProcessing: false,
        transcript: '',
        classification: null,
        error: '',
      })

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      voiceChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          voiceChunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setVoiceStatus({
          isRecording: false,
          isProcessing: false,
          transcript: '',
          classification: null,
          error: 'Voice recording failed. Please try again.',
        })
      }

      recorder.onstop = async () => {
        if (voiceStopTimerRef.current) {
          window.clearTimeout(voiceStopTimerRef.current)
          voiceStopTimerRef.current = null
        }

        stream.getTracks().forEach((track) => track.stop())
        setVoiceStatus((currentState) => ({
          ...currentState,
          isRecording: false,
          isProcessing: true,
          error: '',
        }))

        try {
          const audioBlob = new Blob(voiceChunksRef.current, { type: mimeType })
          const result = await voiceToText(audioBlob)

          setVoiceStatus({
            isRecording: false,
            isProcessing: false,
            transcript: result.text,
            classification: result.classification,
            error: '',
          })

          setFormValues((currentValues) => ({
            ...currentValues,
            symptoms: result.text,
          }))
        } catch (error) {
          console.error('Voice transcription failed:', error)
          setVoiceStatus({
            isRecording: false,
            isProcessing: false,
            transcript: '',
            classification: null,
            error: error.message || 'Voice transcription failed.',
          })
        }
      }

      recorder.start()

      voiceStopTimerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
        }
      }, 5000)
    } catch (error) {
      console.error('Microphone access failed:', error)
      setVoiceStatus({
        isRecording: false,
        isProcessing: false,
        transcript: '',
        classification: null,
        error: 'Microphone access was denied or is unavailable.',
      })
    }
  }

  useEffect(
    () => () => {
      if (voiceStopTimerRef.current) {
        window.clearTimeout(voiceStopTimerRef.current)
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    },
    [],
  )

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-3xl border border-orange-200 bg-orange-50 px-5 py-4 text-orange-800 shadow-card">
        <div className="flex items-center gap-3 text-sm font-semibold sm:text-base">
          <CircleAlert className="h-5 w-5" />
          {isOnline
            ? 'Connected. New records will still be saved locally until you choose to sync.'
            : 'No Internet Connection. New records will be securely saved offline.'}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card lg:col-span-1 lg:row-span-2">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
            Registration
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
            Add a new patient record
          </h2>
          <p className="mt-2 text-slate-600">
            Capture essential details quickly so field teams can keep working even without
            connectivity.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Patient Name</span>
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-medical-text outline-none ring-0 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Age</span>
            <input
              type="number"
              name="age"
              value={formValues.age}
              onChange={handleChange}
              placeholder="Enter age"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-medical-text outline-none placeholder:text-slate-400 focus:border-medical-primary focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Village</span>
            <input
              type="text"
              name="village"
              value={formValues.village}
              onChange={handleChange}
              placeholder="Enter village name"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-medical-text outline-none placeholder:text-slate-400 focus:border-medical-primary focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Symptoms</span>
            <textarea
              name="symptoms"
              value={formValues.symptoms}
              onChange={handleChange}
              rows="5"
              placeholder="Describe symptoms and key observations"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-medical-text outline-none placeholder:text-slate-400 focus:border-medical-primary focus:bg-white"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startVoiceCapture}
              disabled={voiceStatus.isRecording || voiceStatus.isProcessing}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-medical-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {voiceStatus.isRecording || voiceStatus.isProcessing ? 'Processing voice...' : '🎤 Speak Symptoms'}
            </button>
            <p className="text-sm text-slate-500">
              Records a short clip, transcribes it with Hugging Face, and fills the symptoms field.
            </p>
          </div>

          {voiceStatus.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {voiceStatus.error}
            </div>
          ) : null}

          {voiceStatus.transcript ? (
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              <p className="font-semibold">Voice transcript</p>
              <p className="mt-1">{voiceStatus.transcript}</p>
              {voiceStatus.classification ? (
                <p className="mt-2">
                  Classification:{' '}
                  <span className="font-semibold">
                    {voiceStatus.classification.label} ({Math.round(voiceStatus.classification.score * 100)}%)
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-medical-primary px-5 py-3 text-base font-semibold text-white"
          >
            <Save className="h-5 w-5" />
            {isSaving ? 'Saving...' : 'Save Offline'}
          </button>

        {feedbackMessage ? (
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-700">
            {feedbackMessage}
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-teal-100 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
                Care Guidance Preview
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {carePlanPreview.loading
                  ? 'Fetching the latest guidance...'
                  : carePlanPreview.source}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {carePlanPreview.mode === 'online_ai'
                ? 'Online AI'
                : carePlanPreview.mode === 'offline_generic'
                  ? 'Offline Generic'
                  : 'Ready'}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-medical-text">
              {carePlanPreview.carePlan.illness}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Risk: <span className="font-semibold">{carePlanPreview.carePlan.riskLevel}</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Medication: <span className="font-semibold">{carePlanPreview.carePlan.medications.join(', ')}</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Advice: <span className="font-semibold">{carePlanPreview.carePlan.advice}</span>
            </p>
          </div>
        </div>
      </form>

        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">
                Emergency Call
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                Offline Voice Support
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                When data is unavailable, the AI assistant can route triage by voice so field
                workers still have a fallback.
              </p>
            </div>

            <div className="group relative w-full sm:w-auto">
              <a
                href="tel:+1XXXXXXXXXX"
                onClick={() => {
                  console.log('Offline Triage Mode Activated: Routing via Vapi GSM.')
                }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-medical-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-teal-700 sm:w-auto"
              >
                <PhoneCall className="h-4 w-4" />
                Call AI Assistant
              </a>
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 opacity-0 shadow-lg transition group-hover:opacity-100">
                Our AI assistant handles triage via voice when data is unavailable.
              </span>
            </div>
          </div>
        </div>
      </div>

      <aside className="rounded-3xl border border-teal-100 bg-teal-50 p-6 shadow-card">
        <h3 className="font-heading text-xl font-semibold">Field workflow</h3>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-medical-primary">1. Speak in Hindi</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              मरीज नाम, उम्र और परेशानी बोल सकता है। ऐप फॉर्म भरने में मदद करेगा।
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-medical-primary">2. Get offline guidance</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              इंटरनेट के बिना भी दवा सुझाव और first aid guidance तुरंत दिखेगी।
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-medical-primary">3. Save and sync later</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              रिकॉर्ड डिवाइस पर सेव रहेगा और कनेक्शन आने पर backend में sync होगा।
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-2">
        <VoiceAssistant onApplyDetails={handleVoiceDetailsApply} isOnline={isOnline} />
      </div>
    </section>
  )
}

export default PatientForm
