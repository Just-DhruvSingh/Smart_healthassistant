import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import PatientCard from '../components/PatientCard'

function Dashboard({ patients, isLoading }) {
  const [query, setQuery] = useState('')

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return patients
    }

    return patients.filter((patient) =>
      [patient.name, patient.symptoms, patient.village, patient.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [patients, query])

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-primary">
              Dashboard
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
              Patient directory and care status overview
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Search across patient names, villages, symptoms, and sync status from one clean
              high-contrast workspace.
            </p>
          </div>

          <label className="relative block w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patient records"
              className="min-h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-base text-medical-text outline-none placeholder:text-slate-400 focus:border-medical-primary focus:bg-white"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-card">
            <p className="text-lg font-semibold text-medical-text">Loading patient records...</p>
          </div>
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => <PatientCard key={patient.id} patient={patient} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-card">
            <p className="text-lg font-semibold text-medical-text">No patient records found</p>
            <p className="mt-2 text-slate-500">
              Try a different search term to find matching records.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Dashboard
