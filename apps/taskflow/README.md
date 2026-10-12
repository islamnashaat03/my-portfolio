# TaskFlow

A React task manager for organising personal projects. This is a complete frontend application with browser-local persistence, built as a portfolio project and a reference for learning React step by step.

## Links

- [Portfolio](https://islamnashaat03.github.io/my-portfolio/)
- [TaskFlow deployment location](https://islamnashaat03.github.io/my-portfolio/taskflow/) — the intended GitHub Pages URL; availability depends on the portfolio deployment.
- [Source in the portfolio repository](https://github.com/islamnashaat03/my-portfolio/tree/main/apps/taskflow)
- [Arabic learning roadmap](docs/LEARNING_ROADMAP.ar.md)

The application source lives in `apps/taskflow/`. The generated static website lives in the repository's `taskflow/` directory so it can be served alongside the existing portfolio.

## What the application does

- Create, edit, and delete tasks with project, status, priority, and due-date information.
- Create, rename, and remove projects. Removing a project preserves its tasks as unassigned.
- Switch between a status board and a list view.
- Move tasks between board columns with native desktop drag and drop, or change their status in the task editor using keyboard or touch controls.
- Search, filter, and sort tasks; inspect summary counts derived from task data.
- Keep task data in versioned `localStorage` across page reloads in the same browser.
- Export a JSON backup and import a validated backup through settings, with confirmation before replacing the workspace.
- Report storage failures so an unsuccessful browser save is visible.

There is no backend, account system, shared workspace, or cloud synchronisation. Tasks stay in the current browser profile on this website's origin. A different browser or device has its own data. Clearing site data removes the local copy; export a backup when you need to keep it. Desktop drag and drop is an optional convenience, and editing a task's status provides the same workflow on touch devices and with a keyboard.

The first visit starts with eight example tasks. Resetting the sample workspace replaces existing tasks and projects after confirmation. An import replaces the workspace rather than merging it. If saved data cannot be read, the app preserves that stored value and keeps the current session in memory until you explicitly import a valid backup or reset; export current work before closing the tab.

## Run locally

Use a Node.js version supported by Vite 7: Node 20.19+ or 22.12+.

From the repository root:

```sh
cd apps/taskflow
npm ci
npm run dev
```

Open the local address printed by Vite. The development server only listens on the local machine by default.

```sh
npm test
npm run build
npm run preview
```

`npm test` runs the model tests using Node's test runner. `npm run build` creates the production site in `dist/`. `npm run preview` serves that build locally for a final check. Model tests complement browser checks; they do not prove that every interaction or layout works.

## Source map

| File | Responsibility |
| --- | --- |
| `src/main.jsx` | Mount the React application. |
| `src/App.jsx` | Compose the interface, connect state to views, and coordinate user actions. |
| `src/components/Sidebar.jsx` | Project navigation and view selection. |
| `src/components/TaskViews.jsx` | Board and list rendering, including moving tasks. |
| `src/components/TaskEditor.jsx` | Task create/edit form and validation feedback. |
| `src/components/Settings.jsx` | Data backup, import, and settings actions. |
| `src/components/Dialog.jsx` | Reusable dialog behaviour and presentation. |
| `src/components/Icon.jsx` | Shared icons. |
| `src/model.js` | Data rules, reducer transitions, selectors, and backup validation. |
| `src/useTaskStore.js` | React state and browser persistence integration. |
| `src/styles.css` | Visual design, responsive layouts, and focus styles. |
| `tests/` | Automated checks for data logic. |
| `scripts/publish-assets.mjs` | Copy the production build into the portfolio's `taskflow/` folder. |

State changes follow one route: a user action becomes a reducer action, the reducer returns the next state, and React renders the updated view. Filtering, sorting, and statistics are derived from the task data. The store hook uses `useState` with a reducer dispatch wrapper so rejected edits can return an error to the form. Persistence is a side effect managed separately from the reducer, keeping data rules independently testable.

## Updating the portfolio build

Make changes in `apps/taskflow/src/`, then run the following from `apps/taskflow/`:

```sh
npm test
npm run publish:assets
```

The second command builds the app and refreshes the repository's generated `taskflow/` assets. It does not push to GitHub or publish a deployment.

If portfolio content changes too, run the existing portfolio tools from the repository root:

```sh
python build_portfolio.py
python verify_portfolio.py
```

Review the changes before committing, including the generated website files. Vite uses the relative base `./` so assets load below `/my-portfolio/taskflow/`. Publishing follows the existing repository's GitHub Pages configuration. Verify both the portfolio project link and the TaskFlow URL after deployment, including a direct page reload.

## Manual verification checklist

1. Create a task, edit its details, and delete it; check that the board, list, and counts reflect each action.
2. Change a task's status with desktop drag and drop and through the editor.
3. Add a project and assign tasks to it. Check project navigation and any project removal confirmation.
4. Try search and filters together. Clear them and confirm all relevant tasks return.
5. Reload the page and confirm saved data is restored.
6. Export a backup, change some data, then import the backup. Inspect the resulting tasks and projects.
7. Import malformed JSON and invalid data. Confirm that an error is shown and the existing workspace remains usable.
8. Test a narrow viewport and keyboard-only navigation. Open and close dialogs, use forms, and check visible focus.
9. Check the browser console for unexpected errors and test the production build under its GitHub Pages path.

Use a disposable workspace or exported backup before practising import or destructive settings actions.

## Portfolio and interview description

Suggested accurate description:

> TaskFlow is a React task manager with reusable components, reducer-based state, responsive board/list views, validated JSON backups, and local browser persistence. The initial implementation was created with AI assistance; I am rebuilding it step by step to understand the design and independently implement the features.

After personally completing and verifying the rebuild, update the final sentence to describe the work you actually performed. In an interview, be ready to trace an action from the form through the reducer to the rendered list, explain immutable updates, show how invalid imports are rejected, and describe the limits of browser-local storage. Do not list authentication, cloud sync, collaboration, or backend features as implemented.

## Learning references

- [React: Learn](https://react.dev/learn)
- [React: useReducer](https://react.dev/reference/react/useReducer)
- [React: useEffect](https://react.dev/reference/react/useEffect)
- [Vite: Getting started](https://vite.dev/guide/)

Follow the [Arabic roadmap](docs/LEARNING_ROADMAP.ar.md) in a separate learning copy. The finished application is a reference, not a substitute for writing, explaining, and testing each feature yourself.
