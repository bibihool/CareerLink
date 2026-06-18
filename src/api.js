export const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || 'http://localhost:5000'
export const API_BASE = `${SERVER_BASE}/api`
export const FILE_BASE = `${SERVER_BASE}/uploads`

const SESSION_KEY = 'careerlink_session'

export function getStoredSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function storeSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
  window.localStorage.removeItem('careerlink_user')
}

export async function apiRequest(path, options = {}) {
  const session = getStoredSession()
  const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...options.headers } })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      clearSession()
      window.dispatchEvent(new Event('careerlink:unauthorized'))
    }
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export async function openProtectedFile(path) {
  const session = getStoredSession()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${session?.token || ''}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Unable to open file')
  }

  const url = window.URL.createObjectURL(await response.blob())
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60000)
}
