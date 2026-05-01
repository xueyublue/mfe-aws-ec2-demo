# Todo CRUD Frontend (React + Vite + MUI)

This project is a Todo CRUD frontend built with React, Vite, and Material UI. Each todo item contains:

-   `title`
-   `description`
-   `assignee`
-   `labels` (multi-select)

## Prerequisites

-   Node.js 20+ (LTS recommended)
-   npm 10+

## Local Setup

```bash
npm install
npm run dev
```

## Backend API configuration

Create a `.env` file at the project root if your API is not served from the same origin:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_TODOS_PATH=/api/todos
```

Important:

-   Vite only reads env values when the dev server starts. If `.env` changes, restart with `npm run dev`.
-   In the app dialog, `(not set)` means the build/dev process did not receive one or both `VITE_*` variables.

The frontend calls these endpoints:

-   `GET {VITE_API_BASE_URL}{VITE_TODOS_PATH}`
-   `POST {VITE_API_BASE_URL}{VITE_TODOS_PATH}`
-   `PUT {VITE_API_BASE_URL}{VITE_TODOS_PATH}/{id}`
-   `DELETE {VITE_API_BASE_URL}{VITE_TODOS_PATH}/{id}`

## Deployment Manuals

-   EC2 setup (Windows + macOS): `docs/ec2-setup-manual.md`
-   CI/CD setup (Windows + macOS): `docs/cicd-setup-manual.md`

For GitHub Actions deployment, keep this rule in mind:

-   `VITE_API_BASE_URL` and `VITE_TODOS_PATH` must be configured as **Repository variables** (not Repository secrets), because the workflow uses `${{ vars.VITE_API_BASE_URL }}` and `${{ vars.VITE_TODOS_PATH }}`.

## Quick Troubleshooting

-   App shows `VITE_API_BASE_URL` / `VITE_TODOS_PATH` as `(not set)` in local dev: check `.env`, then restart `npm run dev`.
-   App shows `(not set)` after GitHub deployment: check `Settings` -> `Secrets and variables` -> `Actions` -> `Variables` -> **Repository variables** for both `VITE_*`, then rerun workflow.