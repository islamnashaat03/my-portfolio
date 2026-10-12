import { useState } from 'react';
import Dialog from './Dialog.jsx';
import Icon from './Icon.jsx';
import { BACKUP_LIMIT_BYTES, parseBackup, serializeBackup } from '../model.js';

export default function Settings({ state, onImport, onReset, onClose, notify, recoveryRequired }) {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [reset, setReset] = useState(false);
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([serializeBackup(state)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'taskflow-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Backup downloaded. Keep it somewhere safe.');
  }
  async function readFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > BACKUP_LIMIT_BYTES) throw new Error('Choose a backup smaller than 10 MB.');
      const text = await file.text();
      const parsed = parseBackup(text);
      setPending({ text, count: parsed.tasks.length, projects: parsed.projects.length });
      setError('');
      setReset(false);
    } catch (err) {
      setPending(null);
      setError(err.message);
    }
  }
  return (
    <Dialog title="Backup & settings" onClose={onClose} className="settings-dialog">
      <div className="settings-content">
        <p className="settings-intro">Your own little workspace, on this browser.</p>
        <p>
          Tasks stay on this device. There is no account or cloud sync. Export a backup before
          clearing browser data or switching devices.
        </p>
        <section className="settings-section">
          <h3>Keep a copy</h3>
          <p>Download your tasks and projects as a JSON file.</p>
          <button className="secondary" onClick={exportData}>
            <Icon name="download" size={18} />
            Export backup
          </button>
        </section>
        <section className="settings-section">
          <h3>Bring your work back</h3>
          <p>Import a TaskFlow backup. You can review it before replacing this workspace.</p>
          <label className="secondary file-button">
            <Icon name="upload" size={18} />
            Choose backup
            <input type="file" accept=".json,application/json" onChange={readFile} />
          </label>
          {pending ? (
            <div className="confirm-panel">
              <p>
                Replace your workspace with {pending.count} tasks and {pending.projects} projects?
                Export the current workspace first if you want to keep it.
              </p>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    const result = onImport(pending.text);
                    if (result.ok) {
                      setPending(null);
                      notify('Backup restored. Welcome back.');
                    } else setError(result.error);
                  }}
                >
                  Replace workspace
                </button>
                <button className="secondary" onClick={() => setPending(null)}>
                  Cancel import
                </button>
              </div>
            </div>
          ) : null}
        </section>
        <section className="settings-section">
          <h3>Start fresh</h3>
          <p>
            {recoveryRequired
              ? 'The saved data could not be read. It has been left untouched. Restore a valid backup or explicitly reset it below.'
              : 'Reset this workspace to the eight example tasks. Current tasks and projects will be replaced.'}
          </p>
          {reset ? (
            <div className="confirm-panel">
              <p>Replace all current data with the sample workspace?</p>
              <div className="button-row">
                <button
                  className="danger"
                  onClick={() => {
                    const result = onReset();
                    if (result.ok) {
                      setReset(false);
                      notify('Sample workspace restored.');
                    } else setError(result.error);
                  }}
                >
                  Confirm reset
                </button>
                <button className="secondary" onClick={() => setReset(false)}>
                  Keep my workspace
                </button>
              </div>
            </div>
          ) : (
            <button
              className="text-danger"
              onClick={() => {
                setReset(true);
                setPending(null);
              }}
            >
              Reset sample workspace
            </button>
          )}
        </section>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="settings-credit">
          A React portfolio & learning project by{' '}
          <a href="https://islamnashaat03.github.io/my-portfolio/" target="_blank" rel="noreferrer">
            Islam Nashaat
          </a>
          .{' '}
          <a
            href="https://github.com/islamnashaat03/my-portfolio/tree/main/apps/taskflow"
            target="_blank"
            rel="noreferrer"
          >
            Explore the source
          </a>
          .
        </p>
      </div>
    </Dialog>
  );
}
