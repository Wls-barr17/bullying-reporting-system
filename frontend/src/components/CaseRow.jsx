import { ClipboardList } from 'lucide-react'

const categoryLabels = {
  BULLYING: 'Acoso o intimidación',
  SEXUAL_HARASSMENT: 'Acoso sexual',
  DISCRIMINATION: 'Discriminación',
  PHYSICAL_AGGRESSION: 'Agresión física',
  CYBERBULLYING: 'Ciberacoso',
  OTHER: 'Otra situación',
}
const statusLabels = {
  RECEIVED: 'Recibido',
  REVIEWING: 'En revisión',
  SUPPORT_ARRANGED: 'En acompañamiento',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
}

export default function CaseRow({ item }) {
  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
  const status = item.status || 'RECEIVED'
  return (
    <div className="case-row">
      <div className="case-type-icon lavender">
        <ClipboardList size={18} />
      </div>
      <div className="case-info">
        <strong>{categoryLabels[item.category] || 'Reporte de convivencia'}</strong>
        <span>
          {item.trackingCode || 'Reporte'}
          {date && ` · ${date}`}
        </span>
      </div>
      <span
        className={`status-pill ${status === 'CLOSED' || status === 'RESOLVED' ? 'status-closed' : status === 'RECEIVED' ? 'status-new' : 'status-review'}`}
      >
        <i />
        {statusLabels[status] || status}
      </span>
    </div>
  )
}
