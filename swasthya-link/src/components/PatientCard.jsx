import { Clock3, MapPin, UserRound } from 'lucide-react'
import StatusBadge from './StatusBadge'

function PatientCard({ patient, actionLabel, onAction }) {
  const isSynced = patient.status?.toLowerCase() === 'synced'
  const isActionDisabled = isSynced || !onAction

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-teal-50 p-3 text-medical-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold">{patient.name}</h3>
              <p className="text-sm text-slate-500">Age {patient.age}</p>
            </div>
            <StatusBadge status={patient.status} />
          </div>

          <p className="max-w-2xl text-base leading-7 text-slate-700">{patient.symptoms}</p>

          <div className="flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <MapPin className="h-4 w-4" />
              {patient.village}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <Clock3 className="h-4 w-4" />
              {patient.lastUpdated}
            </span>
          </div>
        </div>

        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            disabled={isActionDisabled}
            className="min-h-12 rounded-2xl border border-medical-primary bg-medical-primary px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:border-emerald-200 disabled:bg-emerald-100 disabled:text-emerald-700"
          >
            {isSynced ? 'Already Synced' : actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default PatientCard
