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
  TablePagination,
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
  const [successMessage, setSuccessMessage] = useState('')
  const [newTodo, setNewTodo] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [editingForm, setEditingForm] = useState(EMPTY_FORM)
  const [todoToDelete, setTodoToDelete] = useState(null)
  const [todoToComplete, setTodoToComplete] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const hasTodos = useMemo(() => todos.length > 0, [todos])
  const pagedTodos = useMemo(() => {
    const startIndex = page * rowsPerPage
    return todos.slice(startIndex, startIndex + rowsPerPage)
  }, [page, rowsPerPage, todos])

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
      setSuccessMessage('')
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

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(todos.length / rowsPerPage) - 1)
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [page, rowsPerPage, todos.length])

  function openCreateDialog() {
    setIsCreateDialogOpen(true)
  }

  function closeCreateDialog() {
    setIsCreateDialogOpen(false)
    setNewTodo(EMPTY_FORM)
  }

  async function handleCreateTodo() {
    const title = newTodo.title.trim()
    if (!title) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')
      const created = await createTodo(buildTodoPayload(newTodo, false))
      setTodos((prevTodos) => [...prevTodos, created])
      closeCreateDialog()
      setSuccessMessage('Added successfully.')
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

  function requestDeleteTodo(todo) {
    setTodoToDelete(todo)
  }

  function cancelDeleteTodo() {
    setTodoToDelete(null)
  }

  function requestCompleteTodo(todo) {
    setTodoToComplete(todo)
  }

  function cancelCompleteTodo() {
    setTodoToComplete(null)
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
      setSuccessMessage('')
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
      setSuccessMessage('Updated successfully.')
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
      setSuccessMessage('')
      const updated = await updateTodo(
        todo.id,
        buildTodoPayload(todo, !todo.completed),
      )
      setTodos((prevTodos) =>
        prevTodos.map((currentTodo) =>
          currentTodo.id === todo.id ? updated : currentTodo,
        ),
      )
      setSuccessMessage(
        updated.completed ? 'Marked as completed successfully.' : 'Marked as active successfully.',
      )
    } catch (updateError) {
      setError(updateError.message || 'Failed to update todo.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmCompleteTodo() {
    if (!todoToComplete?.id) {
      return
    }

    await handleToggleCompleted(todoToComplete)
    setTodoToComplete(null)
  }

  async function handleDeleteTodo(todoId) {
    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')
      await deleteTodo(todoId)
      setTodos((prevTodos) =>
        prevTodos.filter((currentTodo) => currentTodo.id !== todoId),
      )
      if (editingTodo?.id === todoId) {
        cancelEdit()
      }
      setSuccessMessage('Deleted successfully.')
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete todo.')
    } finally {
      setSaving(false)
      setTodoToDelete(null)
    }
  }

  function handleChangePage(_event, nextPage) {
    setPage(nextPage)
  }

  function handleChangeRowsPerPage(event) {
    setRowsPerPage(Number(event.target.value))
    setPage(0)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="flex-end" alignItems="flex-start">
            <Button
              variant="contained"
              startIcon={<AddTaskIcon />}
              onClick={openCreateDialog}
              disabled={saving}
            >
              Add New Todo Item
            </Button>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

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
              {pagedTodos.map((todo) => {
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
                          onClick={() => requestDeleteTodo(todo)}
                          disabled={saving}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <Stack className="todo-row" direction="row" alignItems="flex-start">
                      <Checkbox
                        className="todo-checkbox"
                        checked={todo.completed}
                        onChange={() => {
                          if (todo.completed) {
                            handleToggleCompleted(todo)
                            return
                          }
                          requestCompleteTodo(todo)
                        }}
                        disabled={saving}
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

          {!loading && hasTodos ? (
            <TablePagination
              component="div"
              count={todos.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          ) : null}

          <Dialog open={isCreateDialogOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
            <DialogTitle>Add Todo</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  required
                  fullWidth
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
                    <InputLabel id="create-labels-select-label">Labels</InputLabel>
                    <Select
                      labelId="create-labels-select-label"
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
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeCreateDialog} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTodo}
                variant="contained"
                startIcon={<AddTaskIcon />}
                disabled={saving || !newTodo.title.trim()}
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>

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

          <Dialog
            open={Boolean(todoToDelete)}
            onClose={cancelDeleteTodo}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>Delete Todo</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to delete{' '}
                <strong>{todoToDelete?.title || 'this todo'}</strong>?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelDeleteTodo} disabled={saving}>
                Cancel
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => handleDeleteTodo(todoToDelete?.id)}
                disabled={saving || !todoToDelete?.id}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={Boolean(todoToComplete)}
            onClose={cancelCompleteTodo}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>Mark as Completed</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                Mark <strong>{todoToComplete?.title || 'this todo'}</strong> as completed?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelCompleteTodo} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={confirmCompleteTodo}
                disabled={saving || !todoToComplete?.id}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Paper>
    </Container>
  )
}

export default App
