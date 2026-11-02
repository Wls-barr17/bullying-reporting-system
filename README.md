# BullyBlock UMB

BullyBlock is a support and case-reporting platform for the Universidad Manuela Beltrán community. Students can report bullying and other campus safety concerns, request guidance, and follow up privately. Authorized staff can review cases, coordinate appointments, and document their work.

## What you can do

- Submit a confidential report and follow its progress with a private tracking code.
- Create a student account to request appointments and review reports linked to that account.
- Edit your profile and upload a profile picture.
- Request a counseling appointment and see the assigned professional when one is selected.
- Manage reports and appointments from a staff CRM workspace.
- Assign appointments to registered members of the psychosocial team, review appointment history, and export case lists to CSV.
- Search registered accounts and manage roles from the administrator-only role panel.
- Switch between light and dark themes.

## The two portals

The public landing page explains the service before a visitor enters either workspace.

| Page | URL | Who it is for |
|---|---|---|
| About and welcome | `http://localhost:8081/` | Anyone who wants to learn about BullyBlock |
| Student reporting portal | `http://localhost:8081/reportes` | Students and report submitters |
| Institutional CRM | `http://localhost:8081/gestion` | Authorized administrators and psychosocial staff |

The CRM has its own navigation and dashboard. The backend checks the signed-in account and its current role before returning staff data.

## Start with Docker

Docker Compose starts the frontend, Spring Boot API, and MySQL database together.

### 1. Start Docker Desktop

Open Docker Desktop and wait until its engine is running. On Windows, this project needs the Linux container engine. If Docker reports that it cannot find `dockerDesktopLinuxEngine`, the engine is not ready yet.

You can check the engine from PowerShell:

```powershell
docker desktop status
docker desktop engine ls
```

If needed, start Docker Desktop and select the Linux engine:

```powershell
docker desktop start
docker desktop engine use linux
docker info
```

Wait for `docker info` to show server details before continuing.

### 2. Open a terminal in the project folder

```powershell
cd C:\Users\Yunio\Downloads\university-bullying-reporting-system
```

Run this from the folder that contains `compose.yaml`.

### 3. Build and start the services

```powershell
docker compose up --build
```

The first build downloads container images and dependencies, so it may take several minutes. Keep this terminal open while using the application. The frontend waits for the backend to become available before starting.

If the backend exits or account creation fails, inspect its logs in another terminal:

```powershell
docker compose logs --no-color --tail=150 backend
```

To inspect MySQL startup and connection logs:

```powershell
docker compose logs --no-color --tail=150 database
```

### 4. Open BullyBlock

Visit **http://localhost:8081/**. From the landing page, choose the student portal or institutional CRM.

The local `.env` file configures an initial administrator account. Its email is `admin.crm@umb.edu.co`; the generated password is stored in `.env`. Open **http://localhost:8081/gestion** and sign in with those credentials. The `.env` file is ignored by Git and must not be committed. The bootstrap account is created only when that email is unused; if the email already belongs to a non-admin account, the backend stops with a clear configuration error instead of silently elevating it.

### 5. Stop the application

Press `Ctrl+C` in the Compose terminal. Start the services again with:

```powershell
docker compose up
```

MySQL data is stored in the `bullyblock-db` volume. `docker compose down` removes the containers and keeps the database volume. **`docker compose down -v` also deletes the database and its data.**

## Run in development mode

Use this setup when editing the backend or frontend without rebuilding the Docker images.

You need Java 21, Maven 3.9 or later, Node.js 24, and npm. Docker Desktop is only needed if you want to use MySQL. Without Docker, the backend uses an in-memory H2 database.

1. In a terminal opened in `backend/`, start the API:

   ```powershell
   mvn spring-boot:run
   ```

   The API runs at `http://localhost:8080`.

2. In a second terminal opened in `frontend/`, install dependencies and start Vite:

   ```powershell
   npm ci
   npm run dev
   ```

3. Open **http://localhost:5173**. Vite forwards `/api` requests to the backend.

H2 development data disappears when the backend stops. To use MySQL, activate the `mysql` profile and configure `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `COOKIE_SECURE`.

## A suggested first visit

1. Read the landing page to learn how reports and support work.
2. Open the student portal. Create an account if you want account-linked reports or an appointment. Public registration always creates a `STUDENT` account.
3. To submit a confidential report, leave the confidential option selected. Save the private tracking code shown after submission.
4. Open **My reports** and enter that code to view the status and updates shared by the staff team.
5. To request guidance, sign in and choose a preferred date, time, and appointment format.

A confidential report is not linked to the student's account. Anyone who has its tracking code can see its status and reporter-visible updates, so keep that code private.

## Staff roles and account management

The public registration form cannot create staff or administrator accounts. A person must register first. An `ADMIN` can then open **Users and roles** in the CRM, find the registered account by email, and assign one of these roles:

- `STUDENT` — student and report submitter.
- `SUPPORT` — psychosocial team member who can manage reports and appointments.
- `ADMIN` — institutional administrator who can also manage account roles.

Role changes are written to an audit history with the target account, the previous and new roles, the acting administrator, and the change time. The system prevents removing the final administrator. Users need to sign in again to receive their new role. Staff API requests also check the role currently stored in the database.

Appointment assignment is limited to registered accounts with the `SUPPORT` role. If the psychosocial team member is not listed, an administrator must first assign that account the `SUPPORT` role.

For controlled database administration, an existing account can also be promoted manually:

```sql
UPDATE accounts
SET account_role = 'ADMIN'
WHERE email = 'institutional-account@umb.edu.co';
```

Never expose this database operation as a public API route.

## API overview

All routes are under `/api`. Mutating requests use the session and CSRF protection configured by the backend.

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/auth/csrf` | Public | Initialize a CSRF token for browser requests |
| `POST` | `/api/auth/register` | Public | Create a student account and sign in |
| `POST` | `/api/auth/login` | Public | Sign in |
| `GET` | `/api/auth/session` | Signed-in account | Get the current account |
| `PATCH` | `/api/auth/profile` | Signed-in account | Update the account name and profile picture |
| `POST` | `/api/auth/logout` | Signed-in account | Sign out |
| `POST` | `/api/cases` | Public | Submit a confidential report |
| `POST` | `/api/cases/track` | Private tracking code | View report status and reporter-visible updates |
| `GET` | `/api/cases/mine` | Signed-in account | List reports linked to the account |
| `GET`, `POST` | `/api/appointments` | Signed-in account | List or request the account's appointments |
| `GET` | `/api/admin/cases` | `SUPPORT` or `ADMIN` | List reports for staff review |
| `PATCH` | `/api/admin/cases/{id}/status` | `SUPPORT` or `ADMIN` | Change report status and add a visible update |
| `GET`, `POST` | `/api/admin/cases/{id}/updates` | `SUPPORT` or `ADMIN` | Read or add report updates |
| `GET` | `/api/admin/appointments` | `SUPPORT` or `ADMIN` | List appointment requests |
| `GET` | `/api/admin/appointments/psychologists` | `SUPPORT` or `ADMIN` | List registered psychosocial staff for assignment |
| `PATCH` | `/api/admin/appointments/{id}/status` | `SUPPORT` or `ADMIN` | Confirm, complete, or cancel an appointment |
| `PATCH` | `/api/admin/appointments/{id}/assignment` | `SUPPORT` or `ADMIN` | Assign a registered psychosocial staff member |
| `GET` | `/api/admin/accounts` | `ADMIN` | Search registered accounts |
| `PATCH` | `/api/admin/accounts/role` | `ADMIN` | Change the role of a registered account |
| `GET` | `/api/admin/accounts/role-history` | `ADMIN` | Review the role-change audit history |
| `GET` | `/actuator/health` | Public | Check backend health |

## Project structure

- `frontend/` — React portals, shared components, styles, and the API client.
- `backend/` — Spring Boot REST API, organized into authentication, cases, appointments, security, and common error handling.
- `backend/src/main/resources/db/migration/` — Flyway migrations for MySQL and H2.
- `compose.yaml` — MySQL, backend, and frontend services.

The backend uses Spring Boot 4.1.2 and Java 21. See the official [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html) and [starter reference](https://docs.spring.io/spring-boot/reference/using/build-systems.html).

## Privacy and deployment

Passwords are hashed with BCrypt. Browser sessions use HTTP-only cookies, CSRF protection, and role-based authorization. Confidential reports are stored without a link to the reporter account; their tracking codes contain 192 bits of randomness. Personal reports and appointments are scoped to the signed-in account.

Compose credentials are for local development. Before using real university data, configure unique secrets, HTTPS, and `COOKIE_SECURE=true`. The university should also approve staff access, retention periods, backups, incident handling, and the minimum information needed for case review. Avoid collecting unnecessary clinical details.
