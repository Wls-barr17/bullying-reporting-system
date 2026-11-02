import { useCallback, useEffect, useState } from 'react'
import {
  CalendarDays,
  ClipboardList,
  Download,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { api } from '../api/client.js'
import RoleManagement from './RoleManagement.jsx'

const caseStatuses = ['RECEIVED', 'REVIEWING', 'SUPPORT_ARRANGED', 'RESOLVED', 'CLOSED']
const appointmentStatuses = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const labels = {
  RECEIVED: 'Recibido',
  REVIEWING: 'En revisión',
  SUPPORT_ARRANGED: 'Acompañamiento',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  REQUESTED: 'Solicitada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}
const categories = {
  BULLYING: 'Acoso o intimidación',
  SEXUAL_HARASSMENT: 'Acoso sexual',
  DISCRIMINATION: 'Discriminación',
  PHYSICAL_AGGRESSION: 'Agresión física',
  CYBERBULLYING: 'Ciberacoso',
  OTHER: 'Otra situación',
}

export default function AdminDashboard({ notify, section = 'overview' }) {
  const [cases, setCases] = useState([])
  const [appointments, setAppointments] = useState([])
  const [psychologists, setPsychologists] = useState([])
  const [notes, setNotes] = useState({})
  const [caseStatus, setCaseStatus] = useState({})
  const [appointmentStatus, setAppointmentStatus] = useState({})
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [appointmentView, setAppointmentView] = useState('pending')
  const [assignments, setAssignments] = useState({})

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const [casePage, appointmentPage, professionals] = await Promise.all([
        api('/admin/cases?page=0&size=50'),
        api('/admin/appointments?page=0&size=50'),
        api('/admin/appointments/psychologists'),
      ])
      setCases(casePage.content)
      setAppointments(appointmentPage.content)
      setPsychologists(professionals)
    } catch (error) {
      notify(error.message)
    } finally {
      setBusy(false)
    }
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  async function updateCase(event, item) {
    event.preventDefault()
    const status = caseStatus[item.id] || item.status
    const message = notes[item.id]?.trim()
    try {
      if (status === item.status && !message) return
      if (status === item.status) {
        await api(`/admin/cases/${item.id}/updates`, {
          method: 'POST',
          body: JSON.stringify({ message, visibleToReporter: true }),
        })
      } else {
        const updated = await api(`/admin/cases/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status, message: message || null }),
        })
        setCases((current) =>
          current.map((report) => (report.id === item.id ? { ...report, ...updated } : report)),
        )
      }
      setNotes((current) => ({ ...current, [item.id]: '' }))
      notify('El seguimiento del reporte fue actualizado.')
    } catch (error) {
      notify(error.message)
    }
  }

  async function updateAppointment(item) {
    try {
      const status = appointmentStatus[item.id] || item.status
      if (status === item.status) return
      const updated = await api(`/admin/appointments/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === item.id ? { ...appointment, ...updated } : appointment,
        ),
      )
      notify('El estado de la cita fue actualizado.')
    } catch (error) {
      notify(error.message)
    }
  }

  async function assignAppointment(item) {
    const psychologist = (assignments[item.id] ?? item.assignedPsychologistEmail ?? '').trim()
    try {
      const updated = await api(`/admin/appointments/${item.id}/assignment`, {
        method: 'PATCH',
        body: JSON.stringify({ psychologist }),
      })
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === item.id ? { ...appointment, ...updated } : appointment,
        ),
      )
      notify('La persona profesional quedó asignada.')
    } catch (error) {
      notify(error.message)
    }
  }

  function exportCases() {
    const rows = [
      ['Código', 'Tipo', 'Estado', 'Fecha', 'Ubicación', 'Confidencial'],
      ...filteredCases.map((item) => [
        item.trackingCode,
        categories[item.category] || item.category,
        labels[item.status] || item.status,
        item.createdAt,
        item.location,
        item.confidential ? 'Sí' : 'No',
      ]),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    link.download = 'reportes-bullyblock.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const filteredCases = cases.filter((item) =>
    [
      item.trackingCode,
      item.description,
      item.location,
      item.reporterEmail,
      categories[item.category],
      labels[item.status],
    ].some((value) =>
      String(value || '')
        .toLocaleLowerCase('es')
        .includes(normalizedQuery),
    ),
  )
  const filteredAppointments = appointments.filter((item) =>
    appointmentView === 'pending'
      ? ['REQUESTED', 'CONFIRMED'].includes(item.status)
      : ['COMPLETED', 'CANCELLED'].includes(item.status),
  )
  const showCases = section === 'overview' || section === 'reports'
  const showAppointments = section === 'overview' || section === 'appointments'
  const showRoles = section === 'roles'

  return (
    <div className="admin-content">
      <div className="admin-intro">
        <div className="action-icon lavender">
          <ShieldCheck size={20} />
        </div>
        <div>
          <strong>Acceso institucional</strong>
          <span>
            Esta información incluye datos sensibles. Consulta solo los casos que estés autorizado a
            gestionar.
          </span>
        </div>
        <button className="subtle-button" onClick={load} disabled={busy}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>
      {showRoles && <RoleManagement notify={notify} />}
      {section === 'overview' && (
        <div className="crm-metrics">
          <article className="crm-metric">
            <span>Reportes recibidos</span>
            <strong>{cases.length}</strong>
            <small>Casos en el panel</small>
          </article>
          <article className="crm-metric">
            <span>En revisión</span>
            <strong>
              {cases.filter((item) => ['RECEIVED', 'REVIEWING'].includes(item.status)).length}
            </strong>
            <small>Requieren seguimiento</small>
          </article>
          <article className="crm-metric">
            <span>Citas por atender</span>
            <strong>{appointments.filter((item) => item.status === 'REQUESTED').length}</strong>
            <small>Solicitudes pendientes</small>
          </article>
          <article className="crm-metric">
            <span>Acompañamientos</span>
            <strong>{appointments.filter((item) => item.status === 'CONFIRMED').length}</strong>
            <small>Citas confirmadas</small>
          </article>
        </div>
      )}
      {showCases && (
        <section className="panel admin-panel">
          <div className="panel-head">
            <div>
              <h2>Reportes de convivencia</h2>
              <p>
                {filteredCases.length} resultados · La información solo es visible para el equipo
                autorizado.
              </p>
            </div>
            <button
              className="subtle-button"
              onClick={exportCases}
              disabled={!filteredCases.length}
            >
              <Download size={15} /> Exportar CSV
            </button>
          </div>
          <div className="admin-toolbar">
            <label className="admin-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por código, estado o lugar"
              />
            </label>
            <span>
              <Users size={15} /> Vista del equipo
            </span>
          </div>
          {filteredCases.length ? (
            filteredCases.map((item) => (
              <article className="admin-case" key={item.id}>
                <div className="admin-case-head">
                  <div className="case-type-icon lavender">
                    <ClipboardList size={18} />
                  </div>
                  <div className="case-info">
                    <strong>{categories[item.category] || item.category}</strong>
                    <span>
                      {item.trackingCode} ·{' '}
                      {new Date(item.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                      {item.confidential ? ' · Confidencial' : ''}
                      {!item.confidential && item.reporterEmail ? ` · ${item.reporterEmail}` : ''}
                    </span>
                  </div>
                  <span className="status-pill status-review">
                    <i />
                    {labels[item.status] || item.status}
                  </span>
                </div>
                <p className="admin-description">{item.description}</p>
                <div className="admin-location">
                  Lugar: {item.location}
                  {item.incidentDate ? ` · Fecha del incidente: ${item.incidentDate}` : ''}
                </div>
                <form className="admin-update-form" onSubmit={(event) => updateCase(event, item)}>
                  <label>
                    Estado
                    <select
                      value={caseStatus[item.id] || item.status}
                      onChange={(event) =>
                        setCaseStatus((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                    >
                      {caseStatuses.map((status) => (
                        <option key={status} value={status}>
                          {labels[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-note">
                    Nota para la persona (opcional)
                    <input
                      value={notes[item.id] || ''}
                      maxLength="1500"
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      placeholder="Se añade al historial visible del reporte"
                    />
                  </label>
                  <button className="btn-primary small-btn">Guardar actualización</button>
                </form>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <ClipboardList size={20} />
              </div>
              <strong>No hay reportes para mostrar</strong>
              <span>Los reportes nuevos aparecerán aquí.</span>
            </div>
          )}
          {cases.length >= 50 && (
            <p className="admin-limit">
              Se muestran los 50 reportes más recientes. Usa filtros en la API para atender casos
              anteriores.
            </p>
          )}
        </section>
      )}
      {showAppointments && (
        <section className="panel admin-panel">
          <div className="panel-head">
            <div>
              <h2>Solicitudes de orientación</h2>
              <p>Datos de contacto solo para coordinar las citas.</p>
            </div>
          </div>
          <div className="appointment-tabs">
            <button
              className={appointmentView === 'pending' ? 'selected' : ''}
              onClick={() => setAppointmentView('pending')}
            >
              Pendientes e historial activo (
              {
                appointments.filter((item) => ['REQUESTED', 'CONFIRMED'].includes(item.status))
                  .length
              }
              )
            </button>
            <button
              className={appointmentView === 'history' ? 'selected' : ''}
              onClick={() => setAppointmentView('history')}
            >
              Historial cerrado (
              {
                appointments.filter((item) => ['COMPLETED', 'CANCELLED'].includes(item.status))
                  .length
              }
              )
            </button>
          </div>
          {filteredAppointments.length ? (
            filteredAppointments.map((item) => (
              <article className="admin-appointment" key={item.id}>
                <div className="case-type-icon mint">
                  <CalendarDays size={18} />
                </div>
                <div className="case-info">
                  <strong>
                    {item.accountName} · {item.reason}
                  </strong>
                  <span>
                    {item.accountEmail} ·{' '}
                    {new Date(item.preferredAt).toLocaleString('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {item.modality === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
                  </span>
                </div>
                <label className="assignment-field">
                  Profesional
                  <select
                    value={assignments[item.id] ?? item.assignedPsychologistEmail ?? ''}
                    onChange={(event) =>
                      setAssignments((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                  >
                    <option value="">Sin asignar</option>
                    {psychologists.map((person) => (
                      <option key={person.id} value={person.email}>
                        {person.name} · {person.email}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="subtle-button" onClick={() => assignAppointment(item)}>
                  Asignar
                </button>
                <select
                  className="compact-select"
                  aria-label="Estado de la cita"
                  value={appointmentStatus[item.id] || item.status}
                  onChange={(event) =>
                    setAppointmentStatus((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                >
                  {appointmentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {labels[status]}
                    </option>
                  ))}
                </select>
                <button className="btn-primary small-btn" onClick={() => updateAppointment(item)}>
                  Guardar
                </button>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <CalendarDays size={20} />
              </div>
              <strong>No hay citas solicitadas</strong>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
