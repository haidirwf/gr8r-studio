/* ---------- seed data (Clean empty dataset for production) ---------- */
export function seed() {
  return {
    ws: { name: 'Workspace Pelajar', url: 'pelajar', c: '#5A67D8', brand: true },
    workspaces: [
      { id: 'w1', name: 'Workspace Pelajar', c: '#5A67D8', plan: 'Personal', brand: true },
    ],
    me: null,
    members: [],
    projects: [],
    tasks: [],
    comments: [],
    activity: [],
    notifs: [],
    files: [],
    events: [],
    notes: [],
    projOrder: [],
    savedViews: [],
    recentSearches: [],
    sessions: [],
    invoices: [],
    tfa: false,
    notifPrefs: {},
  };
}
