import { useRef, useState } from 'react'
import { Camera, LogOut, UserRound } from 'lucide-react'
import { api } from '../api/client.js'
import Modal from './Modal.jsx'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024

export default function ProfileModal({ user, close, onSaved, onLogout }) {
  const [name, setName] = useState(user.name || '')
  const [image, setImage] = useState(user.profileImage || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function chooseImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > MAX_IMAGE_SIZE
    ) {
      setError('Elige una imagen PNG, JPG o WebP de máximo 2 MB.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImage(String(reader.result))
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const account = await api('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), profileImage: image || null }),
      })
      onSaved(account)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Tu perfil"
      subtitle="Mantén actualizados tus datos para que podamos acompañarte mejor."
      close={close}
    >
      <form className="form-grid profile-form" onSubmit={submit}>
        <div className="profile-photo-wrap full-field">
          <button
            type="button"
            className="profile-photo"
            onClick={() => inputRef.current?.click()}
            aria-label="Cambiar foto de perfil"
          >
            {image ? <img src={image} alt="Foto de perfil" /> : <UserRound size={30} />}
            <span>
              <Camera size={15} />
            </span>
          </button>
          <div>
            <strong>Foto de perfil</strong>
            <small>PNG, JPG o WebP · máximo 2 MB</small>
            {image && (
              <button className="text-link" type="button" onClick={() => setImage('')}>
                Quitar foto
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={chooseImage}
          />
        </div>
        <label className="full-field">
          Nombre
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength="120"
            required
          />
        </label>
        <label className="full-field">
          Correo institucional
          <input value={user.email} readOnly />
        </label>
        <p className="profile-role full-field">
          Tipo de cuenta:{' '}
          <strong>{user.role === 'STUDENT' ? 'Reportante' : 'Equipo de acompañamiento'}</strong>
        </p>
        {error && (
          <div className="form-error full-field" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions full-field profile-actions">
          <button type="button" className="btn-quiet" onClick={onLogout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
