import { useEffect, useMemo, useState } from 'react'
import AddTaskIcon from '@mui/icons-material/AddTask'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { createTodo, deleteTodo, getTodos, updateTodo } from './api/todos'
import './App.css'

const LABEL_OPTIONS = [
  'Frontend',
  'Backend',
  'Bug',
  'Feature',
  'Urgent',
  'Low Priority',
]

const EMPTY_FORM = {
  title: '',
  description: '',
  assignee: '',
  labels: [],
}

function App() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTodo, setNewTodo] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)

  const hasTodos = useMemo(() => todos.length > 0, [todos])

  function normalizeLabels(labels) {
    if (!Array.isArray(labels)) {
      return []
    }
    return [...new Set(labels.map((label) => String(label).trim()).filter(Boolean))]
  }

  function normalizeSelectValue(value) {
    if (Array.isArray(value)) {
      return value
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return []
  }

  function clearNewTodoLabels() {
    setNewTodo((prevValue) => ({
      ...prevValue,
      labels: [],
    }))
  }

  function clearEditingLabels() {
    setEditingForm((prevValue) => ({
      ...prevValue,
      labels: [],
    }))
  }

  function buildTodoPayload(formValue, completed) {
    return {
      title: formValue.title.trim(),
      description: formValue.description.trim(),
      assignee: formValue.assignee.trim(),
      labels: normalizeLabels(formValue.labels),
      completed,
    }
  }

  async function fetchTodos() {
    try {
      setLoading(true)
      setError('')
      const data = await getTodos()
      setTodos(data)
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load todos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  async function handleCreateTodo(event) {
    event.preventDefault()
    const title = newTodo.title.trim()
    if (!title) {
      return
    }

    try {
      setSaving(true)
      setError('')
      const created = await createTodo(buildTodoPayload(newTodo, false))
      setTodos((prevTodos) => [...prevTodos, created])
      setNewTodo(EMPTY_FORM)
    } catch (createError) {
      setError(createError.message || 'Failed to create todo.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(todo) {
    setEditingTodo(todo)
    setEditingForm({
      title: todo.title,
      description: todo.description,
      assignee: todo.assignee,
      labels: normalizeLabels(todo.labels),
    })
  }

  function cancelEdit() {
    setEditingTodo(null)
    setEditingForm(EMPTY_FORM)
  }

  async function handleSaveTodo() {
    if (!editingTodo) {
      return
    }

    const title = editingForm.title.trim()
    if (!title) {
      return
    }

    try {
      setSaving(true)
      setError('')
      const updated = await updateTodo(
        editingTodo.id,
        buildTodoPayload(editingForm, editingTodo.completed),
      )
      setTodos((prevTodos) =>
        prevTodos.map((currentTodo) =>
          currentTodo.id === editingTodo.id ? updated : currentTodo,
        ),
      )
      cancelEdit()
    } catch (updateError) {
      setError(updateError.message || 'Failed to update todo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleCompleted(todo) {
    try {
      setSaving(true)
      setError('')
      const updated = await updateTodo(
        todo.id,
        buildTodoPayload(todo, !todo.completed),
      )
      setTodos((prevTodos) =>
        prevTodos.map((currentTodo) =>
          currentTodo.id === todo.id ? updated : currentTodo,
        ),
      )
    } catch (updateError) {
      setError(updateError.message || 'Failed to update todo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTodo(todoId) {
    try {
      setSaving(true)
      setError('')
      await deleteTodo(todoId)
      setTodos((prevTodos) =>
        prevTodos.filter((currentTodo) => currentTodo.id !== todoId),
      )
      if (editingTodo?.id === todoId) {
        cancelEdit()
      }
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete todo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Todo CRUD
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage todo items using your backend API.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleCreateTodo}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                required
                label="Title"
                value={newTodo.title}
                onChange={(event) =>
                  setNewTodo((prevValue) => ({
                    ...prevValue,
                    title: event.target.value,
                  }))
                }
                disabled={saving}
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={newTodo.description}
                onChange={(event) =>
                  setNewTodo((prevValue) => ({
                    ...prevValue,
                    description: event.target.value,
                  }))
                }
                disabled={saving}
              />
              <TextField
                fullWidth
                label="Assignee"
                value={newTodo.assignee}
                onChange={(event) =>
                  setNewTodo((prevValue) => ({
                    ...prevValue,
                    assignee: event.target.value,
                  }))
                }
                disabled={saving}
              />
              <Stack direction="row" spacing={1.5} alignItems="center">
                <FormControl fullWidth>
                  <InputLabel id="labels-select-label">Labels</InputLabel>
                  <Select
                    labelId="labels-select-label"
                    multiple
                    value={newTodo.labels}
                    onChange={(event) =>
                      setNewTodo((prevValue) => ({
                        ...prevValue,
                        labels: normalizeSelectValue(event.target.value),
                      }))
                    }
                    input={<OutlinedInput label="Labels" />}
                    renderValue={(selected) => (
                      <Box className="labels-container">
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                    disabled={saving}
                  >
                    {LABEL_OPTIONS.map((label) => (
                      <MenuItem key={label} value={label}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="text"
                  size="small"
                  onClick={clearNewTodoLabels}
                  disabled={saving || newTodo.labels.length === 0}
                >
                  Clear
                </Button>
              </Stack>
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddTaskIcon />}
                disabled={saving || !newTodo.title.trim()}
              >
                Add
              </Button>
            </Stack>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Box className="centered-loader">
              <CircularProgress />
            </Box>
          ) : null}

          {!loading && !hasTodos ? (
            <Alert severity="info">No todo items yet.</Alert>
          ) : null}

          {!loading && hasTodos ? (
            <List disablePadding>
              {todos.map((todo) => {
                return (
                  <ListItem
                    key={todo.id}
                    divider
                    alignItems="flex-start"
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          aria-label="edit"
                          onClick={() => startEdit(todo)}
                          disabled={saving}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDeleteTodo(todo.id)}
                          disabled={saving}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <Stack className="todo-row" direction="row" alignItems="flex-start">
                      <Checkbox
                        checked={todo.completed}
                        onChange={() => handleToggleCompleted(todo)}
                        disabled={saving}
                        sx={{ mt: 0.5 }}
                      />
                      <ListItemText
                        primary={todo.title}
                        secondary={
                          <Stack spacing={1} sx={{ mt: 0.5 }}>
                            {todo.description ? (
                              <Typography variant="body2" color="text.secondary">
                                {todo.description}
                              </Typography>
                            ) : null}
                            <Typography variant="caption" color="text.secondary">
                              Assignee: {todo.assignee || 'Unassigned'}
                            </Typography>
                            <Box className="labels-container">
                              {todo.labels.length ? (
                                todo.labels.map((label) => (
                                  <Chip key={`${todo.id}-${label}`} label={label} size="small" />
                                ))
                              ) : (
                                <Chip label="No labels" size="small" variant="outlined" />
                              )}
                            </Box>
                          </Stack>
                        }
                        className={todo.completed ? 'todo-text-done' : ''}
                      />
                    </Stack>
                  </ListItem>
                )
              })}
            </List>
          ) : null}

          <Dialog open={Boolean(editingTodo)} onClose={cancelEdit} fullWidth maxWidth="sm">
            <DialogTitle>Edit Todo</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  required
                  label="Title"
                  value={editingForm.title}
                  onChange={(event) =>
                    setEditingForm((prevValue) => ({
                      ...prevValue,
                      title: event.target.value,
                    }))
                  }
                  disabled={saving}
                  fullWidth
                />
                <TextField
                  label="Description"
                  multiline
                  minRows={3}
                  value={editingForm.description}
                  onChange={(event) =>
                    setEditingForm((prevValue) => ({
                      ...prevValue,
                      description: event.target.value,
                    }))
                  }
                  disabled={saving}
                  fullWidth
                />
                <TextField
                  label="Assignee"
                  value={editingForm.assignee}
                  onChange={(event) =>
                    setEditingForm((prevValue) => ({
                      ...prevValue,
                      assignee: event.target.value,
                    }))
                  }
                  disabled={saving}
                  fullWidth
                />
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <FormControl fullWidth>
                    <InputLabel id="edit-labels-select-label">Labels</InputLabel>
                    <Select
                      labelId="edit-labels-select-label"
                      multiple
                      value={editingForm.labels}
                      onChange={(event) =>
                        setEditingForm((prevValue) => ({
                          ...prevValue,
                          labels: normalizeSelectValue(event.target.value),
                        }))
                      }
                      input={<OutlinedInput label="Labels" />}
                      renderValue={(selected) => (
                        <Box className="labels-container">
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      disabled={saving}
                    >
                      {LABEL_OPTIONS.map((label) => (
                        <MenuItem key={label} value={label}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="text"
                    size="small"
                    onClick={clearEditingLabels}
                    disabled={saving || editingForm.labels.length === 0}
                  >
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveTodo}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving || !editingForm.title.trim()}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Paper>
    </Container>
  )
}

export default App
