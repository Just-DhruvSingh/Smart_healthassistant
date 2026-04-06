import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, MapPin, Search, Volume2 } from 'lucide-react'
import PatientCard from '../components/PatientCard'

const groupPatientsByPriority = (patients = []) =>
  patients.reduce(
    (accumulator, patient) => {
      const level =
        patient.emergency || patient.triage?.level === 'High'
          ? 'high'
          : patient.triage?.level === 'Medium'
            ? 'medium'
            : 'low'

      accumulator[level].push(patient)
      return accumulator
    },
    { high: [], medium: [], low: [] },
  )

const mostCommonSymptomLabel = (stats = {}) => {
  const topSymptom = stats.mostCommonSymptoms?.[0]

  if (!topSymptom) {
    return 'Not enough data yet'
  }

  return `${topSymptom.symptom} (${topSymptom.count})`
}

function Dashboard({
  patients,
  isLoading,
  isOnline,
  doctorInsights,
  onReviewPatient,
  onGeneratePrescription,
}) {
  const [query, setQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [selectedVillage, setSelectedVillage] = useState('all')

  const villages = useMemo(
    () =>
      Array.from(new Set(patients.map((patient) => patient.village).filter(Boolean))).sort(),
    [patients],
  )

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return patients.filter((patient) => {
      const matchesQuery =
        !normalizedQuery ||
        [patient.name, patient.symptoms, patient.village, patient.status, patient.prescription]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      const matchesVillage = selectedVillage === 'all' || patient.village === selectedVillage

      const matchesMode =
        filterMode === 'all' ||
        (filterMode === 'emergency' && (patient.emergency || patient.triage?.level === 'High')) ||
        (filterMode === 'synced' && patient.status?.toLowerCase() === 'synced')

      return matchesQuery && matchesVillage && matchesMode
    })
  }, [filterMode, patients, query, selectedVillage])

  const patientGroups = useMemo(
    () => groupPatientsByPriority(filteredPatients),
    [filteredPatients],
  )

  const fallbackStats = useMemo(
    () => ({
      totalPatients: patients.length,
      highRiskCount: patients.filter((patient) => patient.emergency || patient.triage?.level === 'High').length,
      mostCommonSymptoms: [],
    }),
    [patients],
  )

  const stats = doctorInsights?.stats || fallbackStats
  const emergencyPatients = doctorInsights?.emergencyPatients || []
  const villageSummary = doctorInsights?.villageSummary || []
  const outbreaks = doctorInsights?.outbreaks || []

  const topOutbreak = outbreaks[0]

  const handleVoiceSummary = () => {
    if (!window.speechSynthesis) {
      return
    }

    const summaryText = [
      `Total patients ${stats.totalPatients}.`,
      `High risk patients ${stats.highRiskCount}.`,
      `Most common symptom ${mostCommonSymptomLabel(stats)}.`,
      topOutbreak
        ? `Possible outbreak in ${topOutbreak.village} for ${topOutbreak.symptom}.`
        : 'No outbreak alert currently detected.',
    ].join(' ')

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(summaryText)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
              Doctor Dashboard
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
              Rural healthcare decision support
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Prioritize emergencies, watch village-level trends, and act quickly on the most
              urgent cases.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleVoiceSummary}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-medical-primary"
            >
              <Volume2 className="h-4 w-4" />
              Play summary
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('emergency')}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              View Emergencies
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-red-100 p-3 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Emergency Panel
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {stats.highRiskCount} critical patient{stats.highRiskCount === 1 ? '' : 's'} need
                review
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                High-priority cases are flagged automatically using triage and emergency detection.
              </p>
              <p className="mt-2 text-sm font-semibold text-red-700">
                Emergency queue: {emergencyPatients.length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700">
            {isOnline ? 'Live monitoring active' : 'Offline - showing cached insights'}
          </div>
        </div>
      </div>

      {topOutbreak ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Outbreak Alert
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Possible {topOutbreak.symptom} outbreak in {topOutbreak.village}
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            {topOutbreak.count} similar cases detected. {topOutbreak.alert}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Total patients</p>
          <p className="mt-2 text-3xl font-semibold text-medical-text">{stats.totalPatients}</p>
        </div>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-card">
          <p className="text-sm text-red-700">High-risk</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">{stats.highRiskCount}</p>
        </div>
        <div className="rounded-3xl border border-teal-200 bg-teal-50 p-5 shadow-card">
          <p className="text-sm text-teal-700">Most common symptom</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {mostCommonSymptomLabel(stats)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Synced records</p>
          <p className="mt-2 text-3xl font-semibold text-medical-text">
            {patients.filter((patient) => patient.status?.toLowerCase() === 'synced').length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
              Filters
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Narrow by emergency, sync state, or village
            </h3>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                filterMode === 'all'
                  ? 'bg-medical-primary text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('emergency')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                filterMode === 'emergency'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Emergency
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('synced')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                filterMode === 'synced'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Synced
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient name, symptoms, village..."
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-base text-medical-text outline-none placeholder:text-slate-400 focus:border-medical-primary focus:bg-white"
            />
          </label>

          <select
            value={selectedVillage}
            onChange={(event) => setSelectedVillage(event.target.value)}
            className="min-h-12 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-base text-medical-text outline-none focus:border-medical-primary focus:bg-white"
          >
            <option value="all">All villages</option>
            {villages.map((village) => (
              <option key={village} value={village}>
                {village}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
          <Activity className="h-4 w-4" />
          Village View
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {villageSummary.length > 0 ? (
            villageSummary.map((item) => (
              <div key={item.village} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Village</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">{item.village}</h4>
                  </div>
                  <MapPin className="h-5 w-5 text-medical-primary" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <p className="text-slate-500">Total</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{item.totalPatients}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3">
                    <p className="text-slate-500">High risk</p>
                    <p className="mt-1 text-xl font-semibold text-red-700">{item.highRisk}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Village summaries will appear once records are available.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <SectionBlock
          title="High Risk"
          tone="red"
          patients={patientGroups.high}
          emptyMessage="No high-risk patients in the current filter."
          onReviewPatient={onReviewPatient}
          onGeneratePrescription={onGeneratePrescription}
        />
        <SectionBlock
          title="Medium"
          tone="amber"
          patients={patientGroups.medium}
          emptyMessage="No medium-priority patients in the current filter."
          onReviewPatient={onReviewPatient}
          onGeneratePrescription={onGeneratePrescription}
        />
        <SectionBlock
          title="Low"
          tone="emerald"
          patients={patientGroups.low}
          emptyMessage="No low-priority patients in the current filter."
          onReviewPatient={onReviewPatient}
          onGeneratePrescription={onGeneratePrescription}
        />
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
          <p className="text-lg font-semibold text-medical-text">Loading patient records...</p>
        </div>
      ) : null}
    </section>
  )
}

function SectionBlock({
  title,
  tone,
  patients,
  emptyMessage,
  onReviewPatient,
  onGeneratePrescription,
}) {
  const toneClasses = {
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${toneClasses[tone]}`}>
          {title}
        </h3>
        <p className="text-sm text-slate-500">{patients.length} patients</p>
      </div>

      <div className="mt-4 grid gap-4">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              showDoctorActions
              onReview={() => onReviewPatient(patient.id)}
              onGeneratePrescription={() => onGeneratePrescription(patient.id)}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Dashboard
