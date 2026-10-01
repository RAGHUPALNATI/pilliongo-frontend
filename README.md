# PillionGo — Web App

[![Frontend CI](https://github.com/RAGHUPALNATI/pilliongo-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/RAGHUPALNATI/pilliongo-frontend/actions/workflows/ci.yml)

Next.js frontend for **PillionGo**, a peer-to-peer ride-sharing platform for anyone,
anywhere. Riders request instant or pre-planned rides, drivers offer seats on
routes they're already driving, and everyone splits the cost.

The Spring Boot backend lives in a separate project (`pilliongo`) — see its
README for the API, database and secrets setup.

## Features

- **Instant rides** — request a ride now, or book a driver who's "driving right now" (offers expire after 15 min)
- **Pre-planned carpooling** — drivers publish scheduled routes with 1–6 seats (bikes: 1); riders book one or more seats
- **Live fare estimate** before posting, from fixed fare zones + distance table
- **Ride lifecycle** — accept → start → complete, cash "mark as paid", cancellation with seat release
- **Live map** of driver / rider position during an active ride (Leaflet)
- **Notifications**, **SOS button**, support messages, location requests
- **Auth** — email OTP verification, JWT sessions (auto-logout on expiry), 3-step forgot-password
- **Admin panel** — users, rides (force complete/cancel), fare zones, locations, analytics, SOS alerts

## Tech stack

Next.js 14 (App Router) · React 18 · Tailwind CSS 3 · Axios · React-Leaflet · Lucide icons

## Getting started

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm run dev                  # http://localhost:3000
```

The backend must be running (default `http://localhost:8080`).

## Project structure

```
app/                 pages (App Router)
  plan-ride/         instant + pre-planned marketplace
  rider/  driver/    dashboards and history
  ride/[id]/         live ride status page
  admin/             admin panel
  login/ register/   auth (incl. forgot-password modal)
components/          shared UI (Navbar, Modal, LiveDriverMap, FareEstimate, ...)
context/AuthContext  logged-in user state
hooks/               useDriverDashboard (polling + driver state)
lib/api.js           every backend call + response normalisation
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

## Screenshots

_Add screenshots of the plan-ride page, rider/driver dashboards and admin panel here._
