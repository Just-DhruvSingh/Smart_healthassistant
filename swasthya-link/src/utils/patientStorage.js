const PENDING_PATIENTS_KEY = 'swasthyalink-pending-patients'
const CACHED_SERVER_PATIENTS_KEY = 'swasthyalink-cached-server-patients'

const readStorage = (key) => {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : []
  } catch (error) {
    console.error(`Failed to read storage key: ${key}`, error)
    return []
  }
}

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to write storage key: ${key}`, error)
  }
}

const getPendingPatients = () => readStorage(PENDING_PATIENTS_KEY)

const savePendingPatients = (patients) => {
  writeStorage(PENDING_PATIENTS_KEY, patients)
}

const getCachedServerPatients = () => readStorage(CACHED_SERVER_PATIENTS_KEY)

const saveCachedServerPatients = (patients) => {
  writeStorage(CACHED_SERVER_PATIENTS_KEY, patients)
}

export {
  getCachedServerPatients,
  getPendingPatients,
  saveCachedServerPatients,
  savePendingPatients,
}
