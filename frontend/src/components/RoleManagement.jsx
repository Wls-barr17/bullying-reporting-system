import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, ShieldCheck, Users } from 'lucide-react'
import { api } from '../api/client.js'

const roles = [
  { value: 'STUDENT', label: 'Estudiante / reportante' },
  { value: 'SUPPORT', label: 'Psicología / acompañamiento' },
  { value: 'ADMIN', label: 'Administrador' },
]
const roleNames = Object.fromEntries(roles.map(({ value, label }) => [value, label]))

export default function RoleManagement({ notify }) {
  const [accounts, setAccounts] = useState([])
  const [history, setHistory] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('SUPPORT')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [accountPage, historyPage] = await Promise.all([
        api('/admin/accounts?page=0&size=100'),
        api('/admin/accounts/role-history?page=0&size=100'),
      ])
      setAccounts(accountPage.content)
      setHistory(historyPage.content)
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  async function assignRole(event) {
    event.preventDefault()
    try {
      const updated = await api('/admin/accounts/role', {
        method: 'PATCH',
        body: JSON.stringify({ email: email.trim(), role }),
      })
      setEmail('')
      notify(`Rol actualizado para ${updated.email}. La persona debe volver a iniciar sesión.`)
      await load()
    } catch (error) {
      notify(error.message)
    }
  }

  const filteredAccounts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es')
    return accounts.filter((account) =>
      `${account.name} ${account.email} ${roleNames[account.role]}`
        .toLocaleLowerCase('es')
        .includes(needle),
    )
  }, [accounts, query])

  return (
    <div className="role-management">
      <section className="panel role-assign-panel">
        <div className="panel-head">
          <div>
            <h2>Asignar un rol por correo</h2>
            <p>
              Solo funciona con cuentas que ya se hayan registrado. Los cambios quedan auditados.
            </p>
          </div>
          <ShieldCheck size={20} />
        </div>
        <form className="role-assign-form" onSubmit={assignRole}>
          <label>
            Correo de la cuenta
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength="180"
              placeholder="persona@umb.edu.co"
              required
            />
          </label>
          <label>
            Rol
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary" disabled={loading}>
            Guardar rol
          </button>
        </form>
        <small className="role-security-note">
          El registro público nunca puede crear administradores ni personal de psicología.
        </small>
      </section>
      <section className="panel role-list-panel">
        <div className="panel-head">
          <div>
            <h2>
              <Users size={17} /> Cuentas registradas
            </h2>
            <p>
              {accounts.length} cuentas recientes · {filteredAccounts.length} visibles
            </p>
          </div>
        </div>
        <label className="admin-search role-search">
          <Users size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nombre o correo"
          />
        </label>
        <div className="role-table-wrap">
          <table className="role-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Correo</th>
                <th>Rol actual</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.email}</td>
                  <td>
                    <span className={`role-chip role-${account.role.toLowerCase()}`}>
                      {roleNames[account.role]}
                    </span>
                  </td>
                  <td>{new Date(account.createdAt).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredAccounts.length && (
          <div className="role-empty">
            {loading ? 'Cargando cuentas…' : 'No hay cuentas que coincidan con la búsqueda.'}
          </div>
        )}
      </section>
      <section className="panel role-history-panel">
        <div className="panel-head">
          <div>
            <h2>
              <Clock3 size={17} /> Historial de cambios de rol
            </h2>
            <p>Registro de quién realizó cada cambio y a qué cuenta.</p>
          </div>
        </div>
        {history.length ? (
          <div className="role-history-list">
            {history.map((entry) => (
              <article key={entry.id}>
                <span className="history-dot" />
                <div>
                  <strong>
                    {entry.targetName} <small>({entry.targetEmail})</small>
                  </strong>
                  <p>
                    {roleNames[entry.previousRole]} <b>→</b> {roleNames[entry.newRole]}
                  </p>
                  <small>
                    Por {entry.changedByEmail} ·{' '}
                    {new Date(entry.changedAt).toLocaleString('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="role-empty">Aún no se han cambiado roles.</div>
        )}
      </section>
    </div>
  )
}
