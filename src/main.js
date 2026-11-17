/* =====================================================================
   ENTRY: styles, then every module in dependency order (several register
   global listeners or add handlers to the action table when they load), then boot.
   ===================================================================== */
import './styles/index.css';
import './core/utils.js';
import './core/icons.js';
import './core/constants.js';
import './core/store.js';
import './ui/helpers.js';
import './core/theme.js';
import './ui/toast.js';
import './ui/select.js';
import './shell/render.js';
import './shell/layout.js';
import './shell/skeletons.js';
import './shell/view-engine.js';
import './components/task-list.js';
import './pages/home.js';
import './pages/overview.js';
import './pages/my-tasks.js';
import './pages/tasks.js';
import './pages/inbox.js';
import './pages/notifications.js';
import './pages/favorites.js';
import './pages/projects.js';
import './pages/members.js';
import './pages/activity.js';
import './pages/search.js';
import './pages/errors.js';
import './pages/project.js';
import './views/project-overview.js';
import './views/board.js';
import './views/calendar.js';
import './views/timeline.js';
import './views/files.js';
import './overlays/drawer.js';
import './overlays/modals.js';
import './overlays/popovers.js';
import './overlays/context-menu.js';
import './overlays/palette.js';
import './pages/settings.js';
import './pages/auth.js';
import './pages/design-system.js';
import './actions/actions.js';
import './actions/events.js';
import './actions/keyboard.js';
import './actions/drag-drop.js';
import './features/teams.js';
import './features/subtasks.js';
import './features/archive.js';
import './actions/teams.js';
import './actions/subtasks.js';
import './actions/archive.js';
import { S, D, applyUserSession, clearUserSession } from './core/store.js';
import { A } from './actions/actions.js';
import { render, go, parseHash, isSyncingHash } from './shell/render.js';
import {
  getSession,
  fetchAllUserData,
  onAuthStateChange,
} from './core/supabase.js';

let _sessionChecked = false;

async function syncFromHash() {
  const parsed = parseHash(location.hash);

  // Periksa sesi Supabase jika belum diverifikasi
  if (!_sessionChecked) {
    _sessionChecked = true;
    const session = await getSession();
    if (session?.user) {
      const cloudData = await fetchAllUserData(session.user.id);
      applyUserSession(session.user, cloudData);
      S.ui.auth = null;
    } else {
      clearUserSession();
      S.ui.auth = parsed?.auth || 'login';
      render();
      return;
    }
  }

  // Cek apakah pengguna memiliki sesi aktif
  const session = await getSession();
  if (!session?.user) {
    clearUserSession();
    S.ui.auth = parsed?.auth || 'login';
    render();
    return;
  }

  if (parsed) {
    if (parsed.auth && parsed.auth === 'reset') {
      S.ui.auth = 'reset';
      render();
    } else if (parsed.auth) {
      S.ui.auth = parsed.auth;
      render();
    } else {
      S.ui.auth = null;
      go(parsed.route, parsed.params, { fromHash: true });
    }
  } else {
    S.ui.auth = null;
    const defaultRoute = S.prefs.home || 'projects';
    go(defaultRoute, {}, { fromHash: true, replace: true });
  }
}

(function init() {
  document.documentElement.lang = 'en';
  if (!document.getElementById('sr-live')) {
    const l = document.createElement('div');
    l.id = 'sr-live';
    l.className = 'sr';
    l.setAttribute('aria-live', 'polite');
    document.body.appendChild(l);
  }

  onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const cloudData = await fetchAllUserData(session.user.id);
      applyUserSession(session.user, cloudData);
      S.ui.auth = null;
      render();
    } else if (event === 'SIGNED_OUT') {
      clearUserSession();
      S.ui.auth = 'login';
      render();
    } else if (event === 'PASSWORD_RECOVERY') {
      S.ui.auth = 'reset';
      render();
    }
  });

  syncFromHash();
})();

window.addEventListener('hashchange', () => {
  if (isSyncingHash()) return;
  syncFromHash();
});

// Dev-only handle for debugging and screenshot tooling; stripped from production builds.
if (import.meta.env.DEV) window.__gr8r = { S, D, A, go, render };

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

