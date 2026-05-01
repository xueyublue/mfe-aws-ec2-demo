# Todo CRUD Frontend (React + Vite + MUI)

This project is a Todo CRUD frontend built with React, Vite, and Material UI. Each todo item contains:

-   `title`
-   `description`
-   `assignee`
-   `labels` (multi-select)

## Setup

```bash
npm install
npm run dev
```

## Backend API configuration

Create a `.env` file at the project root if your API is not served from the same origin:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_TODOS_PATH=/todos
```

The frontend calls these endpoints:

-   `GET {VITE_API_BASE_URL}{VITE_TODOS_PATH}`
-   `POST {VITE_API_BASE_URL}{VITE_TODOS_PATH}`
-   `PUT {VITE_API_BASE_URL}{VITE_TODOS_PATH}/{id}`
-   `DELETE {VITE_API_BASE_URL}{VITE_TODOS_PATH}/{id}`