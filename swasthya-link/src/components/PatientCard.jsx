import {
  AlertTriangle,
  CheckCheck,
  ClipboardPlus,
  Clock3,
  HeartPulse,
  MapPin,
  UserRound,
} from 'lucide-react'
import StatusBadge from './StatusBadge'

function PatientCard({
  patient,
  actionLabel,
  onAction,
  showDoctorActions = false,
  onReview,
  onGeneratePrescription,
}) {
  const isSynced = patient.status?.toLowerCase() === 'synced'
  const isActionDisabled = isSynced || !onAction
  const triageLevel = patient.triage?.level || 'Pending'
  const triageStyles =
    triageLevel === 'High'
      ? 'border-red-200 bg-red-50 text-red-700'
      : triageLevel === 'Medium'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : triageLevel === 'Low'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-100 text-slate-600'

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-teal-50 p-3 text-medical-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-semibold">{patient.name}</h3>
              <p className="text-sm text-slate-500">
                Age {patient.age} • Visit {patient.visitCount}
              </p>
            </div>
            <StatusBadge status={patient.status} />
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${triageStyles}`}
            >
              Triage {triageLevel}
            </span>
            {patient.reviewed ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                <CheckCheck className="h-4 w-4" />
                Reviewed
              </span>
            ) : null}
            {patient.emergency ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Emergency
              </span>
            ) : null}
          </div>

          <p className="max-w-2xl text-base leading-7 text-slate-700">{patient.symptoms}</p>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <HeartPulse className="h-4 w-4 text-medical-primary" />
                Risk Score
              </div>
              <p className="mt-2 text-2xl font-semibold text-medical-text">
                {patient.triage?.score ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ClipboardPlus className="h-4 w-4 text-medical-primary" />
                Prescription Support
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{patient.prescription}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
            <p className="text-sm font-semibold text-medical-primary">Clinical Advice</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{patient.triage?.advice}</p>
          </div>

          {patient.offlineGuidance ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-700">Offline First Aid</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {patient.offlineGuidance.illness} • {patient.offlineGuidance.riskLevel}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                दवा: {patient.offlineGuidance.medications.join(', ')}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                प्राथमिक सहायता: {patient.offlineGuidance.firstAid.join(' ')}
              </p>
            </div>
          ) : null}

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

        {showDoctorActions ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onReview}
              disabled={patient.reviewed}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <CheckCheck className="h-4 w-4" />
              {patient.reviewed ? 'Reviewed' : 'Mark Reviewed'}
            </button>
            <button
              type="button"
              onClick={onGeneratePrescription}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-medical-primary px-4 py-3 text-sm font-semibold text-white"
            >
              <ClipboardPlus className="h-4 w-4" />
              Generate Prescription
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default PatientCard
