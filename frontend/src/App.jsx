import { useCallback, useEffect, useState } from 'react'
import {
  Shield,
  Home,
  ClipboardList,
  CalendarDays,
  LifeBuoy,
  Menu,
  Bell,
  Plus,
  ArrowUpRight,
  LockKeyhole,
  CheckCircle2,
  Search,
  HeartHandshake,
  X,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react'
import { api } from './api/client.js'
import AuthModal from './components/AuthModal.jsx'
import CaseRow from './components/CaseRow.jsx'
import Modal from './components/Modal.jsx'
import ProfileModal from './components/ProfileModal.jsx'
import StaffWorkspace from './components/StaffWorkspace.jsx'
import PublicLanding from './components/PublicLanding.jsx'

const navigation = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'casos', label: 'Mis reportes', icon: ClipboardList },
  { id: 'citas', label: 'Orientación', icon: CalendarDays },
  { id: 'ayuda', label: 'Recursos de apoyo', icon: LifeBuoy },
]
const universityLogo =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Escudo_Universidad_Manuela_Beltr%C3%A1n.png/250px-Escudo_Universidad_Manuela_Beltr%C3%A1n.png'

export default function App() {
  const [section, setSection] = useState('inicio')
  const [user, setUser] = useState(null)
  const [cases, setCases] = useState([])
  const [appointments, setAppointments] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [showAppointment, setShowAppointment] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [tracking, setTracking] = useState('')
  const [found, setFound] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('bullyblock-theme') || 'light')
  const [showProfile, setShowProfile] = useState(false)
  const [pathname, setPathname] = useState(window.location.pathname)
  const [authMode, setAuthMode] = useState('login')
  const [landingMessage, setLandingMessage] = useState('')

  const navigate = useCallback((path) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setPathname(path)
    setLandingMessage('')
  }, [])

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('bullyblock-theme', theme)
  }, [theme])

  const notify = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 4500)
  }, [])

  const refreshPrivateData = useCallback(
    async (account) => {
      if (!account) {
        setCases([])
        setAppointments([])
        return
      }
      try {
        const [myCases, myAppointments] = await Promise.all([
          api('/cases/mine'),
          api('/appointments'),
        ])
        setCases(myCases)
        setAppointments(myAppointments)
      } catch (error) {
        notify(error.message)
      }
    },
    [notify],
  )

  useEffect(() => {
    api('/auth/session')
      .then((account) => {
        setUser(account)
        return refreshPrivateData(account)
      })
      .catch(() => {})
  }, [refreshPrivateData])

  const requireAccount = (action) => {
    if (!user) {
      setShowAuth(true)
      return
    }
    action()
  }

  async function submitReport(event) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const confidential = form.get('confidential') === 'on'
    try {
      const result = await api('/cases', {
        method: 'POST',
        body: JSON.stringify({
          category: form.get('category'),
          description: form.get('description'),
          location: form.get('location'),
          incidentDate: form.get('incidentDate') || null,
          confidential,
        }),
      })
      setTracking(result.trackingCode)
      setFound({ ...result, updates: [] })
      setShowReport(false)
      setSection('casos')
      await refreshPrivateData(user)
      notify('Recibimos tu reporte. Guarda el código para consultar su seguimiento.')
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitAppointment(event) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      await api('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          reason: form.get('reason'),
          date: form.get('date'),
          time: form.get('time'),
          modality: form.get('modality'),
        }),
      })
      setShowAppointment(false)
      await refreshPrivateData(user)
      notify('Recibimos tu solicitud. El equipo confirmará la disponibilidad.')
    } catch (error) {
      notify(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function lookup(event) {
    event.preventDefault()
    try {
      const report = await api('/cases/track', {
        method: 'POST',
        body: JSON.stringify({ trackingCode: tracking.trim() }),
      })
      setFound({ ...report, trackingCode: tracking.trim() })
    } catch (error) {
      setFound(null)
      notify(error.message)
    }
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
      setUser(null)
      setSection('inicio')
      navigate('/')
      await refreshPrivateData(null)
      notify('Cerraste sesión de forma segura.')
    } catch (error) {
      notify(error.message)
    }
  }

  function handleAuthenticated(account) {
    setUser(account)
    refreshPrivateData(account)
    setShowAuth(false)
    navigate(['SUPPORT', 'ADMIN'].includes(account.role) ? '/gestion' : '/reportes')
    notify(`Hola, ${account.name}. Tu sesión está activa.`)
  }

  function openSignIn() {
    if (user) {
      navigate(['SUPPORT', 'ADMIN'].includes(user.role) ? '/gestion' : '/reportes')
      return
    }
    setAuthMode('login')
    setShowAuth(true)
  }

  function openStaffPortal() {
    if (user && ['SUPPORT', 'ADMIN'].includes(user.role)) {
      navigate('/gestion')
    } else if (user) {
      setLandingMessage(
        'El espacio de gestión está reservado para psicología y administración autorizadas.',
      )
    } else {
      navigate('/gestion')
      setAuthMode('login')
      setShowAuth(true)
    }
  }

  const authDialog = showAuth && (
    <AuthModal
      close={() => setShowAuth(false)}
      initialMode={authMode}
      onAuthenticated={handleAuthenticated}
    />
  )

  const isStaff = user && ['SUPPORT', 'ADMIN'].includes(user.role)
  const publicPath = pathname === '/' || pathname === '/about'
  if (publicPath || (pathname === '/gestion' && !isStaff)) {
    const restrictedMessage =
      pathname === '/gestion' && user
        ? 'El portal de gestión está reservado para cuentas institucionales autorizadas. Puedes ir al espacio estudiantil.'
        : pathname === '/gestion' && !user
          ? 'Inicia sesión con una cuenta institucional autorizada para entrar al panel de gestión.'
          : ''
    return (
      <>
        <PublicLanding
          theme={theme}
          toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          onStudentPortal={() => navigate('/reportes')}
          onStaffPortal={openStaffPortal}
          onSignIn={openSignIn}
          onRegister={() => {
            setAuthMode('register')
            setShowAuth(true)
          }}
          accessMessage={restrictedMessage || landingMessage}
        />
        {authDialog}
        {toast && (
          <div className="toast" role="status">
            <CheckCircle2 size={18} />
            {toast}
          </div>
        )}
      </>
    )
  }

  if (isStaff) {
    return (
      <StaffWorkspace
        user={user}
        notify={notify}
        toast={toast}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onLogout={logout}
        onUserUpdated={setUser}
        onNavigate={navigate}
      />
    )
  }

  const pages = navigation
  const title = pages.find((item) => item.id === section)?.label || 'Inicio'
  const openAppointments = () => requireAccount(() => setShowAppointment(true))

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Shield className="brand-fallback" size={24} />
            <img
              className="brand-logo"
              src={universityLogo}
              alt="Escudo de la Universidad Manuela Beltrán"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <div>
            <strong>BullyBlock</strong>
            <span>Universidad Manuela Beltrán</span>
          </div>
          <button
            className="close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">ESPACIO DE ACOMPAÑAMIENTO</div>
        <nav aria-label="Navegación principal">
          {pages.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${section === item.id ? 'active' : ''}`}
              onClick={() => {
                setSection(item.id)
                setMenuOpen(false)
              }}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === 'casos' && cases.length > 0 && (
                <span className="nav-count">{cases.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="confidential-note">
            <div className="note-icon">
              <LockKeyhole size={17} />
            </div>
            <div>
              <strong>Un espacio seguro</strong>
              <p>Tu bienestar y privacidad son nuestra prioridad.</p>
            </div>
          </div>
          <button
            className="profile profile-button"
            onClick={() => (user ? setShowProfile(true) : setShowAuth(true))}
          >
            <div className="avatar">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" />
              ) : user ? (
                user.name?.slice(0, 1).toUpperCase()
              ) : (
                'U'
              )}
            </div>
            <div>
              <strong>{user?.name || 'Iniciar sesión'}</strong>
              <span>{user ? user.email : 'Comunidad UMB'}</span>
            </div>
            {user ? (
              <UserRound className="profile-logout" size={16} />
            ) : (
              <span className="profile-dots">↗</span>
            )}
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="top-left">
            <button
              className="mobile-menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumbs">
              <span>Comunidad</span>
              <span className="crumb-slash">/</span>
              <strong>{title}</strong>
            </div>
          </div>
          <div className="top-actions">
            <button className="about-link" onClick={() => navigate('/')}>
              Sobre BullyBlock
            </button>
            <span className="help-status">
              <i /> Orientación disponible
            </span>
            <button
              className="icon-button theme-toggle"
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="icon-button" aria-label="Notificaciones">
              <Bell size={19} />
              <i />
            </button>
            <button
              className="top-avatar"
              onClick={() => (user ? setShowProfile(true) : setShowAuth(true))}
              aria-label={user ? 'Editar perfil' : 'Iniciar sesión'}
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" />
              ) : user ? (
                user.name?.slice(0, 1).toUpperCase()
              ) : (
                'U'
              )}
            </button>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">UNIVERSIDAD MANUELA BELTRÁN</div>
              <h1>{section === 'inicio' ? 'Hola, estás en un espacio seguro.' : title}</h1>
              <p>
                {section === 'inicio'
                  ? 'Estamos aquí para escucharte y acompañarte, a tu ritmo.'
                  : section === 'casos'
                    ? 'Consulta tus reportes o usa el código privado de seguimiento.'
                    : section === 'citas'
                      ? 'Solicita un espacio privado con el equipo de orientación.'
                      : 'Encuentra canales de ayuda y recursos para tu bienestar.'}
              </p>
            </div>
            <button
              className="btn-primary welcome-action"
              onClick={() => requireAccount(() => setShowReport(true))}
            >
              <Plus size={17} /> Reportar un caso
            </button>
          </div>

          {section === 'inicio' && (
            <HomePage
              cases={cases}
              onReport={() => setShowReport(true)}
              onAppointment={openAppointments}
              onResources={() => setSection('ayuda')}
              onCases={() => setSection('casos')}
            />
          )}
          {section === 'casos' && (
            <CasesPage
              user={user}
              cases={cases}
              tracking={tracking}
              setTracking={setTracking}
              found={found}
              lookup={lookup}
              onReport={() => setShowReport(true)}
              onSignIn={() => setShowAuth(true)}
            />
          )}
          {section === 'citas' && (
            <AppointmentsPage
              user={user}
              appointments={appointments}
              onRequest={openAppointments}
              onSignIn={() => setShowAuth(true)}
            />
          )}
          {section === 'ayuda' && (
            <ResourcesPage onAppointment={openAppointments} onReport={() => setShowReport(true)} />
          )}
          <footer>
            © {new Date().getFullYear()} Universidad Manuela Beltrán <span>·</span> Un espacio de
            respeto, cuidado y acompañamiento.
          </footer>
        </div>
      </main>

      {menuOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      )}
      {showReport && (
        <ReportModal close={() => setShowReport(false)} submit={submitReport} loading={loading} />
      )}
      {showAppointment && (
        <AppointmentModal
          close={() => setShowAppointment(false)}
          submit={submitAppointment}
          loading={loading}
        />
      )}
      {authDialog}
      {showProfile && user && (
        <ProfileModal
          user={user}
          close={() => setShowProfile(false)}
          onSaved={(account) => {
            setUser(account)
            setShowProfile(false)
            notify('Tu perfil quedó actualizado.')
          }}
          onLogout={logout}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  )
}

function HomePage({ cases, onReport, onAppointment, onResources, onCases }) {
  return (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="sparkle">✳</span> AQUÍ PUEDES CONTARLO
          </div>
          <h2>
            No tienes que
            <br />
            enfrentarlo a solas.
          </h2>
          <p>
            Cuéntanos qué está pasando. El equipo de bienestar te escuchará con respeto, sin
            juzgarte.
          </p>
          <button className="btn-light" onClick={onReport}>
            Iniciar un reporte <ArrowUpRight size={16} />
          </button>
          <div className="hero-assurance">
            <LockKeyhole size={13} /> Confidencial y seguro <span>·</span> A tu propio ritmo
          </div>
        </div>
        <HeroIllustration />
      </section>
      <div className="section-heading">
        <div>
          <h2>¿Cómo podemos acompañarte?</h2>
          <p>Elige el camino que te haga sentir más cómodo.</p>
        </div>
      </div>
      <div className="action-grid">
        <ActionCard
          icon={ClipboardList}
          tone="lavender"
          title="Reportar una situación"
          body="Describe lo ocurrido de forma segura. Puedes hacerlo confidencialmente."
          link="Comenzar un reporte"
          onClick={onReport}
        />
        <ActionCard
          icon={CalendarDays}
          tone="mint"
          title="Hablar con orientación"
          body="Solicita una conversación privada con el equipo de bienestar."
          link="Solicitar una cita"
          onClick={onAppointment}
        />
        <ActionCard
          icon={LifeBuoy}
          tone="peach"
          title="Buscar apoyo ahora"
          body="Conoce los canales institucionales y recursos disponibles."
          link="Ver recursos"
          onClick={onResources}
        />
      </div>
      <div className="lower-grid">
        <section className="panel recent-panel">
          <div className="panel-head">
            <div>
              <h2>Actividad reciente</h2>
              <p>
                {cases.length
                  ? 'El seguimiento de tus reportes'
                  : 'Inicia sesión para ver reportes asociados a tu cuenta.'}
              </p>
            </div>
            {cases.length > 0 && (
              <button className="subtle-button" onClick={onCases}>
                Ver todos <ArrowUpRight size={14} />
              </button>
            )}
          </div>
          {cases.length ? (
            cases.slice(0, 3).map((item) => <CaseRow key={item.trackingCode} item={item} />)
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="Tus reportes confidenciales no aparecen en esta lista"
              body="Puedes consultarlos en cualquier momento con el código privado de seguimiento."
            />
          )}
        </section>
        <section className="support-panel">
          <div className="support-illustration">
            <HeartHandshake size={25} />
            <span>♡</span>
          </div>
          <div className="support-tag">ESTAMOS PARA TI</div>
          <h3>
            ¿Necesitas hablar
            <br />
            con alguien hoy?
          </h3>
          <p>El equipo de bienestar está disponible para escucharte y orientarte.</p>
          <button className="support-link" onClick={onAppointment}>
            Solicitar orientación <ArrowUpRight size={15} />
          </button>
          <div className="support-decoration">✳</div>
        </section>
      </div>
    </>
  )
}

function CasesPage({ user, cases, tracking, setTracking, found, lookup, onReport, onSignIn }) {
  return (
    <div className="cases-layout">
      <section className="panel cases-panel">
        <div className="panel-head">
          <div>
            <h2>Mis reportes</h2>
            <p>
              {user
                ? 'Los reportes vinculados a tu cuenta.'
                : 'Inicia sesión para consultar reportes vinculados a tu cuenta.'}
            </p>
          </div>
          <button className="btn-primary small-btn" onClick={onReport}>
            <Plus size={16} /> Nuevo reporte
          </button>
        </div>
        {user ? (
          cases.length ? (
            cases.map((item) => <CaseRow key={item.trackingCode} item={item} />)
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No tienes reportes vinculados a tu cuenta"
              body="Los reportes confidenciales se consultan con su código privado."
            />
          )
        ) : (
          <div className="signin-callout">
            <button className="text-link" onClick={onSignIn}>
              Iniciar sesión para ver mis reportes →
            </button>
          </div>
        )}
      </section>
      <section className="panel lookup-panel">
        <div className="lookup-icon">
          <Search size={19} />
        </div>
        <h3>Consultar un reporte</h3>
        <p>
          Escribe el código privado que recibiste al enviarlo. El código permite ver solamente el
          estado y sus actualizaciones.
        </p>
        <form onSubmit={lookup}>
          <label htmlFor="tracking">Código de seguimiento</label>
          <div className="lookup-input">
            <input
              id="tracking"
              value={tracking}
              onChange={(event) => setTracking(event.target.value)}
              placeholder="Pega aquí tu código privado"
              required
            />
            <button aria-label="Buscar reporte">
              <ArrowUpRight size={17} />
            </button>
          </div>
        </form>
        {found && <TrackingResult item={found} />}
      </section>
    </div>
  )
}

function TrackingResult({ item }) {
  const statuses = {
    RECEIVED: 'Recibido',
    REVIEWING: 'En revisión',
    SUPPORT_ARRANGED: 'En acompañamiento',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
  }
  return (
    <div className="tracking-result">
      <div className="tracking-status">
        <span>ESTADO ACTUAL</span>
        <strong>{statuses[item.status] || item.status}</strong>
      </div>
      <div className="tracking-timeline">
        {item.updates?.map((update, index) => (
          <div className="timeline-item" key={`${update.createdAt}-${index}`}>
            <i />
            <div>
              <p>{update.message}</p>
              <span>
                {new Date(update.createdAt).toLocaleString('es-CO', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
      <small>Este enlace de seguimiento es privado. No lo compartas con otras personas.</small>
    </div>
  )
}

function AppointmentsPage({ user, appointments, onRequest, onSignIn }) {
  return (
    <div className="panel cases-panel">
      <div className="panel-head">
        <div>
          <h2>Solicitudes de orientación</h2>
          <p>Espacios privados con el equipo de bienestar universitario.</p>
        </div>
        <button className="btn-primary small-btn" onClick={onRequest}>
          <Plus size={16} /> Solicitar cita
        </button>
      </div>
      {!user ? (
        <div className="signin-callout">
          <button className="text-link" onClick={onSignIn}>
            Inicia sesión para consultar o solicitar una cita →
          </button>
        </div>
      ) : appointments.length ? (
        appointments.map((appointment) => (
          <div className="case-row" key={appointment.id}>
            <div className="case-type-icon mint">
              <CalendarDays size={18} />
            </div>
            <div className="case-info">
              <strong>{appointment.reason}</strong>
              <span>
                {new Date(appointment.preferredAt).toLocaleString('es-CO', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                · {appointment.modality === 'VIRTUAL' ? 'Virtual' : 'Presencial'}
              </span>
              {appointment.assignedPsychologist && (
                <small className="appointment-professional">
                  Acompañamiento con: {appointment.assignedPsychologist}
                </small>
              )}
            </div>
            <span className="status-pill status-review">
              <i />
              {appointment.status === 'REQUESTED' ? 'Solicitada' : appointment.status}
            </span>
          </div>
        ))
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Aún no has solicitado una cita"
          body="Puedes elegir una hora preferida y el equipo confirmará la disponibilidad."
        />
      )}
    </div>
  )
}

function ResourcesPage({ onAppointment, onReport }) {
  return (
    <div className="resource-grid">
      <ResourceCard
        icon={HeartHandshake}
        tone="lavender"
        tag="BIENESTAR UNIVERSITARIO"
        title="Orientación psicológica"
        body="Solicita acompañamiento profesional y confidencial para conversar sobre lo que estás viviendo."
        action="Solicitar una cita"
        onClick={onAppointment}
      />
      <ResourceCard
        icon={Shield}
        tone="mint"
        tag="CONVIVENCIA"
        title="Canal de convivencia"
        body="Reporta una situación de acoso, discriminación o violencia para recibir seguimiento institucional."
        action="Iniciar reporte"
        onClick={onReport}
      />
      <article className="resource-card">
        <div className="action-icon peach">
          <LifeBuoy size={20} />
        </div>
        <span className="support-tag">AYUDA INMEDIATA</span>
        <h3>¿Estás en peligro ahora?</h3>
        <p>
          Busca un lugar seguro y comunícate con emergencias en Colombia al 123 o con seguridad de
          tu campus.
        </p>
        <span className="urgent-number">
          123 <small>Emergencias Colombia</small>
        </span>
      </article>
    </div>
  )
}

function ActionCard({ icon: Icon, tone, title, body, link, onClick }) {
  return (
    <button className="action-card" onClick={onClick}>
      <div className={`action-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <span className="card-arrow">
        <ArrowUpRight size={17} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
      <span className="text-link">
        {link} <span>→</span>
      </span>
    </button>
  )
}

function ResourceCard({ icon: Icon, tone, tag, title, body, action, onClick }) {
  return (
    <article className="resource-card">
      <div className={`action-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <span className="support-tag">{tag}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <button className="text-link" onClick={onClick}>
        {action} →
      </button>
    </article>
  )
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={20} />
      </div>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  )
}

function HeroIllustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-sun" />
      <div className="art-person person-back" />
      <div className="art-person person-front" />
      <div className="art-leaf leaf-one" />
      <div className="art-leaf leaf-two" />
      <div className="art-caption">
        <HeartHandshake size={17} />
        <span>
          Escucharte es el
          <br />
          <b>primer paso</b>
        </span>
      </div>
      <div className="hero-decoration">✳</div>
    </div>
  )
}

function ReportModal({ close, submit, loading }) {
  return (
    <Modal
      title="Cuéntanos qué pasó"
      subtitle="Comparte solo lo que te haga sentir cómodo. Tu reporte será atendido con respeto."
      close={close}
      wide
    >
      <form className="form-grid" onSubmit={submit}>
        <label>
          Tipo de situación
          <select name="category" required defaultValue="">
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="BULLYING">Acoso o intimidación</option>
            <option value="SEXUAL_HARASSMENT">Acoso sexual</option>
            <option value="DISCRIMINATION">Discriminación</option>
            <option value="PHYSICAL_AGGRESSION">Agresión física</option>
            <option value="CYBERBULLYING">Ciberacoso</option>
            <option value="OTHER">Otra situación</option>
          </select>
        </label>
        <label>
          ¿Dónde ocurrió?
          <input
            name="location"
            maxLength="180"
            required
            placeholder="Facultad, aula o espacio virtual"
          />
        </label>
        <label>
          Fecha aproximada
          <input type="date" name="incidentDate" max={new Date().toISOString().slice(0, 10)} />
        </label>
        <label className="full-field">
          Cuéntanos qué ocurrió
          <textarea
            name="description"
            required
            minLength="15"
            maxLength="4000"
            rows="4"
            placeholder="Puedes describir los hechos con tus propias palabras…"
          />
        </label>
        <label className="check-label full-field">
          <input name="confidential" type="checkbox" defaultChecked />
          <span>
            <b>Enviar de forma confidencial</b>
            <small>
              No vincularemos este reporte a tu cuenta. Guarda el código privado que recibirás.
            </small>
          </span>
        </label>
        <div className="form-actions full-field">
          <button type="button" className="btn-quiet" onClick={close}>
            Cancelar
          </button>
          <button disabled={loading} className="btn-primary">
            {loading ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </div>
      </form>
      <div className="modal-privacy">
        <LockKeyhole size={13} /> Tu reporte solo es visible para el equipo autorizado de
        acompañamiento.
      </div>
    </Modal>
  )
}

function AppointmentModal({ close, submit, loading }) {
  return (
    <Modal
      title="Solicitar orientación"
      subtitle="El equipo de bienestar revisará tu solicitud y confirmará el espacio."
      close={close}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="full-field">
          ¿Sobre qué te gustaría conversar?
          <textarea
            name="reason"
            required
            maxLength="500"
            rows="3"
            placeholder="Puedes compartir un motivo general…"
          />
        </label>
        <label>
          Fecha preferida
          <input name="date" type="date" min={new Date().toISOString().slice(0, 10)} required />
        </label>
        <label>
          Hora preferida
          <input name="time" type="time" required />
        </label>
        <label className="full-field">
          Modalidad
          <select name="modality">
            <option value="VIRTUAL">Virtual</option>
            <option value="IN_PERSON">Presencial</option>
          </select>
        </label>
        <div className="form-actions full-field">
          <button type="button" className="btn-quiet" onClick={close}>
            Cancelar
          </button>
          <button disabled={loading} className="btn-primary">
            {loading ? 'Enviando…' : 'Solicitar espacio'}
          </button>
        </div>
      </form>
      <div className="modal-privacy">
        <LockKeyhole size={13} /> Tu solicitud es privada y solo la ve el equipo autorizado.
      </div>
    </Modal>
  )
}
