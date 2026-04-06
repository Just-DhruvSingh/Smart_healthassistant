import { RefreshCw, WifiOff } from 'lucide-react'
import PatientCard from '../components/PatientCard'

function SyncPage({
  patients,
  offlineCount,
  onSyncAll,
  onSyncPatient,
  isSyncing,
  feedbackMessage,
  isOnline,
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
              Sync Queue
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
              Review offline records before upload
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Patient records remain available locally and can be synced individually or all at
              once when a connection becomes available.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
              <WifiOff className="h-4 w-4" />
              {isOnline
                ? `${offlineCount} record${offlineCount === 1 ? '' : 's'} awaiting sync`
                : 'Offline mode: backend sync will resume when connection returns'}
            </div>
            <button
              type="button"
              onClick={onSyncAll}
              disabled={isSyncing || offlineCount === 0 || !isOnline}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-medical-primary px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>

      {feedbackMessage ? (
        <div className="rounded-3xl border border-teal-100 bg-teal-50 px-5 py-4 text-sm text-teal-700 shadow-card">
          {feedbackMessage}
        </div>
      ) : null}

      <div className="grid gap-4">
        {patients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            actionLabel={
              isOnline
                ? isSyncing
                  ? 'Syncing...'
                  : 'Sync Now'
                : 'Waiting for Connection'
            }
            onAction={isOnline && !isSyncing ? () => onSyncPatient(patient.id) : undefined}
          />
        ))}
      </div>
    </section>
  )
}

export default SyncPage
