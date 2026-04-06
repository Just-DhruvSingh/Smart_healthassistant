function Navbar({ items, activePage, onNavigate }) {
  return (
    <nav className="rounded-3xl border border-slate-200 bg-white px-3 py-3 shadow-card">
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const isActive = activePage === item.key
          const Icon = item.icon

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`flex min-h-14 items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-base font-semibold transition-colors ${
                isActive
                  ? 'border-medical-primary bg-medical-primary text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-medical-primary'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default Navbar
