import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, LayoutDashboard, RefreshCw, UserPlus } from 'lucide-react'
import OfflineAlert from './components/OfflineAlert'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import PatientForm from './pages/PatientForm'
import SyncPage from './pages/SyncPage'
import {
  createPatient,
  fetchDoctorInsights,
  fetchPatients,
  markPatientReviewed,
  updatePatientPrescription,
  syncAllPatients,
  syncPatient,
} from './services/patientApi'
import {
  getCachedServerPatients,
  getPendingPatients,
  saveCachedServerPatients,
  savePendingPatients,
} from './utils/patientStorage'
import useOnlineStatus from './hooks/useOnlineStatus'

const normalizeServerPatient = (patient) => ({
  id: patient.id,
  name: patient.name,
  age: patient.age,
  symptoms: patient.symptoms,
  village: patient.village || 'Connected Clinic',
  lastUpdated: patient.syncedAt
    ? `Synced ${new Date(patient.syncedAt).toLocaleString()}`
    : `Saved ${new Date(patient.createdAt).toLocaleString()}`,
  status: patient.status || 'offline',
  triage: patient.triage || {
    score: 0,
    level: 'Pending',
    advice: 'Triage assessment will appear after sync.',
  },
  emergency: Boolean(patient.emergency),
  prescription: patient.prescription || 'Consult Doctor',
  visitCount: patient.visitCount || 1,
  offlineGuidance: patient.offlineGuidance || null,
  source: 'server',
})

const normalizePendingPatient = (patient) => ({
  id: patient.id,
  name: patient.name,
  age: patient.age,
  symptoms: patient.symptoms,
  village: patient.village || 'Saved On Device',
  lastUpdated: `Saved locally ${new Date(patient.createdAt).toLocaleString()}`,
  status: 'offline',
  triage: {
    score: 0,
    level: 'Pending Sync',
    advice: 'Clinical triage and decision support will be generated after backend sync.',
  },
  emergency: false,
  prescription: 'Pending Sync',
  visitCount: patient.visitCount || 1,
  offlineGuidance: patient.offlineGuidance || null,
  source: 'local',
})

const emptyDoctorInsights = {
  priorityGroups: { high: [], medium: [], low: [] },
  emergencyPatients: [],
  villageSummary: [],
  outbreaks: [],
  stats: {
    totalPatients: 0,
    highRiskCount: 0,
    mostCommonSymptoms: [],
  },
}

const navItems = [
  { key: 'registration', label: 'Registration', icon: UserPlus },
  { key: 'sync', label: 'Sync', icon: RefreshCw },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

function App() {
  const [activePage, setActivePage] = useState('registration')
  const [serverPatients, setServerPatients] = useState([])
  const [pendingPatients, setPendingPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [doctorInsights, setDoctorInsights] = useState(emptyDoctorInsights)
  const isOnline = useOnlineStatus()

  const patients = useMemo(
    () => [...pendingPatients.map(normalizePendingPatient), ...serverPatients.map(normalizeServerPatient)],
    [pendingPatients, serverPatients],
  )

  useEffect(() => {
    setPendingPatients(getPendingPatients())
    setServerPatients(getCachedServerPatients())
  }, [])

  const loadPatients = useCallback(async () => {
    if (!window.navigator.onLine) {
      setIsLoading(false)
      setInfoMessage('You are offline. Showing locally saved and cached records.')
      return
    }

    setIsLoading(true)

    try {
      const data = await fetchPatients()
      setServerPatients(data)
      saveCachedServerPatients(data)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to load patients:', error)
      setErrorMessage('Unable to connect to the backend. Please start the server and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadDoctorInsights = useCallback(async () => {
    if (!window.navigator.onLine) {
      return
    }

    try {
      const insights = await fetchDoctorInsights()
      setDoctorInsights(insights)
    } catch (error) {
      console.error('Failed to load doctor insights:', error)
      setDoctorInsights(emptyDoctorInsights)
    }
  }, [])

  const refreshAllData = useCallback(async () => {
    await Promise.all([loadPatients(), loadDoctorInsights()])
  }, [loadDoctorInsights, loadPatients])

  useEffect(() => {
    refreshAllData()
  }, [refreshAllData])

  useEffect(() => {
    savePendingPatients(pendingPatients)
  }, [pendingPatients])

  useEffect(() => {
    if (isOnline) {
      setInfoMessage('Connection restored. You can sync pending patient records now.')
      setErrorMessage('')
      refreshAllData()
    } else {
      setInfoMessage('You are offline. New records will stay on this device until connection returns.')
    }
  }, [isOnline, refreshAllData])

  const summary = useMemo(() => {
    const offlineCount = patients.filter((patient) => patient.status === 'offline').length
    const syncedCount = patients.length - offlineCount

    return {
      total: patients.length,
      offline: offlineCount,
      synced: syncedCount,
    }
  }, [patients])

  const handleSaveOffline = async (formValues) => {
    setIsSaving(true)

    try {
      const localPatient = {
        id: `local-${Date.now()}`,
        ...formValues,
        createdAt: new Date().toISOString(),
        status: 'offline',
      }

      setPendingPatients((currentPatients) => [localPatient, ...currentPatients])
      setInfoMessage(
        isOnline
          ? 'Patient saved on this device. Use Sync when you are ready to send it to the backend.'
          : 'Patient saved offline. It will stay queued until connection returns.',
      )
      setErrorMessage('')
      setActivePage('sync')
      await loadDoctorInsights()
    } catch (error) {
      console.error('Failed to save patient:', error)
      setErrorMessage(error.message || 'Failed to save patient record.')
      setInfoMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSyncPatient = async (id) => {
    if (!isOnline) {
      setErrorMessage('Backend sync is unavailable while offline. Please reconnect and try again.')
      return
    }

    setIsSyncing(true)

    try {
      const localPatient = pendingPatients.find((patient) => patient.id === id)

      if (localPatient) {
        const createdPatient = await createPatient({
          name: localPatient.name,
          age: localPatient.age,
          symptoms: localPatient.symptoms,
          village: localPatient.village,
          status: 'synced',
          offlineGuidance: localPatient.offlineGuidance,
        })

        setPendingPatients((currentPatients) =>
          currentPatients.filter((patient) => patient.id !== id),
        )
        setServerPatients((currentPatients) => {
          const nextPatients = [createdPatient, ...currentPatients]
          saveCachedServerPatients(nextPatients)
          return nextPatients
        })
      } else {
        const updatedPatient = await syncPatient(id)
        setServerPatients((currentPatients) => {
          const nextPatients = currentPatients.map((patient) =>
            patient.id === id ? updatedPatient : patient,
          )
          saveCachedServerPatients(nextPatients)
          return nextPatients
        })
      }

      setInfoMessage('Selected patient synced successfully after connection was available.')
      setErrorMessage('')
      await refreshAllData()
    } catch (error) {
      console.error('Failed to sync patient:', error)
      setErrorMessage(error.message || 'Failed to sync patient.')
      setInfoMessage('')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncAll = async () => {
    if (!isOnline) {
      setErrorMessage('Backend sync is unavailable while offline. Please reconnect and try again.')
      return
    }

    setIsSyncing(true)

    try {
      const pendingToSync = [...pendingPatients]

      for (const patient of pendingToSync) {
        await createPatient({
          name: patient.name,
          age: patient.age,
          symptoms: patient.symptoms,
          village: patient.village,
          status: 'synced',
          offlineGuidance: patient.offlineGuidance,
        })
      }

      const syncResult = await syncAllPatients()
      setPendingPatients([])
      setServerPatients(syncResult.patients)
      saveCachedServerPatients(syncResult.patients)
      setInfoMessage(
        `Sync completed. ${pendingToSync.length} local record(s) uploaded and ${syncResult.syncedCount} backend record(s) updated.`,
      )
      setErrorMessage('')
      await loadDoctorInsights()
    } catch (error) {
      console.error('Failed to sync all patients:', error)
      setErrorMessage(error.message || 'Failed to sync patient records.')
      setInfoMessage('')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleReviewPatient = async (id) => {
    if (!isOnline) {
      setErrorMessage('Doctor actions need a connection right now. Please reconnect and try again.')
      return
    }

    try {
      await markPatientReviewed(id)
      await refreshAllData()
      setInfoMessage('Patient marked as reviewed.')
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to mark reviewed:', error)
      setErrorMessage(error.message || 'Failed to mark patient as reviewed.')
    }
  }

  const handleGeneratePrescription = async (id) => {
    if (!isOnline) {
      setErrorMessage('Doctor actions need a connection right now. Please reconnect and try again.')
      return
    }

    try {
      await updatePatientPrescription(id)
      await refreshAllData()
      setInfoMessage('Prescription generated successfully.')
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to generate prescription:', error)
      setErrorMessage(error.message || 'Failed to generate prescription.')
    }
  }

  const renderPage = () => {
    switch (activePage) {
      case 'registration':
        return (
          <PatientForm
            onSaveOffline={handleSaveOffline}
            isSaving={isSaving}
            feedbackMessage={infoMessage}
            isOnline={isOnline}
          />
        )
      case 'sync':
        return (
          <SyncPage
            patients={patients}
            offlineCount={summary.offline}
            onSyncAll={handleSyncAll}
            onSyncPatient={handleSyncPatient}
            isSyncing={isSyncing}
            feedbackMessage={infoMessage}
            isOnline={isOnline}
          />
        )
      case 'dashboard':
        return (
          <Dashboard
            patients={patients}
            isLoading={isLoading}
            isOnline={isOnline}
            doctorInsights={doctorInsights}
            onReviewPatient={handleReviewPatient}
            onGeneratePrescription={handleGeneratePrescription}
          />
        )
      default:
        return (
          <PatientForm
            onSaveOffline={handleSaveOffline}
            isSaving={isSaving}
            feedbackMessage={infoMessage}
            isOnline={isOnline}
          />
        )
    }
  }

  return (
    <div className={`min-h-screen bg-medical-bg text-medical-text ${isOnline ? '' : 'pt-20'}`}>
      <OfflineAlert isOnline={isOnline} />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-teal-100 bg-white/95 px-6 py-6 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-medical-primary">
                <span className="rounded-full bg-medical-primary p-2 text-white">
                  <Activity className="h-4 w-4" />
                </span>
                SwasthyaLink Care Console
              </div>
              <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Offline-first patient care for rural outreach teams
                </h1>
                <p className="mt-2 max-w-2xl text-base text-slate-600 sm:text-lg">
                  Register patients in the field, queue records safely, and sync when the
                  connection returns.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-sm text-slate-500">Total Patients</p>
                <p className="mt-1 text-2xl font-semibold text-medical-text">{summary.total}</p>
              </div>
              <div className="rounded-3xl border border-orange-200 bg-orange-50 px-5 py-4">
                <p className="text-sm text-orange-700">Awaiting Sync</p>
                <p className="mt-1 text-2xl font-semibold text-orange-600">{summary.offline}</p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <p className="text-sm text-emerald-700">Synced Records</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">{summary.synced}</p>
              </div>
            </div>
          </div>
        </header>

        <Navbar items={navItems} activePage={activePage} onNavigate={setActivePage} />

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-card">
            {errorMessage}
          </div>
        ) : null}

        <main className="flex-1 py-6">{renderPage()}</main>
      </div>
    </div>
  )
}

export default App
