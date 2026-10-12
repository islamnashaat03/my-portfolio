import { useState } from 'react';
import Dialog from './Dialog.jsx';
import Icon from './Icon.jsx';
import { STATUS_LABELS } from './TaskViews.jsx';

export default function TaskEditor({
  task,
  defaultStatus,
  defaultProject,
  projects,
  onSave,
  onDelete,
  onClose,
}) {
  const [form, setForm] = useState(() =>
    task
      ? { ...task, dueDate: task.dueDate || '', projectId: task.projectId || '' }
      : {
          title: '',
          description: '',
          status: defaultStatus || 'todo',
          priority: 'medium',
          projectId: defaultProject || '',
          dueDate: '',
        },
  );
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  function change(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }
  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Give your task a title.');
      return;
    }
    const result = onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      projectId: form.projectId || null,
      dueDate: form.dueDate || null,
    });
    if (!result.ok) setError(result.error);
  }
  return (
    <Dialog title={task ? 'Edit task' : 'A new beginning'} onClose={onClose}>
      <form onSubmit={submit} className="editor-form">
        <label>
          Task title
          <input
            name="title"
            value={form.title}
            onChange={change}
            required
            maxLength={160}
            placeholder="What would you like to get done?"
          />
        </label>
        <label>
          Description <span className="optional">optional</span>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            maxLength={2000}
            rows={3}
            placeholder="A little context goes a long way."
          />
        </label>
        <div className="form-grid">
          <label>
            Project
            <select name="projectId" value={form.projectId} onChange={change}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={change}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" value={form.priority} onChange={change}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label>
            Due date <span className="optional">optional</span>
            <input
              type="date"
              name="dueDate"
              min="1900-01-01"
              max="2200-12-31"
              value={form.dueDate}
              onChange={change}
            />
          </label>
        </div>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        {confirmDelete ? (
          <div className="confirm-panel">
            <p>Delete this task? This cannot be undone.</p>
            <div className="button-row">
              <button type="button" className="danger" onClick={onDelete}>
                Delete task
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmDelete(false)}>
                Keep task
              </button>
            </div>
          </div>
        ) : (
          <div className="dialog-actions">
            {task ? (
              <button type="button" className="text-danger" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={17} />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="button-row">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="primary" type="submit">
                {task ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}

export function ProjectEditor({ project, onSave, onDelete, onClose }) {
  const [name, setName] = useState(project?.name || '');
  const [color, setColor] = useState(project?.color || '#2f9361');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = [
    ...new Set([
      '#2f9361',
      '#d79a08',
      '#236de5',
      '#8764bd',
      '#d56770',
      '#64748b',
      ...(project ? [project.color] : []),
    ]),
  ];
  return (
    <Dialog title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            setError('Give your project a name.');
            return;
          }
          const result = onSave({ name: name.trim(), color });
          if (!result.ok) setError(result.error);
        }}
      >
        <label>
          Project name
          <input
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Something worth working on"
          />
        </label>
        <fieldset className="color-picker">
          <legend>Color</legend>
          {colors.map((value) => (
            <label key={value} style={{ '--swatch': value }}>
              <input
                type="radio"
                name="color"
                value={value}
                checked={color === value}
                onChange={() => setColor(value)}
              />
              <span className="swatch" /> <span className="sr-only">{value}</span>
            </label>
          ))}
        </fieldset>
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        {confirmDelete ? (
          <div className="confirm-panel">
            <p>Delete this project? Its tasks will be kept under “No project”.</p>
            <div className="button-row">
              <button type="button" className="danger" onClick={onDelete}>
                Delete project
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmDelete(false)}>
                Keep project
              </button>
            </div>
          </div>
        ) : (
          <div className="dialog-actions">
            {project ? (
              <button type="button" className="text-danger" onClick={() => setConfirmDelete(true)}>
                <Icon name="trash" size={17} />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="button-row">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                {project ? 'Save changes' : 'Create project'}
              </button>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
