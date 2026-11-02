import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react'

const logo =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Escudo_Universidad_Manuela_Beltr%C3%A1n.png/250px-Escudo_Universidad_Manuela_Beltr%C3%A1n.png'

export default function PublicLanding({
  theme,
  toggleTheme,
  onStudentPortal,
  onStaffPortal,
  onSignIn,
  onRegister,
  accessMessage = '',
}) {
  return (
    <div className="public-site">
      <header className="public-header">
        <a className="public-brand" href="/" aria-label="BullyBlock UMB, página principal">
          <span className="public-logo">
            <ShieldCheck size={20} />
            <img
              src={logo}
              alt=""
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </span>
          <span>
            <strong>BullyBlock</strong>
            <small>Universidad Manuela Beltrán</small>
          </span>
        </a>
        <nav className="public-nav" aria-label="Información del servicio">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#privacidad">Privacidad</a>
          <a href="#apoyo">Apoyo</a>
        </nav>
        <div className="public-header-actions">
          <button
            className="icon-button theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="btn-quiet public-login" onClick={onSignIn}>
            Iniciar sesión
          </button>
        </div>
      </header>

      {accessMessage && (
        <div className="public-access-message" role="status">
          {accessMessage}
        </div>
      )}

      <main>
        <section className="public-hero">
          <div className="public-hero-copy">
            <span className="public-eyebrow">
              <i /> UN ESPACIO DE CONFIANZA EN LA UMB
            </span>
            <h1>
              Tu bienestar importa.
              <br />
              <em>Estamos para escucharte.</em>
            </h1>
            <p>
              BullyBlock conecta a la comunidad universitaria con orientación y acompañamiento para
              reportar situaciones de acoso, intimidación y convivencia.
            </p>
            <div className="public-cta-row">
              <button className="btn-primary" onClick={onStudentPortal}>
                Ir al espacio estudiantil <ArrowRight size={16} />
              </button>
              <button className="public-text-cta" onClick={onRegister}>
                Crear cuenta
              </button>
            </div>
            <div className="public-trust-line">
              <LockKeyhole size={15} /> Reportes confidenciales <span>·</span> Seguimiento privado{' '}
              <span>·</span> Acompañamiento humano
            </div>
          </div>
          <div className="public-hero-card">
            <div className="public-card-orbit orbit-a" />
            <div className="public-card-orbit orbit-b" />
            <div className="public-hero-symbol">
              <HeartHandshake size={44} />
            </div>
            <div className="public-note-card">
              <CheckCircle2 size={17} />
              <span>
                <strong>Tu voz merece ser escuchada</strong>
                <small>El equipo de bienestar te acompaña</small>
              </span>
            </div>
            <span className="public-card-caption">Un primer paso, a tu ritmo.</span>
          </div>
        </section>

        <section className="public-steps" id="como-funciona">
          <div className="public-section-title">
            <span>UN CAMINO SENCILLO</span>
            <h2>¿Cómo funciona?</h2>
            <p>
              Elige la forma de apoyo que necesitas. Puedes comenzar sin contar más de lo que
              quieras.
            </p>
          </div>
          <div className="public-step-grid">
            <article>
              <i>01</i>
              <ClipboardCheck size={21} />
              <h3>Cuéntanos qué ocurre</h3>
              <p>
                Comparte una situación de convivencia o acoso con tus palabras y con el detalle que
                te resulte cómodo.
              </p>
            </article>
            <article>
              <i>02</i>
              <LockKeyhole size={21} />
              <h3>Elige cómo hacerlo</h3>
              <p>
                Envía un reporte confidencial con código privado o vincúlalo a tu cuenta para
                consultarlo fácilmente.
              </p>
            </article>
            <article>
              <i>03</i>
              <HeartHandshake size={21} />
              <h3>Recibe acompañamiento</h3>
              <p>
                El equipo autorizado revisa el caso y comparte actualizaciones o coordina una cita
                de orientación.
              </p>
            </article>
          </div>
        </section>

        <section className="public-bottom-grid" id="privacidad">
          <article className="public-info-panel">
            <div className="public-mini-icon">
              <LockKeyhole size={18} />
            </div>
            <span>PRIVACIDAD</span>
            <h2>Tu historia se trata con cuidado.</h2>
            <p>
              Los reportes confidenciales se consultan con un código privado. El acceso a los casos
              está restringido al personal autorizado.
            </p>
            <button className="public-text-cta" onClick={onStudentPortal}>
              Conocer el espacio estudiantil <ArrowRight size={15} />
            </button>
          </article>
          <article className="public-info-panel" id="apoyo">
            <div className="public-mini-icon">
              <CalendarDays size={18} />
            </div>
            <span>ORIENTACIÓN</span>
            <h2>También puedes pedir una conversación.</h2>
            <p>
              Solicita un espacio de orientación desde el portal estudiantil. El equipo confirmará
              la disponibilidad y modalidad.
            </p>
            <button className="public-text-cta" onClick={onSignIn}>
              Acceder a orientación <ArrowRight size={15} />
            </button>
          </article>
        </section>
        <section className="public-urgent">
          <strong>¿Estás en peligro inmediato?</strong>
          <span>
            Busca un lugar seguro y llama a emergencias en Colombia: <b>123</b>.
          </span>
        </section>
      </main>
      <footer className="public-footer">
        <span>© {new Date().getFullYear()} Universidad Manuela Beltrán · BullyBlock</span>
        <button onClick={onStaffPortal}>
          Acceso de gestión institucional <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  )
}
