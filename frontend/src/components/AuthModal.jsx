import { useState } from 'react'
import { api } from '../api/client.js'
import Modal from './Modal.jsx'

export default function AuthModal({ close, onAuthenticated, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const fields = new FormData(event.currentTarget)
    const payload = Object.fromEntries(fields.entries())
    try {
      const user = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      onAuthenticated(user)
      close()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={mode === 'login' ? 'Qué bueno verte' : 'Crear una cuenta'}
      subtitle="Tu cuenta permite consultar reportes y coordinar orientación de forma privada."
      close={close}
    >
      <form className="form-grid auth-form" onSubmit={submit}>
        {mode === 'register' && (
          <label className="full-field">
            Nombre
            <input name="name" maxLength="120" autoComplete="name" required />
          </label>
        )}
        <label className="full-field">
          Correo electrónico
          <input name="email" type="email" maxLength="180" autoComplete="email" required />
        </label>
        <label className="full-field">
          Contraseña
          <input
            name="password"
            type="password"
            minLength={mode === 'register' ? 12 : 1}
            maxLength="72"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
          {mode === 'register' && <small className="field-hint">Usa al menos 12 caracteres.</small>}
        </label>
        {error && (
          <div className="form-error full-field" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions full-field">
          <button
            type="button"
            className="btn-quiet"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
          </button>
          <button disabled={loading} className="btn-primary">
            {loading ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
