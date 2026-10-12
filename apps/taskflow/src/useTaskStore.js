import { useCallback, useEffect, useRef, useState } from 'react';
import { createSeedState, parseBackup, serializeBackup, STORAGE_KEY, taskReducer } from './model.js';

function readInitialWorkspace() {
  const state = createSeedState();
  if (typeof window === 'undefined') return { state, saved: null, error: null, recoveryRequired: false };
  let saved;
  try {
    saved = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { state, saved: null, error: 'Saved data could not be read. Your changes will stay in memory until you reset or import a backup.', recoveryRequired: true };
  }
  if (saved === null) return { state, saved: null, error: null, recoveryRequired: false };
  try {
    return { state: parseBackup(saved), saved, error: null, recoveryRequired: false };
  } catch {
    return { state, saved, error: 'Your saved workspace could not be opened. It has been preserved. Export your current work, then import a valid backup or reset the demo to save again.', recoveryRequired: true };
  }
}

// This hook owns browser storage; the reducer stays independent and testable.
export function useTaskStore() {
  const [initial] = useState(readInitialWorkspace);
  const [state, setState] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const [recoveryRequired, setRecoveryRequired] = useState(initial.recoveryRequired);
  const currentState = useRef(initial.state);
  const lastSaved = useRef(initial.saved);
  const unsavedChanges = useRef(initial.saved === null && !initial.recoveryRequired);
  const persistenceBlocked = useRef(initial.recoveryRequired);

  const commit = useCallback((next) => {
    currentState.current = next;
    setState(next);
  }, []);

  const dispatch = useCallback((action) => {
    try {
      const previous = currentState.current;
      const next = taskReducer(previous, action);
      if (next !== previous) unsavedChanges.current = true;
      commit(next);
      return { ok: true, changed: next !== previous };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [commit]);

  const resetStore = useCallback(() => {
    unsavedChanges.current = true;
    persistenceBlocked.current = false;
    commit(createSeedState());
    lastSaved.current = null;
    setRecoveryRequired(false);
    setStorageError(null);
    return { ok: true };
  }, [commit]);

  const importBackup = useCallback((text) => {
    try {
      const next = parseBackup(text);
      unsavedChanges.current = true;
      persistenceBlocked.current = false;
      commit(next);
      lastSaved.current = null;
      setRecoveryRequired(false);
      setStorageError(null);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [commit]);

  useEffect(() => {
    if (persistenceBlocked.current || recoveryRequired) return;
    try {
      const saved = serializeBackup(state);
      if (saved === lastSaved.current) {
        unsavedChanges.current = false;
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, saved);
      lastSaved.current = saved;
      unsavedChanges.current = false;
      setStorageError(null);
    } catch {
      unsavedChanges.current = true;
      setStorageError('Changes are available in this tab, but could not be saved to this browser. Export a backup before closing it.');
    }
  }, [state, recoveryRequired]);

  useEffect(() => {
    const receiveWorkspace = (event) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      if (unsavedChanges.current) {
        // Stop a pending save synchronously before React processes the warning.
        persistenceBlocked.current = true;
        lastSaved.current = null;
        setRecoveryRequired(true);
        setStorageError(event.newValue === null
          ? 'Saved data was removed in another tab while this workspace has unsaved changes. Your work is kept in this tab. Export it before importing a backup or resetting the demo.'
          : 'Another tab changed the saved workspace while your changes are unsaved. Your work is kept in this tab. Export it before importing a backup or resetting the demo.');
        return;
      }
      if (event.newValue === lastSaved.current) return;
      if (event.newValue === null) {
        persistenceBlocked.current = true;
        lastSaved.current = null;
        setRecoveryRequired(true);
        setStorageError('Saved data was removed in another tab. Your current workspace is still open. Export it, import a backup, or reset the demo to save again.');
        return;
      }
      try {
        const next = parseBackup(event.newValue);
        lastSaved.current = serializeBackup(next);
        persistenceBlocked.current = false;
        unsavedChanges.current = false;
        commit(next);
        setRecoveryRequired(false);
        setStorageError(null);
      } catch {
        persistenceBlocked.current = true;
        lastSaved.current = null;
        setRecoveryRequired(true);
        setStorageError('Another tab changed the saved workspace to unreadable data. Your current work is preserved in this tab. Export it before restoring a backup or resetting.');
      }
    };
    window.addEventListener('storage', receiveWorkspace);
    return () => window.removeEventListener('storage', receiveWorkspace);
  }, [commit]);

  return { state, dispatch, storageError, recoveryRequired, resetStore, importBackup };
}

export default useTaskStore;
