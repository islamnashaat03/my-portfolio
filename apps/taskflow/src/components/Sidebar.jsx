import { useLayoutEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function Sidebar({ state, scope, setScope, onProject, onSettings, mobileOpen, onClose, storageError, isMobile }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!mobileOpen || !isMobile) return;
    const origin = document.activeElement;
    ref.current.querySelector('button')?.focus();
    return () => {
      // Restore focus after React removes the main region's inert attribute.
      queueMicrotask(() => { if (origin instanceof HTMLElement && origin.isConnected) origin.focus(); });
    };
  }, [mobileOpen, isMobile]);
  function trapFocus(e) {
    if (!mobileOpen || !isMobile || e.key !== 'Tab') return;
    const buttons = [...ref.current.querySelectorAll('button')].filter(button => button.getClientRects().length);
    const first = buttons[0], last = buttons.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  function navigate(value) { setScope(value); onClose(); }
  return <>
    {mobileOpen ? <button className="nav-backdrop" aria-label="Close navigation" onClick={onClose} /> : null}
    <aside ref={ref} className={`sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Workspace navigation" aria-hidden={isMobile && !mobileOpen ? true : undefined} inert={isMobile && !mobileOpen ? true : undefined} onKeyDown={trapFocus}>
      <div className="brand"><Icon name="logo" size={32} /><span>TaskFlow</span><button className="icon-button mobile-close" aria-label="Close navigation" onClick={onClose}><Icon name="close" /></button></div>
      <p className="workspace">Personal workspace</p>
      <nav className="main-nav" aria-label="Task views">
        {[['all', 'All tasks', 'list'], ['today', 'Today', 'calendar'], ['completed', 'Completed', 'check']].map(([id, label, icon]) => <button key={id} className={scope === id ? 'active' : ''} aria-current={scope === id ? 'page' : undefined} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span></button>)}
      </nav>
      <div className="projects-heading"><h2>Projects</h2><button className="icon-button" aria-label="New project" title="New project" onClick={() => onProject(null)}><Icon name="plus" /></button></div>
      <nav className="project-nav" aria-label="Projects">
        {state.projects.map(project => <div className={`project-nav-row ${scope === project.id ? 'active' : ''}`} key={project.id}><button className="project-link" aria-current={scope === project.id ? 'page' : undefined} onClick={() => navigate(project.id)}><span className="dot" style={{ background: project.color }} /><span>{project.name}</span></button><button className="icon-button project-edit" aria-label={`Edit project ${project.name}`} onClick={() => onProject(project)}><Icon name="edit" size={15} /></button></div>)}
      </nav>
      <div className="sidebar-bottom"><p>{storageError ? 'Storage needs attention' : 'Saved on this browser'}</p><button className="secondary settings-button" onClick={onSettings}><Icon name="settings" />Backup & settings</button></div>
    </aside>
  </>;
}
