// Conjunto leve de ícones SVG inline (sem dependências externas).
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const IconDashboard = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const IconUsers = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <circle cx="17.5" cy="8.5" r="2.6" />
    <path d="M16 14.2c2.7.4 4.5 2.3 4.5 5.3" />
  </svg>
);

export const IconBuilding = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <rect x="4" y="3" width="10" height="18" rx="1" />
    <rect x="14" y="9" width="6" height="12" rx="1" />
    <path d="M7 7h1M7 11h1M7 15h1M10.5 7h1M10.5 11h1M10.5 15h1M16.5 12.5h1M16.5 16h1" />
  </svg>
);

export const IconUserCog = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <circle cx="9" cy="7" r="3.2" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <circle cx="18" cy="16.5" r="2.4" />
    <path d="M18 13v1M18 19v1M15.5 16.5h1M19.5 16.5h1M16.2 14.7l.7.7M19.1 18.1l.7.7M19.8 14.7l-.7.7M16.9 18.1l-.7.7" />
  </svg>
);

export const IconCalendarPlus = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 13v5M9.5 15.5h5" />
  </svg>
);

export const IconListChecks = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <path d="M9 6h12M9 12h12M9 18h12" />
    <path d="M3 6l1.3 1.3L6.5 5M3 12l1.3 1.3L6.5 11M3 18l1.3 1.3L6.5 16" />
  </svg>
);

export const IconRibbon = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M8.5 12.3L6 21l6-3 6 3-2.5-8.7" />
  </svg>
);

export const IconUser = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c0-4 3.3-6.8 7.5-6.8s7.5 2.8 7.5 6.8" />
  </svg>
);

export const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" width={22} height={22} {...base} {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const IconClose = (p) => (
  <svg viewBox="0 0 24 24" width={20} height={20} {...base} {...p}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

export const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M19.5 19.5L15 15" />
  </svg>
);

export const IconEdit = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19 3 20l1-4z" />
  </svg>
);

export const IconTrash = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <path d="M4 7h16M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const IconEye = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconPlus = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" width={16} height={16} {...base} {...p}>
    <path d="M4 12.5l5 5L20 6" />
  </svg>
);

export const IconCalendarCheck = (p) => (
  <svg viewBox="0 0 24 24" width={18} height={18} {...base} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    <path d="M9 14.5l1.8 1.8L15.5 12" />
  </svg>
);
