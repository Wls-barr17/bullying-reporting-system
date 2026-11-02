# BullyBlock UMB

Un espacio digital de la Universidad Manuela Beltrán para pedir orientación y reportar situaciones de acoso o problemas de convivencia. La idea es que cualquier estudiante pueda pedir ayuda con claridad y cuidado: los reportes son confidenciales por defecto y se pueden seguir con un código privado.

## ¿Qué puedes hacer?

- Crear una cuenta para solicitar citas de orientación y revisar los reportes asociados a ella.
- Enviar un reporte confidencial sin vincularlo a tu cuenta. Al enviarlo, guarda el código que aparece: lo necesitarás para consultar el seguimiento.
- Consultar el estado de un reporte y leer las actualizaciones que el equipo haya compartido contigo.
- Gestionar reportes y citas desde una cuenta institucional con rol `SUPPORT` o `ADMIN`.
- Cambiar entre tema claro y oscuro, editar el nombre y subir una foto de perfil.
- Asignar una persona profesional a cada cita, revisar pendientes e historial y exportar reportes a CSV.
- Buscar casos y revisar indicadores de gestión desde el panel institucional.

La portada informativa está en **http://localhost:8081/**. El espacio estudiantil está en **/reportes** y el CRM institucional en **/gestion**. Son dos interfaces separadas; la API valida la sesión y el rol antes de entregar datos del CRM.

## La forma más rápida de iniciar

Esta opción levanta la página, el backend y MySQL juntos con Docker.

### 1. Inicia Docker Desktop

Abre Docker Desktop y espera hasta que indique que el motor está activo. En Windows, el proyecto necesita el motor de contenedores Linux. Si Docker se queja de que no encuentra `dockerDesktopLinuxEngine`, el motor todavía no está disponible para la terminal.

Puedes revisar el estado en PowerShell:

```powershell
docker desktop status
docker desktop engine ls
```

Si hace falta, inicia Docker Desktop y cambia al motor Linux:

```powershell
docker desktop start
docker desktop engine use linux
docker info
```

Espera a que `docker info` muestre los detalles del servidor antes de continuar.

### 2. Abre una terminal en la carpeta del proyecto

La terminal debe estar en la misma carpeta donde está `compose.yaml`, por ejemplo:

```powershell
cd C:\Users\Yunio\Downloads\university-bullying-reporting-system
```

### 3. Inicia la aplicación

```powershell
docker compose up --build
```

La primera vez Docker descarga las imágenes y construye los servicios, así que puede tardar unos minutos. Deja esa terminal abierta mientras usas la aplicación.

La página espera a que el backend esté disponible antes de arrancar. Si la web abre pero aparece un error al iniciar sesión o crear una cuenta, revisa el motivo del cierre del backend en otra terminal:

```powershell
docker compose logs --no-color --tail=150 backend
```

Para ver también el estado de MySQL:

```powershell
docker compose logs --no-color --tail=150 database
```

### 4. Abre BullyBlock

Entra a **http://localhost:8081** en tu navegador. Desde allí puedes crear una cuenta, solicitar orientación o enviar un reporte confidencial.

La cuenta inicial de administración se crea desde las variables `APP_BOOTSTRAP_ADMIN_EMAIL` y `APP_BOOTSTRAP_ADMIN_PASSWORD` del archivo local `.env`. En este entorno, el correo inicial es `admin.crm@umb.edu.co`; consulta la contraseña generada en `.env` y entra en **http://localhost:8081/gestion**. El archivo `.env` está excluido de Git. No reutilices esta contraseña en otros sistemas.

### 5. Detén la aplicación cuando termines

En la terminal de Docker, presiona `Ctrl+C`. Para levantarla otra vez, ejecuta `docker compose up` desde la carpeta del proyecto.

Los datos de MySQL se conservan en el volumen `bullyblock-db`. `docker compose down` detiene y elimina los contenedores, pero conserva ese volumen. **`docker compose down -v` también borra la base de datos y sus datos.**

## Ejecutar en modo desarrollo

Usa esta opción si vas a editar el frontend o backend y quieres que los cambios se reflejen sin reconstruir Docker.

Necesitas Java 21, Maven 3.9 o superior, Node.js 24, npm y Docker Desktop solo si quieres usar MySQL. Sin Docker, el backend usa H2 en memoria.

1. Abre una terminal en `backend/` y ejecuta:

   ```powershell
   mvn spring-boot:run
   ```

   La API queda disponible en `http://localhost:8080`.

2. Abre otra terminal en `frontend/` y ejecuta:

   ```powershell
   npm ci
   npm run dev
   ```

3. Abre **http://localhost:5173**. Vite reenvía las llamadas `/api` al backend.

Con H2 en memoria, los datos de desarrollo desaparecen al detener el backend. Para conectarte a MySQL, configura el perfil `mysql` y las variables `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` y `COOKIE_SECURE`.

## Recorrido sugerido

1. Crea una cuenta para solicitar orientación o ver los reportes que hayas asociado a ella.
2. En **Reportar un caso**, deja marcada la opción confidencial si no quieres vincular el reporte a tu cuenta.
3. Al terminar, guarda el código privado que aparece en pantalla.
4. En **Mis reportes**, pega ese código para consultar el estado y los mensajes del equipo.
5. Para pedir una cita de orientación, inicia sesión y selecciona una fecha, hora y modalidad.

Un reporte confidencial no aparece en la lista de reportes de la cuenta. Se consulta usando su código privado. No compartas ese código: quien lo tenga puede ver el estado y las actualizaciones que el equipo haya marcado como visibles.

## Roles de gestión

El registro público solo crea cuentas con rol `STUDENT`. Un `ADMIN` puede abrir **Usuarios y roles** en `/gestion`, buscar una cuenta por correo y asignarle rol de estudiante, equipo psicosocial (`SUPPORT`) o administración (`ADMIN`). La persona debe registrarse primero. Cada cambio se guarda en una bitácora con la cuenta que hizo el cambio, rol anterior, rol nuevo y fecha. El sistema impide quitar el rol al último administrador. Las sesiones deben volver a iniciar para recibir su rol nuevo; los permisos de la API comprueban el rol vigente al atender rutas de gestión.

En una instalación nueva y solo como operación de administración controlada, se puede promover una cuenta ya creada con:

```sql
UPDATE accounts
SET account_role = 'ADMIN'
WHERE email = 'cuenta-institucional@umb.edu.co';
```

No expongas esta operación como una ruta pública de la API.

## API disponible

| Método | Ruta | Quién puede usarla | Para qué sirve |
|---|---|---|---|
| `GET` | `/api/auth/csrf` | Público | Preparar solicitudes protegidas contra CSRF |
| `POST` | `/api/auth/register` | Público | Crear una cuenta e iniciar sesión |
| `POST` | `/api/auth/login` | Público | Iniciar sesión |
| `GET` | `/api/auth/session` | Cuenta autenticada | Consultar la cuenta activa |
| `PATCH` | `/api/auth/profile` | Cuenta autenticada | Actualizar el nombre y la foto de perfil |
| `POST` | `/api/auth/logout` | Cuenta autenticada | Cerrar sesión |
| `POST` | `/api/cases` | Público | Crear un reporte confidencial |
| `POST` | `/api/cases/track` | Con el código privado | Consultar estado e hitos visibles |
| `GET` | `/api/cases/mine` | Cuenta autenticada | Listar reportes vinculados a esa cuenta |
| `GET`, `POST` | `/api/appointments` | Cuenta autenticada | Consultar o solicitar citas propias |
| `GET` | `/api/admin/cases` | `SUPPORT` o `ADMIN` | Consultar la bandeja de reportes |
| `PATCH` | `/api/admin/cases/{id}/status` | `SUPPORT` o `ADMIN` | Cambiar estado y añadir una actualización visible |
| `GET`, `POST` | `/api/admin/cases/{id}/updates` | `SUPPORT` o `ADMIN` | Leer el historial completo o añadir una actualización |
| `GET` | `/api/admin/appointments` | `SUPPORT` o `ADMIN` | Consultar solicitudes de orientación |
| `GET` | `/api/admin/appointments/psychologists` | `SUPPORT` o `ADMIN` | Ver cuentas del equipo psicosocial para asignar citas |
| `PATCH` | `/api/admin/appointments/{id}/status` | `SUPPORT` o `ADMIN` | Confirmar, completar o cancelar una cita |
| `PATCH` | `/api/admin/appointments/{id}/assignment` | `SUPPORT` o `ADMIN` | Asignar a una persona profesional |
| `GET` | `/api/admin/accounts` | `ADMIN` | Buscar cuentas registradas |
| `PATCH` | `/api/admin/accounts/role` | `ADMIN` | Cambiar el rol de una cuenta registrada |
| `GET` | `/api/admin/accounts/role-history` | `ADMIN` | Consultar la bitácora de cambios de rol |
| `GET` | `/actuator/health` | Público | Consultar el estado del backend |

## Cómo está organizado

- `frontend/`: interfaz React, componentes, estilos y cliente de la API.
- `backend/`: API Spring Boot organizada en cuentas, reportes, citas, seguridad y errores.
- `backend/src/main/resources/db/migration/`: cambios de esquema de MySQL/H2 gestionados por Flyway.
- `compose.yaml`: servicios de MySQL, backend y frontend.

El backend usa Spring Boot 4.1.2 y Java 21. Spring Boot 4 requiere Java 17 o superior, y el starter `webmvc` proporciona Spring MVC para la API REST. Consulta los [requisitos oficiales](https://docs.spring.io/spring-boot/system-requirements.html) y la [referencia de starters](https://docs.spring.io/spring-boot/reference/using/build-systems.html).

## Privacidad y despliegue

Las contraseñas se guardan con BCrypt. La aplicación usa sesiones, cookies HTTP-only, protección CSRF y permisos por rol. Los reportes confidenciales no guardan vínculo con la cuenta; el código aleatorio de seguimiento tiene 192 bits. Las citas y listas personales solo se consultan desde la cuenta correspondiente.

Los valores de contraseña que trae Compose son solo para desarrollo local. Antes de usar datos reales, configura secretos propios, HTTPS y `COOKIE_SECURE=true`; además, la universidad debe aprobar los roles, la retención de datos, las copias de respaldo, el control de acceso y los procedimientos de atención de incidentes. Evita incluir información clínica que no sea necesaria.
