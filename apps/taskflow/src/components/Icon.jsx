const paths = {
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  list: <><path d="M9 6h12M9 12h12M9 18h12" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  board: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  more: <><circle cx="4" cy="12" r=".7" /><circle cx="12" cy="12" r=".7" /><circle cx="20" cy="12" r=".7" /></>,
  up: <path d="M12 19V5m-6 6 6-6 6 6" />,
  down: <path d="M12 5v14m-6-6 6 6 6-6" />,
  medium: <path d="M5 9h14M5 15h14" />,
  edit: <><path d="m15 5 4 4M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15l-1 5Z" /></>,
  settings: <><path d="m9 3-.6 3-2.4 1-2.7-1.2-2 3.4 2.3 1.9v2.8l-2.3 1.9 2 3.4L6 18l2.4 1L9 22h4l.6-3 2.4-1 2.7 1.2 2-3.4-2.3-1.9v-2.8l2.3-1.9-2-3.4L16 7l-2.4-1L13 3Z" /><circle cx="11" cy="12.5" r="3" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
  upload: <><path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  logo: <><rect x="2" y="2" width="14" height="14" rx="1.6" /><rect x="8" y="8" width="14" height="14" rx="1.6" /></>,
};

export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.check}</svg>;
}
