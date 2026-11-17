/* ---------- supabase client & database services ---------- */
import { createClient } from '@supabase/supabase-js';
import { isUuid, uuid } from './utils.js';

const rawUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

/**
 * Memeriksa apakah konfigurasi Supabase valid dan bukan placeholder bawaan.
 */
export const isSupabaseConfigured = Boolean(
  rawUrl &&
    rawKey &&
    !rawUrl.includes('your-project-id') &&
    !rawUrl.includes('placeholder') &&
    !rawKey.includes('your-anon-public-api-key') &&
    !rawKey.includes('placeholder')
);

// Peringatan jika variabel lingkungan belum dikonfigurasi
if (!isSupabaseConfigured) {
  console.info(
    '%c[Gr8r Studio: Supabase]%c Variabel Supabase belum diatur di .env.\n' +
      'Silakan isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY untuk menggunakan autentikasi dan database cloud.',
    'color: #6366f1; font-weight: bold;',
    'color: inherit;'
  );
}

/**
 * Safe fallback proxy client saat Supabase belum dikonfigurasi
 */
function createSafeFallbackClient() {
  const handler = {
    get(_target, prop) {
      if (prop === 'then') {
        const p = Promise.resolve({
          data: null,
          error: new Error('Supabase client belum dikonfigurasi. Periksa berkas .env Anda.'),
        });
        return p.then.bind(p);
      }
      if (prop === 'catch') {
        const p = Promise.resolve({
          data: null,
          error: new Error('Supabase client belum dikonfigurasi. Periksa berkas .env Anda.'),
        });
        return p.catch.bind(p);
      }
      return new Proxy(() => new Proxy({}, handler), handler);
    },
    apply() {
      return new Proxy(() => new Proxy({}, handler), handler);
    },
  };
  return new Proxy({}, handler);
}

/**
 * Instance Supabase Client
 */
export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createSafeFallbackClient();

/* ==============================================================================
   AUTH SERVICES (100% SUPABASE AUTHENTICATION)
   ============================================================================== */

/**
 * Ambil user aktif saat ini dari Supabase
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch (err) {
    console.warn('[Supabase] Error pada getCurrentUser:', err);
    return null;
  }
}

/**
 * Ambil sesi aktif saat ini dari Supabase
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  if (!isSupabaseConfigured) return null;
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  } catch (err) {
    console.warn('[Supabase] Error pada getSession:', err);
    return null;
  }
}

/**
 * Masuk akun menggunakan Email dan Password via Supabase Auth
 */
export async function signIn({ email, password }) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase belum terkonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env'),
    };
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Daftar akun baru menggunakan Email dan Password via Supabase Auth
 */
export async function signUp({ email, password, name }) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase belum terkonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env'),
    };
  }
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        name: name,
      },
    },
  });
}

/**
 * Masuk via OAuth (Google, Microsoft/Azure, Apple)
 */
export async function signInWithOAuth(provider) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase belum terkonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env'),
    };
  }
  const p = String(provider).toLowerCase();
  const prov = p === 'microsoft' ? 'azure' : p;
  return await supabase.auth.signInWithOAuth({
    provider: prov,
    options: {
      redirectTo: window.location.origin,
    },
  });
}

/**
 * Keluar akun (Sign Out)
 */
export async function signOut() {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  return await supabase.auth.signOut();
}

/**
 * Reset password via link email
 */
export async function resetPassword(email) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase belum terkonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env'),
    };
  }
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/#auth=reset`,
  });
}

/**
 * Update password pengguna aktif di Supabase
 */
export async function updatePassword(newPassword) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase belum terkonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env'),
    };
  }
  return await supabase.auth.updateUser({ password: newPassword });
}

/**
 * Update profil pengguna (nama, gelar/title, avatar, tema) di Supabase Auth & Tabel Profiles
 */
export async function updateProfile({ name, title, avatar_url, theme }) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase belum terkonfigurasi. Masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env'),
    };
  }
  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('Pengguna belum masuk') };

  const authMetaUpdates = {};
  if (name !== undefined) {
    authMetaUpdates.full_name = name;
    authMetaUpdates.name = name;
  }
  if (avatar_url !== undefined) authMetaUpdates.avatar_url = avatar_url;

  if (Object.keys(authMetaUpdates).length > 0) {
    await supabase.auth.updateUser({ data: authMetaUpdates });
  }

  const profileRow = { id: user.id };
  if (name !== undefined) profileRow.name = name;
  if (title !== undefined) profileRow.title = title;
  if (avatar_url !== undefined) profileRow.avatar_url = avatar_url;
  if (theme !== undefined) profileRow.theme = theme;

  return await supabase.from('profiles').upsert(profileRow);
}

/**
 * Kirim ulang email verifikasi pendaftaran
 */
export async function resendVerification(email) {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase belum terkonfigurasi.'),
    };
  }
  return await supabase.auth.resend({
    type: 'signup',
    email,
  });
}

/**
 * Berlangganan perubahan status otentikasi Supabase
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) return null;
  try {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  } catch (err) {
    console.warn('[Supabase] Error pada onAuthStateChange:', err);
    return null;
  }
}

/* ==============================================================================
   DATABASE MAPPERS & CRUD SERVICES
   ============================================================================== */

export function mapProjectToRow(p, userId) {
  const id = isUuid(p.id) ? p.id : (p.id = uuid());
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const links = Array.isArray(p.links) ? [...p.links] : [];
  if (p.image && !links.some(l => l.type === '__image_meta__')) {
    links.push({ id: '__image__', type: '__image_meta__', label: 'image', url: p.image });
  }
  return {
    id: String(id),
    user_id: userId,
    name: p.name || 'Proyek Tanpa Nama',
    desc: p.desc || '',
    category: ['lomba', 'skl', 'umum'].includes(p.category) ? p.category : 'umum',
    icon: p.icon || 'folder',
    color: p.color || 'indigo',
    image: p.image || null,
    status: p.status || 'active',
    due: p.due ? new Date(p.due).toISOString() : null,
    start_date: p.start ? new Date(p.start).toISOString() : null,
    progress: typeof p.progress === 'number' ? Math.max(0, Math.min(100, Math.round(p.progress))) : 0,
    fav: Boolean(p.fav),
    archived: Boolean(p.archived),
    archived_at: p.archivedAt
      ? (typeof p.archivedAt === 'number' ? new Date(p.archivedAt).toISOString() : p.archivedAt)
      : (p.archived ? new Date().toISOString() : null),
    links,
    milestones: Array.isArray(p.milestones) ? p.milestones : [],
    tags,
  };
}

export function mapRowToProject(row) {
  let tags = Array.isArray(row.tags) ? row.tags : [];
  if (!tags.length && Array.isArray(row.links)) {
    const metaTag = row.links.find(l => l.type === '__tags_meta__');
    if (metaTag && metaTag.url) {
      try {
        tags = JSON.parse(metaTag.url);
      } catch {
        /* ignore */
      }
    }
  }
  let image = row.image || null;
  if (!image && Array.isArray(row.links)) {
    const imgMeta = row.links.find(l => l.type === '__image_meta__');
    if (imgMeta && imgMeta.url) image = imgMeta.url;
  }
  return {
    id: row.id,
    key: (row.name || 'PRJ').toUpperCase().slice(0, 5),
    name: row.name,
    desc: row.desc || '',
    category: row.category || 'umum',
    icon: row.icon || 'folder',
    color: row.color || 'indigo',
    image,
    status: row.status || 'active',
    due: row.due ? row.due.slice(0, 10) : null,
    start: row.start_date ? row.start_date.slice(0, 10) : null,
    progress: row.progress || 0,
    fav: Boolean(row.fav),
    archived: Boolean(row.archived),
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : null,
    links: Array.isArray(row.links) ? row.links.filter(l => l.type !== '__tags_meta__' && l.type !== '__image_meta__') : [],
    milestones: Array.isArray(row.milestones) ? row.milestones : [],
    tags: Array.isArray(tags) ? tags : [],
    members: [row.user_id],
    lead: row.user_id,
    team: 'product',
    last: 0,
  };
}

/**
 * Upsert projects dengan fallback cerdas jika kolom 'tags' belum ada di database Supabase
 */
async function upsertProjectsWithFallback(rows) {
  const { error } = await supabase.from('projects').upsert(rows);
  if (error && (error.code === '42703' || String(error.message).includes('tags') || String(error.message).includes('image'))) {
    const fallbackRows = rows.map(r => {
      const copy = { ...r };
      const tags = copy.tags || [];
      delete copy.tags;
      delete copy.image;
      const linksWithoutMeta = (copy.links || []).filter(l => l.type !== '__tags_meta__');
      if (tags.length) {
        linksWithoutMeta.push({ id: '__tags__', type: '__tags_meta__', label: 'tags', url: JSON.stringify(tags) });
      }
      copy.links = linksWithoutMeta;
      return copy;
    });
    return await supabase.from('projects').upsert(fallbackRows);
  }
  return { error };
}

export function mapTaskToRow(t, userId) {
  const id = isUuid(t.id) ? t.id : (t.id = uuid());
  const validStatuses = ['backlog', 'todo', 'progress', 'review', 'done'];
  const validPriorities = ['urgent', 'high', 'medium', 'low', 'none'];
  const projId = t.project && isUuid(t.project) ? t.project : null;
  return {
    id: String(id),
    user_id: userId,
    project_id: projId,
    title: t.title || 'Tugas Baru',
    desc: t.desc || '',
    status: validStatuses.includes(t.status) ? t.status : 'todo',
    priority: validPriorities.includes(t.priority) ? t.priority : 'medium',
    due: t.due ? new Date(t.due).toISOString() : null,
    start_date: t.start ? new Date(t.start).toISOString() : null,
    labels: Array.isArray(t.labels) ? t.labels : [],
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    fav: Boolean(t.fav),
    archived: Boolean(t.archived),
    archived_at: t.archivedAt
      ? (typeof t.archivedAt === 'number' ? new Date(t.archivedAt).toISOString() : t.archivedAt)
      : (t.archived ? new Date().toISOString() : null),
    task_order: typeof t.order === 'number' ? t.order : 0,
  };
}

export function mapRowToTask(row) {
  return {
    id: row.id,
    key: `TSK-${String(row.id).slice(-4)}`,
    project: row.project_id,
    title: row.title,
    desc: row.desc || '',
    status: row.status || 'todo',
    priority: row.priority || 'medium',
    due: row.due ? row.due.slice(0, 10) : null,
    start: row.start_date ? row.start_date.slice(0, 10) : null,
    labels: Array.isArray(row.labels) ? row.labels : [],
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    fav: Boolean(row.fav),
    archived: Boolean(row.archived),
    archivedAt: row.archived_at ? new Date(row.archived_at).getTime() : null,
    order: Number(row.task_order) || 0,
    assignee: row.user_id,
    attachments: [],
    deps: [],
  };
}

export function mapNoteToRow(n, userId) {
  const id = isUuid(n.id) ? n.id : (n.id = uuid());
  return {
    id: String(id),
    user_id: userId,
    title: n.title || '',
    content: n.content || '',
    color: n.color || 'default',
    pinned: Boolean(n.pinned),
  };
}

export function mapRowToNote(row) {
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    color: row.color || 'default',
    pinned: Boolean(row.pinned),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapActivityToRow(act, userId) {
  const id = isUuid(act.id) ? act.id : (act.id = uuid());
  const taskId = act.task && isUuid(act.task) ? act.task : (act.task_id && isUuid(act.task_id) ? act.task_id : null);
  const projId = act.project && isUuid(act.project) ? act.project : (act.project_id && isUuid(act.project_id) ? act.project_id : null);
  return {
    id: String(id),
    user_id: userId,
    by_user: act.by || act.by_user || userId,
    verb: act.verb || 'aktivitas',
    task_id: taskId,
    project_id: projId,
    extra: act.extra || '',
    created_at: act.at ? new Date(act.at).toISOString() : new Date().toISOString(),
  };
}

export function mapRowToActivity(row) {
  return {
    id: row.id,
    by: row.by_user || row.user_id,
    verb: row.verb,
    task: row.task_id,
    project: row.project_id,
    extra: row.extra || '',
    at: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

/**
 * Simpan aktivitas langsung ke tabel activity Supabase
 */
export async function saveActivityToCloud(act, userId) {
  if (!isSupabaseConfigured || !act) return;
  try {
    const uid = userId || (await getCurrentUser())?.id;
    if (!uid) return;
    const row = mapActivityToRow(act, uid);
    const { error } = await supabase.from('activity').upsert(row);
    if (error) {
      console.error('[Supabase] Gagal menyimpan aktivitas:', error);
    }
  } catch (err) {
    console.warn('[Supabase] Gagal menyimpan aktivitas ke cloud:', err);
  }
}

/**
 * Simpan proyek langsung ke Supabase
 */
export async function saveProjectToCloud(project) {
  if (!isSupabaseConfigured || !project) return;
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const row = mapProjectToRow(project, user.id);
    const { error } = await upsertProjectsWithFallback([row]);
    if (error) {
      console.error('[Supabase] Gagal menyimpan proyek langsung:', error);
    }
  } catch (err) {
    console.warn('[Supabase] Gagal menyimpan proyek langsung:', err);
  }
}

/**
 * Simpan tugas langsung ke Supabase
 */
export async function saveTaskToCloud(task) {
  if (!isSupabaseConfigured || !task) return;
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const row = mapTaskToRow(task, user.id);
    const { error } = await supabase.from('tasks').upsert(row);
    if (error) {
      console.error('[Supabase] Gagal menyimpan tugas langsung:', error);
    }
  } catch (err) {
    console.warn('[Supabase] Gagal menyimpan tugas langsung:', err);
  }
}

/**
 * Simpan catatan langsung ke Supabase
 */
export async function saveNoteToCloud(note) {
  if (!isSupabaseConfigured || !note) return;
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const row = mapNoteToRow(note, user.id);
    const { error } = await supabase.from('notes').upsert(row);
    if (error) {
      console.error('[Supabase] Gagal menyimpan catatan langsung:', error);
    }
  } catch (err) {
    console.warn('[Supabase] Gagal menyimpan catatan langsung:', err);
  }
}

/**
 * Tarik seluruh data (projects, tasks, notes, activity, profile) dari Supabase untuk user aktif
 */
export async function fetchAllUserData(userId) {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const [profRes, projRes, taskRes, noteRes, actRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
      supabase.from('activity').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    ]);

    return {
      profile: profRes.data || null,
      projects: (projRes.data || []).map(mapRowToProject),
      tasks: (taskRes.data || []).map(mapRowToTask),
      notes: (noteRes.data || []).map(mapRowToNote),
      activity: (actRes.data || []).map(mapRowToActivity),
    };
  } catch (err) {
    console.error('[Supabase] Gagal mengambil data pengguna:', err);
    return null;
  }
}

/**
 * Hapus Proyek di Supabase
 */
export async function deleteProjectFromCloud(projectId) {
  if (!isSupabaseConfigured) return;
  const user = await getCurrentUser();
  if (!user) return;
  return await supabase.from('projects').delete().eq('id', String(projectId)).eq('user_id', user.id);
}

/**
 * Hapus Tugas di Supabase
 */
export async function deleteTaskFromCloud(taskId) {
  if (!isSupabaseConfigured) return;
  const user = await getCurrentUser();
  if (!user) return;
  return await supabase.from('tasks').delete().eq('id', String(taskId)).eq('user_id', user.id);
}

/**
 * Hapus Catatan di Supabase
 */
export async function deleteNoteFromCloud(noteId) {
  if (!isSupabaseConfigured) return;
  const user = await getCurrentUser();
  if (!user) return;
  return await supabase.from('notes').delete().eq('id', String(noteId)).eq('user_id', user.id);
}

/**
 * Hapus Riwayat Aktivitas di Supabase
 */
export async function deleteActivityFromCloud(actId) {
  if (!isSupabaseConfigured) return;
  const user = await getCurrentUser();
  if (!user) return;
  return await supabase.from('activity').delete().eq('id', String(actId)).eq('user_id', user.id);
}

/**
 * Sinkronisasi instan perubahan lokal ke cloud Supabase
 */
let _cloudSyncT;
let _pendingData = null;
let _pendingPrefs = null;

export async function flushCloudSync(data = null, prefs = null) {
  clearTimeout(_cloudSyncT);
  const targetData = data || _pendingData;
  const targetPrefs = prefs || _pendingPrefs;
  if (!isSupabaseConfigured || !targetData) return;
  _pendingData = null;
  _pendingPrefs = null;

  try {
    const user = await getCurrentUser();
    if (!user) return;

    const upserts = [];

    if (targetData.projects && targetData.projects.length) {
      const rows = targetData.projects.map(p => mapProjectToRow(p, user.id));
      upserts.push(
        upsertProjectsWithFallback(rows).then(({ error }) => {
          if (error) console.error('[Supabase] Gagal upsert projects:', error);
        })
      );
    }
    if (targetData.tasks && targetData.tasks.length) {
      const rows = targetData.tasks.map(t => mapTaskToRow(t, user.id));
      upserts.push(
        supabase.from('tasks').upsert(rows).then(({ error }) => {
          if (error) console.error('[Supabase] Gagal upsert tasks:', error);
        })
      );
    }
    if (targetData.notes && targetData.notes.length) {
      const rows = targetData.notes.map(n => mapNoteToRow(n, user.id));
      upserts.push(
        supabase.from('notes').upsert(rows).then(({ error }) => {
          if (error) console.error('[Supabase] Gagal upsert notes:', error);
        })
      );
    }
    if (targetData.activity && targetData.activity.length) {
      const recentActs = targetData.activity.slice(0, 50);
      const rows = recentActs.map(a => mapActivityToRow(a, user.id));
      upserts.push(
        supabase.from('activity').upsert(rows).then(({ error }) => {
          if (error) console.error('[Supabase] Gagal upsert activity:', error);
        })
      );
    }
    if (targetPrefs?.theme) {
      upserts.push(supabase.from('profiles').update({ theme: targetPrefs.theme }).eq('id', user.id));
    }

    await Promise.all(upserts);
  } catch (err) {
    console.warn('[Supabase] Gagal sinkronisasi data ke cloud:', err);
  }
}

/**
 * Jadwalkan sinkronisasi debounced (200ms) ke Supabase
 */
export function scheduleCloudSync(data, prefs = null) {
  if (!isSupabaseConfigured || !data) return;
  _pendingData = data;
  if (prefs) _pendingPrefs = prefs;
  clearTimeout(_cloudSyncT);
  _cloudSyncT = setTimeout(() => {
    flushCloudSync();
  }, 200);
}

// Pasang listener browser untuk flush otomatis saat tab ditinggalkan atau ditutup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushCloudSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushCloudSync();
    }
  });
}
