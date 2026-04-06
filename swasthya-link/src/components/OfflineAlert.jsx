import { PhoneCall, WifiOff } from 'lucide-react'

function OfflineAlert({ isOnline }) {
  const handleOfflineCall = () => {
    console.log('Offline Triage Mode Activated: Routing via Vapi GSM.')
  }

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-orange-200 bg-teal-50/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-orange-100 p-2 text-orange-700">
            <WifiOff className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">You are currently offline.</p>
            <p className="text-sm text-slate-600">
              Sync is paused. Emergency voice support is available for triage.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="group relative">
            <a
              href="tel:+1XXXXXXXXXX"
              onClick={handleOfflineCall}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-medical-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-teal-700"
            >
              <PhoneCall className="h-4 w-4" />
              Call AI Assistant
            </a>
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 opacity-0 shadow-lg transition group-hover:opacity-100">
              Our AI assistant handles triage via voice when data is unavailable.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflineAlert
