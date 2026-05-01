const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || ''
const TODOS_PATH = import.meta.env.VITE_TODOS_PATH?.trim() || '/todos'

function buildUrl(pathSuffix = '') {
  const base = API_BASE_URL.replace(/\/+$/, '')
  const path = `${TODOS_PATH.replace(/\/+$/, '')}${pathSuffix}`
  return `${base}${path}`
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (data?.message) {
        message = data.message
      }
    } catch {
      // Ignore parsing errors and keep fallback message.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function normalizeTodo(rawTodo) {
  const labels = Array.isArray(rawTodo.labels)
    ? rawTodo.labels
    : Array.isArray(rawTodo.tags)
      ? rawTodo.tags
      : []

  return {
    id: rawTodo.id ?? rawTodo._id ?? rawTodo.todoId,
    title: rawTodo.title ?? rawTodo.name ?? rawTodo.text ?? '',
    description: rawTodo.description ?? rawTodo.details ?? '',
    assignee: rawTodo.assignee ?? rawTodo.owner ?? '',
    labels: labels.map((label) => String(label)).filter(Boolean),
    completed: Boolean(rawTodo.completed ?? rawTodo.isCompleted ?? rawTodo.done),
    raw: rawTodo,
  }
}

export async function getTodos() {
  const data = await request(buildUrl())
  const list = Array.isArray(data) ? data : data?.items ?? []
  return list.map(normalizeTodo)
}

export async function createTodo(payload) {
  const data = await request(buildUrl(), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return normalizeTodo(data)
}

export async function updateTodo(todoId, payload) {
  const data = await request(buildUrl(`/${todoId}`), {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return normalizeTodo(data)
}

export async function deleteTodo(todoId) {
  await request(buildUrl(`/${todoId}`), {
    method: 'DELETE',
  })
}
