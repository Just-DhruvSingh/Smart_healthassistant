import { useState } from 'react'
import { CircleAlert, Save } from 'lucide-react'

const initialFormState = {
  name: '',
  age: '',
  symptoms: '',
}

function PatientForm({ onSaveOffline, isSaving, feedbackMessage, isOnline }) {
  const [formValues, setFormValues] = useState(initialFormState)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSaveOffline({
      name: formValues.name || 'Unnamed Patient',
      age: Number(formValues.age) || 0,
      symptoms: formValues.symptoms || 'Symptoms not specified.',
    })
    setFormValues(initialFormState)
  }

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
        </form>
      </div>

      <aside className="rounded-3xl border border-teal-100 bg-teal-50 p-6 shadow-card">
        <h3 className="font-heading text-xl font-semibold">Field workflow</h3>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-medical-primary">1. Register patient</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Record basic demographics and symptoms in a tap-friendly form.
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-medical-primary">2. Queue locally</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Each submission is preserved offline until connectivity returns.
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-medical-primary">3. Sync later</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Review records on the sync screen and push them when the network is available.
            </p>
          </div>
        </div>
      </aside>
    </section>
  )
}

export default PatientForm
