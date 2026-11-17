/* ---------- supabase client & database services ---------- */
import { createClient } from '@supabase/supabase-js';

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
 * Update profil pengguna (nama, gelar/title, avatar) di Supabase Auth & Tabel Profiles
 */
export async function updateProfile({ name, title, avatar_url }) {
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
  return {
    id: String(p.id),
    user_id: userId,
    name: p.name || 'Proyek Tanpa Nama',
    desc: p.desc || '',
    category: ['lomba', 'skl', 'umum'].includes(p.category) ? p.category : 'umum',
    icon: p.icon || 'folder',
    color: p.color || 'indigo',
    status: p.status || 'active',
    due: p.due ? new Date(p.due).toISOString() : null,
    start_date: p.start ? new Date(p.start).toISOString() : null,
    progress: typeof p.progress === 'number' ? Math.max(0, Math.min(100, p.progress)) : 0,
    fav: Boolean(p.fav),
    links: Array.isArray(p.links) ? p.links : [],
    milestones: Array.isArray(p.milestones) ? p.milestones : [],
  };
}

export function mapRowToProject(row) {
  return {
    id: row.id,
    key: (row.name || 'PRJ').toUpperCase().slice(0, 5),
    name: row.name,
    desc: row.desc || '',
    category: row.category || 'umum',
    icon: row.icon || 'folder',
    color: row.color || 'indigo',
    status: row.status || 'active',
    due: row.due ? row.due.slice(0, 10) : null,
    start: row.start_date ? row.start_date.slice(0, 10) : null,
    progress: row.progress || 0,
    fav: Boolean(row.fav),
    links: Array.isArray(row.links) ? row.links : [],
    milestones: Array.isArray(row.milestones) ? row.milestones : [],
    members: [row.user_id],
    lead: row.user_id,
    team: 'product',
    last: 0,
  };
}

export function mapTaskToRow(t, userId) {
  return {
    id: String(t.id),
    user_id: userId,
    project_id: t.project || null,
    title: t.title || 'Tugas Baru',
    desc: t.desc || '',
    status: ['todo', 'progress', 'done'].includes(t.status) ? t.status : 'todo',
    priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium',
    due: t.due ? new Date(t.due).toISOString() : null,
    start_date: t.start ? new Date(t.start).toISOString() : null,
    labels: Array.isArray(t.labels) ? t.labels : [],
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    fav: Boolean(t.fav),
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
    order: row.task_order || 0,
    assignee: row.user_id,
    attachments: [],
    deps: [],
  };
}

export function mapNoteToRow(n, userId) {
  return {
    id: String(n.id),
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

/**
 * Tarik seluruh data (projects, tasks, notes, profile) dari Supabase untuk user aktif
 */
export async function fetchAllUserData(userId) {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const [profRes, projRes, taskRes, noteRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('notes').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    ]);

    return {
      profile: profRes.data || null,
      projects: (projRes.data || []).map(mapRowToProject),
      tasks: (taskRes.data || []).map(mapRowToTask),
      notes: (noteRes.data || []).map(mapRowToNote),
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
 * Sinkronisasi debounced perubahan lokal ke cloud Supabase
 */
let _cloudSyncT;
export function scheduleCloudSync(data) {
  if (!isSupabaseConfigured || !data) return;
  clearTimeout(_cloudSyncT);
  _cloudSyncT = setTimeout(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      if (data.projects && data.projects.length) {
        const rows = data.projects.map(p => mapProjectToRow(p, user.id));
        await supabase.from('projects').upsert(rows);
      }
      if (data.tasks && data.tasks.length) {
        const rows = data.tasks.map(t => mapTaskToRow(t, user.id));
        await supabase.from('tasks').upsert(rows);
      }
      if (data.notes && data.notes.length) {
        const rows = data.notes.map(n => mapNoteToRow(n, user.id));
        await supabase.from('notes').upsert(rows);
      }
    } catch (err) {
      console.warn('[Supabase] Gagal sinkronisasi data ke cloud:', err);
    }
  }, 1000);
}
