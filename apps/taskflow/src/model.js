export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'taskflow:v1';
export const STATUS = ['todo', 'doing', 'done'];
export const PRIORITIES = ['high', 'medium', 'low'];
export const PROJECT_COLORS = ['#2f9361', '#d79a08', '#236de5', '#8b5bc7', '#c85773', '#607d8b'];
export const LIMITS = { title: 160, description: 2000, projectName: 60, tasks: 1000, projects: 50 };
export const BACKUP_LIMIT_BYTES = 10_000_000;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function localDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200) return false;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function addDays(value, days) {
  if (!isValidDate(value) || !Number.isInteger(days)) throw new Error('Enter a valid date.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + days);
  const result = localDate(date);
  if (!isValidDate(result)) throw new Error('The date is outside the supported range.');
  return result;
}

export function formatDueDate(value, today = localDate()) {
  if (!isValidDate(value)) return 'No due date';
  if (value === today) return 'Today';
  if (value === addDays(today, 1)) return 'Tomorrow';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...(year !== Number(today.slice(0, 4)) ? { year: 'numeric' } : {}) }).format(new Date(year, month - 1, day, 12));
}

export function isOverdue(task, today = localDate()) {
  return task.status !== 'done' && task.dueDate !== null && task.dueDate < today;
}

function requireText(value, name, maximum, allowEmpty = false) {
  if (typeof value !== 'string') throw new Error(`${name} must be text.`);
  const result = value.trim();
  if (!allowEmpty && !result) throw new Error(`${name} is required.`);
  if (result.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer.`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(result)) throw new Error(`${name} contains unsupported control characters.`);
  // Valid Unicode keeps every maximum-sized workspace below the backup byte limit.
  for (let index = 0; index < result.length; index += 1) {
    const unit = result.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = result.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error(`${name} contains invalid Unicode text.`);
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new Error(`${name} contains invalid Unicode text.`);
    }
  }
  return result;
}

function requireId(value) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new Error('A record has an invalid ID.');
  return value;
}

function requireTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error('A task has an invalid timestamp.');
  }
  return value;
}

function requireObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object.`);
  return value;
}

function validateProject(project) {
  requireObject(project, 'Project');
  const color = project.color;
  if (typeof color !== 'string' || !COLOR_PATTERN.test(color)) throw new Error('Choose a valid project color.');
  const id = requireId(project.id);
  if (['all', 'today', 'completed'].includes(id)) throw new Error('A project uses a reserved workspace ID.');
  return { id, name: requireText(project.name, 'Project name', LIMITS.projectName), color: color.toLowerCase() };
}

function validateTaskFields(task, projects) {
  const title = requireText(task.title, 'Task title', LIMITS.title);
  const description = requireText(task.description, 'Description', LIMITS.description, true);
  if (!STATUS.includes(task.status)) throw new Error('Choose a valid task status.');
  if (!PRIORITIES.includes(task.priority)) throw new Error('Choose a valid priority.');
  if (task.projectId !== null && !projects.some((project) => project.id === task.projectId)) throw new Error('Choose an existing project.');
  if (task.dueDate !== null && !isValidDate(task.dueDate)) throw new Error('Enter a valid due date.');
  return { title, description, status: task.status, priority: task.priority, projectId: task.projectId, dueDate: task.dueDate };
}

// A backup is copied into a known schema instead of trusting arbitrary JSON fields.
export function validateState(value) {
  requireObject(value, 'Backup');
  if (value.version !== SCHEMA_VERSION) throw new Error('This backup uses an unsupported TaskFlow version.');
  if (!Array.isArray(value.projects) || !Array.isArray(value.tasks)) throw new Error('This is not a valid TaskFlow backup.');
  if (value.projects.length > LIMITS.projects || value.tasks.length > LIMITS.tasks) throw new Error('This backup exceeds the workspace limit.');
  const projects = value.projects.map(validateProject);
  if (new Set(projects.map((project) => project.id)).size !== projects.length) throw new Error('The backup contains duplicate project IDs.');
  if (new Set(projects.map((project) => project.name.toLowerCase())).size !== projects.length) throw new Error('The backup contains duplicate project names.');
  const tasks = value.tasks.map((task) => {
    requireObject(task, 'Task');
    const fields = validateTaskFields(task, projects);
    const createdAt = requireTimestamp(task.createdAt);
    const updatedAt = requireTimestamp(task.updatedAt);
    if (updatedAt < createdAt) throw new Error('A task was updated before it was created.');
    const completedAt = task.completedAt === null ? null : requireTimestamp(task.completedAt);
    if ((fields.status === 'done') !== (completedAt !== null)) throw new Error('A task has an inconsistent completion date.');
    if (completedAt !== null && (completedAt < createdAt || completedAt > updatedAt)) throw new Error('A task has an invalid completion date.');
    return { id: requireId(task.id), ...fields, createdAt, updatedAt, completedAt };
  });
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) throw new Error('The backup contains duplicate task IDs.');
  return { version: SCHEMA_VERSION, projects, tasks };
}

export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > BACKUP_LIMIT_BYTES || new TextEncoder().encode(text).length > BACKUP_LIMIT_BYTES) throw new Error('Choose a TaskFlow JSON backup smaller than 10 MB.');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('The backup is not valid JSON.'); }
  return validateState(value);
}

export function serializeBackup(state) {
  return JSON.stringify(validateState(state), null, 2);
}

function createId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}-${random}`;
}

function actionTime(action) {
  return requireTimestamp(action.now ?? new Date().toISOString());
}

export function createSeedState(today = localDate()) {
  if (!isValidDate(today)) throw new Error('Enter a valid seed date.');
  const atHour = (value, hour) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, hour).toISOString();
  };
  const samples = [
    ['Map the new homepage', 'Outline the structure and key sections for the new homepage.', 'website', 'high', 'todo', 2],
    ['Practice custom hooks', 'Build a few small examples to get more comfortable with hooks.', 'react', 'medium', 'todo', 3],
    ['Plan the week ahead', 'Review upcoming tasks and set priorities for the week.', 'personal', 'low', 'todo', 4],
    ['Build the component library', 'Create reusable UI components for the new design system.', 'website', 'high', 'doing', 1],
    ['Connect state to the UI', 'Integrate global state and wire it up to the main views.', 'react', 'medium', 'doing', 2],
    ['Review responsive layouts', 'Test key pages at different breakpoints and refine styles.', 'website', 'medium', 'doing', 3],
    ['Define the color palette', 'Choose a clean, accessible color palette for the new site.', 'website', 'low', 'done', 0],
    ['Set up the React project', 'Create a new Vite project and configure the essential tools.', 'react', 'medium', 'done', 0],
  ];
  return {
    version: SCHEMA_VERSION,
    projects: [
      { id: 'website', name: 'Website redesign', color: '#2f9361' },
      { id: 'react', name: 'Learning React', color: '#d79a08' },
      { id: 'personal', name: 'Personal', color: '#236de5' },
    ],
    tasks: samples.map(([title, description, projectId, priority, status, days], index) => {
      const createdAt = atHour(addDays(today, -1 - index), 9);
      const completedAt = status === 'done' ? atHour(today, 0) : null;
      return { id: `sample-${index + 1}`, title, description, projectId, priority, status, dueDate: addDays(today, days), createdAt, updatedAt: completedAt ?? createdAt, completedAt };
    }),
  };
}

// All edits return new arrays and preserve the previous state for React and tests.
export function taskReducer(state, action) {
  requireObject(action, 'Action');
  switch (action.type) {
    case 'addTask': {
      if (state.tasks.length >= LIMITS.tasks) throw new Error('The workspace can contain up to 1,000 tasks.');
      const input = requireObject(action.task, 'Task');
      const fields = validateTaskFields({ description: '', status: 'todo', priority: 'medium', projectId: null, dueDate: null, ...input }, state.projects);
      const id = requireId(input.id ?? createId('task'));
      if (state.tasks.some((task) => task.id === id)) throw new Error('A task with this ID already exists.');
      const now = actionTime(action);
      const task = { id, ...fields, createdAt: now, updatedAt: now, completedAt: fields.status === 'done' ? now : null };
      return { ...state, tasks: [task, ...state.tasks] };
    }
    case 'updateTask': {
      const current = state.tasks.find((task) => task.id === action.id);
      if (!current) return state;
      const changes = requireObject(action.changes, 'Task changes');
      const input = { ...current };
      for (const key of ['title', 'description', 'status', 'priority', 'projectId', 'dueDate']) {
        if (Object.hasOwn(changes, key)) input[key] = changes[key];
      }
      const fields = validateTaskFields(input, state.projects);
      if (Object.keys(fields).every((key) => fields[key] === current[key])) return state;
      const now = actionTime(action);
      // Keep timestamps consistent if the device clock moves backwards.
      const updatedAt = now < current.updatedAt ? current.updatedAt : now;
      const completedAt = fields.status === 'done' ? current.completedAt ?? updatedAt : null;
      const task = { ...current, ...fields, updatedAt, completedAt };
      return { ...state, tasks: state.tasks.map((item) => item.id === action.id ? task : item) };
    }
    case 'deleteTask': {
      if (!state.tasks.some((task) => task.id === action.id)) return state;
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) };
    }
    case 'addProject': {
      if (state.projects.length >= LIMITS.projects) throw new Error('The workspace can contain up to 50 projects.');
      const input = requireObject(action.project, 'Project');
      const project = validateProject({ color: PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length], ...input, id: input.id ?? createId('project') });
      if (state.projects.some((item) => item.id === project.id)) throw new Error('A project with this ID already exists.');
      if (state.projects.some((item) => item.name.toLowerCase() === project.name.toLowerCase())) throw new Error('A project with this name already exists.');
      return { ...state, projects: [...state.projects, project] };
    }
    case 'updateProject': {
      const current = state.projects.find((project) => project.id === action.id);
      if (!current) return state;
      const changes = requireObject(action.changes, 'Project changes');
      const input = { ...current };
      for (const key of ['name', 'color']) if (Object.hasOwn(changes, key)) input[key] = changes[key];
      const project = validateProject(input);
      if (state.projects.some((item) => item.id !== action.id && item.name.toLowerCase() === project.name.toLowerCase())) throw new Error('A project with this name already exists.');
      if (project.name === current.name && project.color === current.color) return state;
      return { ...state, projects: state.projects.map((item) => item.id === action.id ? project : item) };
    }
    case 'deleteProject': {
      if (!state.projects.some((project) => project.id === action.id)) return state;
      const now = actionTime(action);
      return { ...state, projects: state.projects.filter((project) => project.id !== action.id), tasks: state.tasks.map((task) => task.projectId === action.id ? { ...task, projectId: null, updatedAt: now < task.updatedAt ? task.updatedAt : now } : task) };
    }
    default:
      throw new Error('Unknown workspace action.');
  }
}

export function filterTasks(state, { search = '', priority = 'all', scope = 'all', sort = 'newest', today = localDate() } = {}) {
  const query = search.trim().toLowerCase();
  const projectNames = new Map(state.projects.map((project) => [project.id, project.name.toLowerCase()]));
  const tasks = state.tasks.filter((task) => {
    if (priority !== 'all' && task.priority !== priority) return false;
    if (scope === 'today' && (task.dueDate !== today || task.status === 'done')) return false;
    if (scope === 'completed' && task.status !== 'done') return false;
    if (!['all', 'today', 'completed'].includes(scope) && task.projectId !== scope) return false;
    return !query || `${task.title}\n${task.description}\n${projectNames.get(task.projectId) ?? ''}`.toLowerCase().includes(query);
  });
  const compare = sort === 'due'
    ? (a, b) => (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31')
    : sort === 'priority'
      ? (a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)
      : (a, b) => b.createdAt.localeCompare(a.createdAt);
  return tasks.sort((a, b) => compare(a, b) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

export function getStats(state, today = localDate()) {
  const stats = { total: state.tasks.length, completed: 0, today: 0, overdue: 0, completionRate: 0, byStatus: { todo: 0, doing: 0, done: 0 }, byProject: Object.fromEntries(state.projects.map((project) => [project.id, 0])) };
  for (const task of state.tasks) {
    stats.byStatus[task.status] += 1;
    if (task.projectId !== null) stats.byProject[task.projectId] += 1;
    if (task.status === 'done') stats.completed += 1;
    if (task.status !== 'done' && task.dueDate === today) stats.today += 1;
    if (isOverdue(task, today)) stats.overdue += 1;
  }
  stats.completionRate = stats.total ? Math.round(stats.completed / stats.total * 100) : 0;
  return stats;
}
