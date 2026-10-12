import { useEffect, useState } from 'react';
import { filterTasks, getStats, localDate } from './model.js';
import { useTaskStore } from './useTaskStore.js';
import Sidebar from './components/Sidebar.jsx';
import Icon from './components/Icon.jsx';
import { Board, TaskList, Stats } from './components/TaskViews.jsx';
import TaskEditor, { ProjectEditor } from './components/TaskEditor.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const { state, dispatch, storageError, recoveryRequired, resetStore, importBackup } = useTaskStore();
  const [scope, setScope] = useState('all');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('board');
  const [editor, setEditor] = useState(null);
  const [projectEditor, setProjectEditor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [day, setDay] = useState(localDate);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width:900px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width:900px)');
    const update = () => { setIsMobile(media.matches); if (!media.matches) setMobileOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const midnight = new Date(); midnight.setHours(24, 0, 0, 50);
    const refresh = () => setDay(localDate());
    const timer = setTimeout(refresh, midnight.getTime() - Date.now());
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [day]);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setMobileOpen(false); }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  const currentProject = state.projects.find(project => project.id === scope);
  const effectiveScope = currentProject || ['all', 'today', 'completed'].includes(scope) ? scope : 'all';
  useEffect(() => { if (effectiveScope !== scope) setScope(effectiveScope); }, [effectiveScope, scope]);
  const scopeLabel = currentProject?.name || { all: 'All tasks', today: 'Today', completed: 'Completed' }[scope] || 'All tasks';
  const tasks = filterTasks(state, { search, priority, scope: effectiveScope, sort, today: day });
  const stats = getStats(state, day);
  function navigate(next) { setScope(next); setSearch(''); setPriority('all'); }
  function createTask(status = 'todo') { setEditor({ task: null, defaultStatus: status }); }
  function run(action, message) {
    let result = dispatch(action);
    const missing = action.type === 'updateTask' ? !state.tasks.some(task => task.id === action.id) : action.type === 'updateProject' ? !state.projects.some(project => project.id === action.id) : false;
    if (result.ok && result.changed === false && missing) result = { ok: false, error: 'This item was removed in another tab. Your edits are still here; copy them before closing.' };
    setToast(result.ok ? message : result.error); return result;
  }
  function moveTask(id, status) { run({ type: 'updateTask', id, changes: { status } }, 'Task moved. One step forward.'); }
  return <div className="app-shell">
    <a className="skip-link" href="#workspace">Skip to tasks</a>
    <Sidebar state={state} scope={effectiveScope} setScope={navigate} onProject={project => setProjectEditor({ project })} onSettings={() => setSettingsOpen(true)} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} storageError={storageError} isMobile={isMobile} />
    <main id="workspace" className="main-content" inert={isMobile && mobileOpen ? true : undefined}>
      <div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Icon name="menu" /></button><span>Workspace</span><span className="slash">/</span><span className="current-scope">{scopeLabel}</span></div>
      <header className="page-heading"><div><h1>Make room for your best work.</h1><p>A little structure. A lot more focus.</p></div><button className="primary new-task" onClick={() => createTask()}><Icon name="plus" />New task</button></header>
      {storageError ? <div className="storage-warning" role="alert"><span>{storageError}</span><button onClick={() => setSettingsOpen(true)}>Open backup & settings</button></div> : null}
      <Stats stats={stats} />
      <div className="toolbar"><div className="view-switch" role="group" aria-label="Task layout"><button className={view === 'board' ? 'selected' : ''} aria-pressed={view === 'board'} onClick={() => setView('board')}><Icon name="board" size={19} />Board</button><button className={view === 'list' ? 'selected' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}><Icon name="list" size={19} />List</button></div><label className="search-field"><Icon name="search" size={20} /><span className="sr-only">Search tasks</span><input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} type="search" /></label><label className="filter-control"><span className="sr-only">Priority filter</span><select value={priority} onChange={e => setPriority(e.target.value)}><option value="all">Priority: All</option><option value="high">Priority: High</option><option value="medium">Priority: Medium</option><option value="low">Priority: Low</option></select></label><label className="filter-control"><span className="sr-only">Sort tasks</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Sort: newest</option><option value="due">Sort: due date</option><option value="priority">Sort: priority</option></select></label></div>
      {scope !== 'all' || search || priority !== 'all' ? <div className="filter-summary"><span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} in {scopeLabel}{search ? ` matching “${search}”` : ''}</span><button onClick={() => { navigate('all'); }}>Clear filters</button></div> : null}
      {view === 'board' ? <Board tasks={tasks} projects={state.projects} onEdit={task => setEditor({ task })} onAdd={createTask} onMove={moveTask} /> : <TaskList tasks={tasks} projects={state.projects} onEdit={task => setEditor({ task })} onMove={moveTask} />}
    </main>
    {editor ? <TaskEditor task={editor.task} defaultStatus={editor.defaultStatus} defaultProject={currentProject?.id} projects={state.projects} onClose={() => setEditor(null)} onSave={task => { const result = run(editor.task ? { type: 'updateTask', id: editor.task.id, changes: task } : { type: 'addTask', task }, editor.task ? 'Changes saved.' : 'Task created. You’ve got this.'); if (result.ok) setEditor(null); return result; }} onDelete={() => { const result = run({ type: 'deleteTask', id: editor.task.id }, 'Task deleted.'); if (result.ok) setEditor(null); }} /> : null}
    {projectEditor ? <ProjectEditor project={projectEditor.project} onClose={() => setProjectEditor(null)} onSave={project => { const result = run(projectEditor.project ? { type: 'updateProject', id: projectEditor.project.id, changes: project } : { type: 'addProject', project }, 'Project saved.'); if (result.ok) setProjectEditor(null); return result; }} onDelete={() => { const id = projectEditor.project.id; const result = run({ type: 'deleteProject', id }, 'Project deleted. Its tasks have been kept.'); if (result.ok) { if (scope === id) navigate('all'); setProjectEditor(null); } }} /> : null}
    {settingsOpen ? <Settings state={state} onImport={text => { const result = importBackup(text); if (result.ok) navigate('all'); return result; }} onReset={() => { const result = resetStore(); if (result.ok) navigate('all'); return result; }} onClose={() => setSettingsOpen(false)} notify={setToast} recoveryRequired={recoveryRequired} /> : null}
    <div className="toast-area" role="status" aria-live="polite">{toast ? <div className="toast"><Icon name="check" size={19} /><span>{toast}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setToast('')}><Icon name="close" size={16} /></button></div> : null}</div>
  </div>;
}
