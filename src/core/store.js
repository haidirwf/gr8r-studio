/* ---------- store ---------- */
import { TODAY, diffD, iso, parse, uid } from './utils.js';
import { PCOLORS, TEAMS_SEED } from './constants.js';
import { scheduleCloudSync } from './supabase.js';

export const STORE_KEY = 'gr8r.v5';
export const DEFAULT_PREFS = {
  theme: 'system',
  accent: 'indigo',
  side: 'comfortable',
  density: 'comfortable',
  weekStart: 1,
  dateFmt: 'MMM d',
  lang: 'Indonesian',
  tz: 'Asia/Jakarta',
  motion: 'system',
  home: 'projects',
  openTasks: 'drawer',
  name: '',
  title: 'Pelajar',
};

/**
 * Membuat dataset kosong untuk pengguna baru atau kondisi logged-out
 */
export function createEmptyDataset(user = null) {
  const id = user?.id || null;
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : '');
  const email = user?.email || '';

  return {
    ws: { name: name ? `Workspace ${name}` : 'Workspace Pelajar', url: 'workspace', c: '#5A67D8', brand: true },
    workspaces: [
      { id: 'w1', name: name ? `Workspace ${name}` : 'Workspace Pelajar', c: '#5A67D8', plan: 'Personal', brand: true },
    ],
    me: id,
    members: id
      ? [
          {
            id,
            name,
            email,
            role: 'Owner',
            team: 'product',
            title: 'Pelajar',
            c: '#5A67D8',
            status: 'active',
            last: 0,
            tz: 'Jakarta',
          },
        ]
      : [],
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

export function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const j = JSON.parse(raw);
      // Hapus data dummy lama jika masih tersimpan
      if (j && j.data) {
        if (j.data.me === 'm1') {
          localStorage.removeItem(STORE_KEY);
          return null;
        }
        return j;
      }
    }
  } catch {
    /* storage blocked or corrupt */
  }
  return null;
}

export const saved = load();

export const S = {
  data: saved?.data || createEmptyDataset(null),
  prefs: Object.assign({}, DEFAULT_PREFS, saved?.prefs || {}),
  views: saved?.views || {},
  ui: {
    fx: {},
    auth: 'login', // Default ke layar login jika belum ada sesi
    authStep: 'login',
    onb: 0,
    onbData: { use: 'product', team: 'kanban', size: '2-10', ws: '', proj: '', tmpl: 'web', invites: '' },
    route: 'projects',
    params: {},
    history: [],
    collapsed: !!saved?.collapsed,
    mnav: false,
    expanded: {},
    drawer: null,
    drawerFull: false,
    drawerTab: 'comments',
    modals: [],
    pop: null,
    palette: null,
    loading: false,
    offline: false,
    sel: new Set(),
    composer: null,
    editCell: null,
    openTasks: {},
    collapsedGroups: {},
    calDate: iso(TODAY),
    calSelectedDate: iso(TODAY),
    calMode: 'month',
    tlZoom: 'week',
    tlGroup: 'status',
    fileView: 'grid',
    projView: 'grid',
    homeTab: 'upcoming',
    inboxCat: 'all',
    inboxUnread: false,
    inboxSel: null,
    notifFilter: 'all',
    settings: 'appearance',
    searchQ: '',
    searchCat: 'all',
    myView: 'list',
    membersTab: 'members',
    collapsedCols: {},
    errors: {},
    drafts: {},
    noteDraft: { active: false, title: '', content: '', color: 'default', pinned: false },
    noteSearch: '',
  },
};

if (S.data && !S.data.notes) {
  S.data.notes = [];
}
if (S.data?.projects) {
  S.data.projects.forEach(p => {
    if (!p.links) p.links = [];
  });
}

/**
 * Menerapkan sesi pengguna dari Supabase ke state aplikasi
 */
export function applyUserSession(user, cloudData = null) {
  if (!user) return;
  const name =
    cloudData?.profile?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    (user.email ? user.email.split('@')[0] : 'Pengguna');
  const title = cloudData?.profile?.title || 'Pelajar';
  const email = user.email || '';
  const avatar = cloudData?.profile?.avatar_url || '';

  S.prefs.name = name;
  S.prefs.title = title;

  S.data.me = user.id;
  S.data.ws = {
    name: name ? `Workspace ${name}` : 'Workspace Pelajar',
    url: 'workspace',
    c: '#5A67D8',
    brand: true,
  };
  S.data.workspaces = [
    { id: 'w1', name: S.data.ws.name, c: '#5A67D8', plan: 'Personal', brand: true },
  ];
  S.data.members = [
    {
      id: user.id,
      name,
      email,
      role: 'Owner',
      team: 'product',
      title,
      c: '#5A67D8',
      status: 'active',
      last: 0,
      tz: 'Jakarta',
      avatar,
    },
  ];

  if (cloudData) {
    S.data.projects = cloudData.projects || [];
    S.data.tasks = cloudData.tasks || [];
    S.data.notes = cloudData.notes || [];
    S.data.projOrder = S.data.projects.map(p => p.id);
  }
}

/**
 * Membersihkan sesi pengguna saat sign out
 */
export function clearUserSession() {
  S.data = createEmptyDataset(null);
  S.prefs.name = '';
  S.prefs.title = 'Pelajar';
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* storage access error ignore */
  }
}

export let _saveT;
export function save() {
  clearTimeout(_saveT);
  _saveT = setTimeout(() => {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ data: S.data, prefs: S.prefs, views: S.views, collapsed: S.ui.collapsed })
      );
      scheduleCloudSync(S.data);
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, 150);
}

/* ---------- lookups ---------- */
export const D = () => S.data;
export const me = () =>
  D().members?.find(m => m.id === D().me) ||
  D().members?.[0] || {
    id: D().me || '',
    name: S.prefs.name || 'Pengguna',
    email: '',
    role: 'Owner',
    title: S.prefs.title || 'Pelajar',
    c: '#5A67D8',
  };
export const mem = id =>
  id
    ? D().members?.find(m => m.id === id) || (id === D().me ? me() : null)
    : null;
export const proj = id => D().projects?.find(p => p.id === id);
export const task = id => D().tasks?.find(t => t.id === id);
export const allNotes = () => (D().notes || (D().notes = []));
export const note = id => allNotes().find(n => n.id === id);
export const pColor = p => PCOLORS[p?.color] || PCOLORS.slate;
export const visibleProjects = () =>
  (D().projects || [])
    .filter(p => !p.archived);
export const canSee = p => !p.private || (p.members && p.members.includes(D().me)) || p.lead === D().me;
export const tasksOf = pid => (D().tasks || []).filter(t => t.project === pid && !t.archived);
export const allTasks = () => (D().tasks || []).filter(t => !t.archived && canSee(proj(t.project)));
export const isOver = t => t.due && t.status !== 'done' && diffD(parse(t.due), TODAY) < 0;
export const commentsOf = tid => (D().comments || []).filter(c => c.task === tid);
export function progressOf(pid) {
  const ts = tasksOf(pid);
  if (!ts.length) return 0;
  return Math.round((ts.filter(t => t.status === 'done').length / ts.length) * 100);
}
export function taskProg(t) {
  if (t.status === 'done') return 100;
  if (t.subtasks && t.subtasks.length) return Math.round((t.subtasks.filter(s => s.done).length / t.subtasks.length) * 100);
  return { backlog: 0, todo: 5, progress: 45, review: 80 }[t.status] || 0;
}

/* ---------- activity + notification helpers ---------- */
export function logAct(verb, t, extra = '') {
  if (!D().activity) D().activity = [];
  D().activity.unshift({ id: uid('a'), by: D().me, verb, task: t?.id || null, project: t?.project || null, at: Date.now(), extra });
  if (t) t.updated = Date.now();
}

/* ---------- teams ---------- */
export const NO_TEAM = { id: '', name: 'No team', icon: 'users', c: '#8A867E', desc: '' };
export function teamsList() {
  const d = D();
  if (!d.teams) d.teams = TEAMS_SEED.map(t => ({ ...t }));
  return d.teams;
}
export function team(id) {
  return teamsList().find(t => t.id === id) || null;
}
export const TM = new Proxy({}, { get: (_, k) => team(k) || NO_TEAM });
