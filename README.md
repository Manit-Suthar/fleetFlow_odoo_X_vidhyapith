# FleetFlow — Odoo x Vidhyapith

A fleet management application built with the **PERN Stack** (PostgreSQL, Express, React, Node.js).

## Team

| Member | Pages |
|---|---|
| Manit | Pages 1-2 |
| Fenil | Pages 3-4 |
| Vatsal | Pages 5-6 |
| Manasvi | Pages 7-8 |

## Tech Stack

- **Frontend:** React (Vite) + React Router + Axios
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL (via `pg`)

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL installed and running

### Setup

```bash
# Clone the repo
git clone https://github.com/Manit-Suthar/fleetFlow_odoo_X_vidhyapith.git
cd fleetFlow_odoo_X_vidhyapith

# Backend
cd backend
cp .env.example .env    # Edit with your DB credentials
npm install
npm run dev

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

## Branching

- `main` — production-ready (protected)
- `dev` — integration branch
- `feature/pages-X-Y` — individual feature branches
