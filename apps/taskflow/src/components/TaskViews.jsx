import { useState } from 'react';
import { isOverdue } from '../model.js';
import Icon from './Icon.jsx';

export const STATUS_LABELS = { todo: 'To do', doing: 'In progress', done: 'Done' };
const PRIORITY_ICONS = { high: 'up', medium: 'medium', low: 'down' };
export function dateLabel(value) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );
}
export function ProjectTag({ project }) {
  return project ? (
    <span className="project-tag" style={{ '--project-color': project.color }}>
      <span className="dot" />
      {project.name}
    </span>
  ) : (
    <span className="project-tag unassigned">No project</span>
  );
}
export function Priority({ value }) {
  return (
    <span className={`priority priority-${value}`}>
      <Icon name={PRIORITY_ICONS[value]} size={18} />
      <span>{value[0].toUpperCase() + value.slice(1)}</span>
    </span>
  );
}

function TaskCard({ task, project, onEdit, onDrag }) {
  const overdue = isOverdue(task);
  return (
    <article
      className={`task-card ${task.status === 'done' ? 'task-done' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/taskflow-id', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDrag(task.id);
      }}
      onDragEnd={() => onDrag(null)}
    >
      <div className="card-top">
        <ProjectTag project={project} />
        <button
          className="icon-button"
          aria-label={`Edit ${task.title}`}
          title="Open task"
          onClick={() => onEdit(task)}
        >
          <Icon name="more" />
        </button>
      </div>
      <button className="task-title" onClick={() => onEdit(task)}>
        {task.title}
      </button>
      <p className="task-description">
        {task.description || 'Add a description to give this task a little context.'}
      </p>
      <div className="card-meta">
        <Priority value={task.priority} />
        <span
          className={`due-date ${overdue ? 'overdue' : ''}`}
          title={overdue ? `Overdue: ${task.dueDate}` : task.dueDate || undefined}
        >
          <Icon name="calendar" size={17} />
          {dateLabel(task.dueDate)}
          {overdue ? <span className="sr-only">, overdue</span> : null}
        </span>
      </div>
    </article>
  );
}

export function Board({ tasks, projects, onEdit, onAdd, onMove }) {
  const [dragged, setDragged] = useState(null);
  const [over, setOver] = useState(null);
  return (
    <>
      <div className="board">
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <section
              className={`column column-${status} ${over === status ? 'drag-over' : ''}`}
              key={status}
              aria-label={`${label} tasks`}
              onDragOver={(e) => {
                if (dragged) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setOver(status);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOver(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/taskflow-id');
                if (id && dragged) onMove(id, status);
                setOver(null);
                setDragged(null);
              }}
            >
              <div className="column-heading">
                <h2>
                  <span className="dot status-dot" />
                  {label}
                  <span className="count">({columnTasks.length})</span>
                </h2>
                <button
                  className="icon-button"
                  aria-label={`Add task to ${label}`}
                  onClick={() => onAdd(status)}
                >
                  <Icon name="plus" />
                </button>
              </div>
              <div className="column-cards">
                {columnTasks.length ? (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={projects.find((p) => p.id === task.projectId)}
                      onEdit={onEdit}
                      onDrag={setDragged}
                    />
                  ))
                ) : (
                  <p className="column-empty">
                    {status === 'done' ? 'Your wins will land here.' : 'A little breathing room.'}
                  </p>
                )}
              </div>
              <button className="add-task secondary" onClick={() => onAdd(status)}>
                <Icon name="plus" size={18} />
                Add task
              </button>
            </section>
          );
        })}
      </div>
      <p className="board-hint">Drag tasks between columns, or open a task to change its status.</p>
    </>
  );
}

export function TaskList({ tasks, projects, onEdit, onMove }) {
  return (
    <div className="task-list">
      {tasks.length ? (
        <>
          <div className="list-head">
            <span>Task</span>
            <span>Priority</span>
            <span>Due date</span>
            <span>Status</span>
          </div>
          {tasks.map((task) => (
            <article className="list-row" key={task.id}>
              <div className="list-task">
                <ProjectTag project={projects.find((p) => p.id === task.projectId)} />
                <button className="task-title" onClick={() => onEdit(task)}>
                  {task.title}
                </button>
              </div>
              <Priority value={task.priority} />
              <span className={`due-date ${isOverdue(task) ? 'overdue' : ''}`}>
                <Icon name="calendar" size={17} />
                {dateLabel(task.dueDate)}
              </span>
              <select
                aria-label={`Status of ${task.title}`}
                value={task.status}
                onChange={(e) => onMove(task.id, e.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </>
      ) : (
        <div className="empty-state">
          <Icon name="check" size={36} />
          <h2>No tasks here yet</h2>
          <p>Try another filter, or make room for a new task.</p>
        </div>
      )}
    </div>
  );
}

export function Stats({ stats }) {
  return (
    <section className="stats" aria-label="Workspace progress">
      <div>
        <strong>{stats.total}</strong>
        <span>Total tasks</span>
      </div>
      <div>
        <strong className="green">{stats.byStatus.doing}</strong>
        <span>In progress</span>
      </div>
      <div>
        <strong className="green">{stats.completed}</strong>
        <span>Completed</span>
      </div>
      <div className="completion">
        <div>
          <strong>{stats.completionRate}%</strong>
          <span>Completion</span>
        </div>
        <progress
          value={stats.completed}
          max={Math.max(stats.total, 1)}
          aria-label="Task completion"
        />
      </div>
    </section>
  );
}
