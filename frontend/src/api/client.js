let csrfToken

async function getCsrfToken() {
  if (!csrfToken) {
    const response = await fetch('/api/auth/csrf', { credentials: 'include' })
    if (!response.ok) throw new Error('No fue posible iniciar una sesión segura.')
    csrfToken = (await response.json()).token
  }
  return csrfToken
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method))
    headers.set('X-XSRF-TOKEN', await getCsrfToken())
  const response = await fetch(`/api${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 403) csrfToken = undefined
    if (response.status === 413)
      throw new Error('La solicitud es demasiado grande. Elige una foto de perfil de máximo 2 MB.')
    throw new Error(payload.detail || payload.message || 'No fue posible completar la solicitud.')
  }
  return payload
}
