function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase() ?? 'offline'
  const badgeStyles =
    normalizedStatus === 'synced'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-orange-200 bg-orange-50 text-orange-700'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${badgeStyles}`}
    >
      {normalizedStatus === 'synced' ? 'Synced' : 'Offline'}
    </span>
  )
}

export default StatusBadge
