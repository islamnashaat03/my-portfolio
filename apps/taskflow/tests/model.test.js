import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, BACKUP_LIMIT_BYTES, createSeedState, filterTasks, formatDueDate, getStats, isOverdue, isValidDate, LIMITS, localDate, parseBackup, serializeBackup, taskReducer } from '../src/model.js';

const today = '2026-10-12';
const now = '2026-10-12T12:00:00.000Z';
const seed = () => createSeedState(today);

test('seed uses relative local dates and real project/status relationships', () => {
  const state = seed();
  assert.equal(state.tasks.length, 8);
  assert.equal(state.projects.length, 3);
  assert.equal(state.tasks[0].dueDate, '2026-10-14');
  assert.equal(state.tasks[3].dueDate, '2026-10-13');
  assert.equal(state.tasks[6].dueDate, today);
  assert.deepEqual(getStats(state, today).byStatus, { todo: 3, doing: 3, done: 2 });
  assert.equal(getStats(state, today).completionRate, 25);
  assert.deepEqual(parseBackup(serializeBackup(state)), state);
});

test('date helpers validate real calendar dates and cross month/year boundaries', () => {
  assert.equal(isValidDate('2024-02-29'), true);
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01', '', null]) assert.equal(isValidDate(value), false);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(localDate(new Date(2026, 9, 12, 0, 5)), today);
  assert.equal(formatDueDate(today, today), 'Today');
  assert.equal(formatDueDate(addDays(today, 1), today), 'Tomorrow');
  assert.equal(formatDueDate(null, today), 'No due date');
});

test('task creation normalizes text and does not mutate existing state', () => {
  const before = seed();
  const original = structuredClone(before);
  const next = taskReducer(before, { type: 'addTask', task: { id: 'new-task', title: '  Write tests  ', dueDate: today }, now });
  assert.deepEqual(before, original);
  assert.equal(next.tasks.length, 9);
  assert.equal(next.tasks[0].title, 'Write tests');
  assert.equal(next.tasks[0].projectId, null);
  assert.equal(next.tasks[0].completedAt, null);
  assert.equal(next.tasks[1], before.tasks[0]);
  assert.throws(() => taskReducer(before, { type: 'addTask', task: { title: ' ' }, now }), /required/);
  assert.throws(() => taskReducer(before, { type: 'addTask', task: { title: 'x'.repeat(LIMITS.title + 1) }, now }), /characters/);
  assert.throws(() => taskReducer(before, { type: 'addTask', task: { title: 'Broken', projectId: 'missing' }, now }), /existing project/);
  assert.throws(() => taskReducer(before, { type: 'addTask', task: { title: 'Broken', dueDate: '2026-02-30' }, now }), /valid due date/);
});

test('moving a task records completion and reopening clears it', () => {
  const before = seed();
  const completed = taskReducer(before, { type: 'updateTask', id: 'sample-1', changes: { status: 'done' }, now });
  assert.equal(before.tasks[0].status, 'todo');
  assert.equal(completed.tasks[0].completedAt, now);
  assert.equal(taskReducer(completed, { type: 'updateTask', id: 'sample-1', changes: { status: 'done' }, now }), completed);
  const renamed = taskReducer(completed, { type: 'updateTask', id: 'sample-1', changes: { title: 'Homepage plan', id: 'forged' }, now: '2026-10-12T13:00:00.000Z' });
  assert.equal(renamed.tasks[0].id, 'sample-1');
  assert.equal(renamed.tasks[0].completedAt, now);
  const reopened = taskReducer(renamed, { type: 'updateTask', id: 'sample-1', changes: { status: 'doing' }, now: '2026-10-12T14:00:00.000Z' });
  assert.equal(reopened.tasks[0].completedAt, null);
  assert.deepEqual(parseBackup(serializeBackup(reopened)), reopened);
});

test('editing a completed task stays serializable when the device clock moves backwards', () => {
  const state = seed();
  const completed = state.tasks.find((task) => task.status === 'done');
  const updated = taskReducer(state, { type: 'updateTask', id: completed.id, changes: { title: 'Updated completed task' }, now: completed.createdAt });
  assert.equal(updated.tasks.find((task) => task.id === completed.id).updatedAt, completed.updatedAt);
  assert.deepEqual(parseBackup(serializeBackup(updated)), updated);
});

test('task deletion changes only the selected task; missing edits are safe no-ops', () => {
  const before = seed();
  const after = taskReducer(before, { type: 'deleteTask', id: 'sample-2' });
  assert.equal(after.tasks.length, 7);
  assert.equal(before.tasks.length, 8);
  assert.equal(after.tasks[0], before.tasks[0]);
  assert.equal(taskReducer(after, { type: 'deleteTask', id: 'missing' }), after);
  assert.equal(taskReducer(after, { type: 'updateTask', id: 'missing', changes: { title: 'Nothing' } }), after);
});

test('project management preserves tasks when a project is removed', () => {
  const before = seed();
  const added = taskReducer(before, { type: 'addProject', project: { id: 'work', name: '  Work  ', color: '#ABCDEF' } });
  assert.equal(added.projects[3].name, 'Work');
  assert.equal(added.projects[3].color, '#abcdef');
  const renamed = taskReducer(added, { type: 'updateProject', id: 'website', changes: { name: 'Site refresh' } });
  assert.equal(before.projects[0].name, 'Website redesign');
  assert.equal(renamed.projects[0].name, 'Site refresh');
  assert.throws(() => taskReducer(renamed, { type: 'addProject', project: { name: 'work' } }), /already exists/);
  const removed = taskReducer(renamed, { type: 'deleteProject', id: 'website', now });
  assert.equal(removed.projects.length, 3);
  assert.equal(removed.tasks.length, 8);
  assert.equal(removed.tasks.filter((task) => task.projectId === null).length, 4);
  assert.equal(removed.tasks[1], before.tasks[1]);
  assert.deepEqual(parseBackup(serializeBackup(removed)), removed);
});

test('filters combine text, priority, project scope and completed scope', () => {
  const state = seed();
  assert.equal(filterTasks(state, { search: '  new HOMEpage  ' }).length, 1);
  assert.equal(filterTasks(state, { search: 'comfortable' }).length, 1);
  assert.equal(filterTasks(state, { search: 'Learning React' }).length, 3);
  assert.equal(filterTasks(state, { scope: 'website', priority: 'high' }).length, 2);
  assert.equal(filterTasks(state, { scope: 'completed' }).length, 2);
  assert.equal(filterTasks(state, { scope: 'today', today }).length, 0);
  assert.equal(filterTasks(state, { scope: 'missing' }).length, 0);
});

test('today and overdue ignore completed tasks and missing due dates', () => {
  let state = taskReducer(seed(), { type: 'addTask', task: { id: 'due-today', title: 'Due today', dueDate: today }, now });
  state = taskReducer(state, { type: 'addTask', task: { id: 'late', title: 'Late task', dueDate: addDays(today, -1) }, now });
  assert.equal(filterTasks(state, { scope: 'today', today }).length, 1);
  assert.equal(getStats(state, today).today, 1);
  assert.equal(getStats(state, today).overdue, 1);
  assert.equal(isOverdue(state.tasks[0], today), true);
  assert.equal(isOverdue(state.tasks.find((task) => task.status === 'done'), addDays(today, 10)), false);
});

test('sorting is deterministic, places undated tasks last, and does not reorder source state', () => {
  const state = taskReducer(seed(), { type: 'addTask', task: { id: 'undated', title: 'No date' }, now });
  const originalIds = state.tasks.map((task) => task.id);
  assert.equal(filterTasks(state, { sort: 'due' }).at(-1).id, 'undated');
  assert.equal(filterTasks(state, { sort: 'newest' })[0].id, 'undated');
  const priorities = filterTasks(state, { sort: 'priority' }).map((task) => task.priority);
  assert.deepEqual(priorities, ['high', 'high', 'medium', 'medium', 'medium', 'medium', 'medium', 'low', 'low']);
  assert.deepEqual(state.tasks.map((task) => task.id), originalIds);
});

test('backup import rejects corrupt, incompatible, duplicate and oversized data', () => {
  assert.throws(() => parseBackup('{bad'), /JSON/);
  assert.throws(() => parseBackup('null'), /object/);
  assert.throws(() => parseBackup(JSON.stringify({ ...seed(), version: 99 })), /unsupported/);
  assert.throws(() => parseBackup(' '.repeat(BACKUP_LIMIT_BYTES + 1)), /10 MB/);
  assert.throws(() => parseBackup('ع'.repeat(BACKUP_LIMIT_BYTES / 2 + 1)), /10 MB/);
  const duplicate = seed();
  duplicate.tasks.push({ ...duplicate.tasks[0] });
  assert.throws(() => parseBackup(JSON.stringify(duplicate)), /duplicate task IDs/);
  const badReference = seed();
  badReference.tasks[0].projectId = 'missing';
  assert.throws(() => parseBackup(JSON.stringify(badReference)), /existing project/);
  const badCompletion = seed();
  badCompletion.tasks[0].completedAt = now;
  assert.throws(() => parseBackup(JSON.stringify(badCompletion)), /completion/);
  const badTimestamp = seed();
  badTimestamp.tasks[0].createdAt = 'yesterday';
  assert.throws(() => parseBackup(JSON.stringify(badTimestamp)), /timestamp/);
  const tooManyProjects = seed();
  tooManyProjects.projects = Array.from({ length: LIMITS.projects + 1 }, (_, index) => ({ id: `p-${index}`, name: `Project ${index}`, color: '#236de5' }));
  assert.throws(() => parseBackup(JSON.stringify(tooManyProjects)), /limit/);
  const reservedProject = seed();
  reservedProject.projects[0].id = 'all';
  assert.throws(() => parseBackup(JSON.stringify(reservedProject)), /reserved/);
});

test('maximum workspace with maximum Unicode text round-trips within the backup limit', () => {
  const state = seed();
  state.projects = Array.from({ length: LIMITS.projects }, (_, index) => ({
    id: `p${String(index).padStart(79, '0')}`,
    name: `${'項'.repeat(LIMITS.projectName - 2)}${String(index).padStart(2, '0')}`,
    color: '#236de5',
  }));
  const template = state.tasks[0];
  state.tasks = Array.from({ length: LIMITS.tasks }, (_, index) => ({
    ...template,
    id: `t${String(index).padStart(79, '0')}`,
    title: '界'.repeat(LIMITS.title),
    description: '界'.repeat(LIMITS.description),
    projectId: state.projects[index % LIMITS.projects].id,
  }));
  const text = serializeBackup(state);
  assert.ok(new TextEncoder().encode(text).length > 2_000_000);
  assert.ok(new TextEncoder().encode(text).length < BACKUP_LIMIT_BYTES);
  assert.deepEqual(parseBackup(text), state);
});

test('text validation allows emoji and line breaks but rejects invalid Unicode and non-text controls', () => {
  const state = taskReducer(seed(), { type: 'addTask', task: { title: '🚀'.repeat(LIMITS.title / 2), description: `Arabic: مرحبًا\nEmoji: ✅\t${'😀'.repeat(900)}` }, now });
  assert.deepEqual(parseBackup(serializeBackup(state)), state);
  for (const invalid of ['Text\u0000with a null', 'Lone high surrogate \ud800', 'Lone low surrogate \udc00']) {
    assert.throws(() => taskReducer(seed(), { type: 'addTask', task: { title: 'Invalid text', description: invalid }, now }), /control|Unicode/);
  }
});

test('backup validation copies known fields and excludes unexpected payload fields', () => {
  const input = seed();
  input.untrusted = { html: '<script>bad</script>' };
  input.tasks[0].untrusted = 'ignored';
  const output = parseBackup(JSON.stringify(input));
  assert.equal(Object.hasOwn(output, 'untrusted'), false);
  assert.equal(Object.hasOwn(output.tasks[0], 'untrusted'), false);
  assert.notEqual(output.tasks[0], input.tasks[0]);
});
