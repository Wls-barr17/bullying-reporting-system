import { useState } from 'react'
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  Sun,
  UserCog,
  ArrowUpRight,
  UserRound,
} from 'lucide-react'
import AdminDashboard from './AdminDashboard.jsx'
import ProfileModal from './ProfileModal.jsx'

const logo =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Escudo_Universidad_Manuela_Beltr%C3%A1n.png/250px-Escudo_Universidad_Manuela_Beltr%C3%A1n.png'
const sections = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'reports', label: 'Reportes', icon: ClipboardList },
  { id: 'appointments', label: 'Citas y asignaciones', icon: CalendarDays },
  { id: 'roles', label: 'Usuarios y roles', icon: UserCog, adminOnly: true },
]

export default function StaffWorkspace({
  user,
  notify,
  toast,
  theme,
  toggleTheme,
  onLogout,
  onUserUpdated,
  onNavigate,
}) {
  const [section, setSection] = useState('overview')
  const [showProfile, setShowProfile] = useState(false)
  const title = sections.find((item) => item.id === section)?.label || 'Resumen'
  const roleName = user.role === 'ADMIN' ? 'Administración' : 'Equipo psicosocial'

  return (
    <div className="staff-portal">
      <aside className="staff-sidebar">
        <div className="staff-brand">
          <span className="staff-brand-mark">
            <ShieldCheck size={21} />
            <img
              src={logo}
              alt="Escudo UMB"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </span>
          <span>
            <strong>BullyBlock</strong>
            <small>Gestión institucional</small>
          </span>
        </div>
        <div className="staff-nav-caption">ESPACIO DE TRABAJO</div>
        <nav aria-label="Navegación institucional">
          {sections
            .filter((item) => !item.adminOnly || user.role === 'ADMIN')
            .map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`staff-nav-item ${section === id ? 'active' : ''}`}
                onClick={() => setSection(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
        </nav>
        <div className="staff-sidebar-bottom">
          <div className="staff-role">
            <ShieldCheck size={16} />
            <span>
              <strong>{roleName}</strong>
              <small>Acceso autorizado</small>
            </span>
          </div>
          <button className="staff-profile" onClick={() => setShowProfile(true)}>
            <span className="staff-avatar">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" />
              ) : (
                user.name?.slice(0, 1).toUpperCase()
              )}
            </span>
            <span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <UserRound size={16} />
          </button>
        </div>
      </aside>
      <main className="staff-main">
        <header className="staff-topbar">
          <div>
            <span className="staff-breadcrumb">GESTIÓN UMB</span>
            <h1>{title}</h1>
          </div>
          <div className="staff-top-actions">
            <button className="staff-about-link" onClick={() => onNavigate('/')}>
              Sobre BullyBlock <ArrowUpRight size={13} />
            </button>
            <span className="staff-role-badge">
              <i />
              {roleName}
            </span>
            <button
              className="icon-button theme-toggle"
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="staff-avatar staff-top-avatar"
              onClick={() => setShowProfile(true)}
              aria-label="Editar perfil"
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt="" />
              ) : (
                user.name?.slice(0, 1).toUpperCase()
              )}
            </button>
          </div>
        </header>
        <div className="staff-content">
          <div className="staff-welcome">
            <div>
              <span>UNIVERSIDAD MANUELA BELTRÁN</span>
              <h2>{section === 'overview' ? `Hola, ${user.name.split(' ')[0]}` : title}</h2>
              <p>
                {section === 'overview'
                  ? 'Aquí tienes el estado del acompañamiento y las tareas que requieren atención.'
                  : section === 'reports'
                    ? 'Revisa y actualiza los reportes recibidos por el equipo.'
                    : 'Organiza las solicitudes, confirma horarios y asigna profesionales.'}
              </p>
            </div>
          </div>
          <AdminDashboard notify={notify} section={section} />
          <footer className="staff-footer">
            Información sensible · Uso exclusivo del personal autorizado
          </footer>
        </div>
      </main>
      {showProfile && (
        <ProfileModal
          user={user}
          close={() => setShowProfile(false)}
          onSaved={(account) => {
            onUserUpdated(account)
            setShowProfile(false)
            notify('Tu perfil quedó actualizado.')
          }}
          onLogout={onLogout}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
