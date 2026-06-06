# UAT Checklist — Iqraa School Platform

Use this checklist before pilot go-live. Mark each item Pass/Fail with tester name and date.

## Authentication & Security

- [ ] Admin login with valid credentials
- [ ] Parent login with valid credentials
- [ ] Invalid login shows Arabic error (no credential leak)
- [ ] JWT expires and redirects to login
- [ ] Refresh token flow works (`POST /api/auth/refresh`)
- [ ] Admin 2FA setup enforced when `ADMIN_2FA_REQUIRED=true`
- [ ] RoleGuard blocks unauthorized admin routes (fees, users)

## Admin Dashboard

- [ ] Dashboard KPIs load
- [ ] Students CRUD list/search
- [ ] Attendance mark + bulk
- [ ] Grades entry
- [ ] Fees management
- [ ] PDF report endpoints (`/api/pdf/students`)

## Parent Portal

- [ ] Child selector switches data
- [ ] Grades, attendance, homework, schedule
- [ ] Fees summary + **Pay Now** (mock payment)
- [ ] Parent exams page
- [ ] Messages send/receive

## Student Portal (`/student`)

- [ ] Dashboard stats
- [ ] Grades list
- [ ] Homework list
- [ ] Weekly schedule

## Payments (Mock / Sandbox)

- [ ] Create session `POST /api/payments/session`
- [ ] Webhook marks fee paid
- [ ] Receipt `GET /api/payments/receipt/:id`

## Public Site

- [ ] School home `/school`
- [ ] Multi-tenant slug `GET /api/public/school/:slug`
- [ ] Contact form submission

## Ops

- [ ] `GET /api/health` returns ok
- [ ] Backup panel (admin)
- [ ] Docker `docker compose up` builds and serves
- [ ] CI pipeline green on `main`

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| School admin | | | |
| Parent tester | | | |
| Tech lead | | | |
