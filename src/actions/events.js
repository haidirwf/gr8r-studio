/* =====================================================================
   EVENT WIRING
   ===================================================================== */
import { $$ } from '../core/utils.js';
import { S } from '../core/store.js';
import { render } from '../shell/render.js';
import { placeAnchoredModals } from '../overlays/modals.js';
import { A, BLUR, DBL, IN } from './actions.js';

document.addEventListener(
  'click',
  e => {
    if (S.ui.suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const el = e.target.closest('[data-a]');
    const inPop = e.target.closest('[data-pop-root]');
    if (S.ui.pop && !inPop) {
      const trig = el && (el.dataset.a === 'pop' || el.dataset.a === 'ctxBtn' || el.dataset.a === 'addFilter');
      if (!trig) {
        S.ui.pop = null;
        if (!el) {
          render();
          return;
        }
      }
    }
    if (S.ui.mention && !e.target.closest('.cbox') && !(el && el.dataset.a === 'pickMention')) {
      S.ui.mention = null;
      if (!el) render();
    }
    if (!el) return;
    if (el.tagName === 'BUTTON' || (el.tagName === 'INPUT' && el.type === 'checkbox' && el.dataset.a)) e.preventDefault();
    const fn = A[el.dataset.a];
    if (fn) {
      e.stopPropagation();
      fn(el, e);
    }
  },
  false,
);
document.addEventListener('dblclick', e => {
  const el = e.target.closest('[data-dbl]');
  if (el && DBL[el.dataset.dbl]) DBL[el.dataset.dbl](el, e);
});
document.addEventListener('contextmenu', e => {
  const el = e.target.closest('[data-ctx]');
  if (!el || e.target.closest('input,textarea,[contenteditable]')) return;
  e.preventDefault();
  S.ui.pop = {
    type: 'ctx',
    ctx: el.dataset.ctx,
    id: el.dataset.id || el.dataset.date,
    date: el.dataset.date,
    key: el.dataset.key,
    vid: el.dataset.vid,
    x: e.clientX,
    y: e.clientY,
    top: e.clientY,
  };
  if (el.dataset.ctx === 'column') S.ui.pop.key = el.dataset.key;
  render();
});
export const isChangeEl = el => el.matches('select, input[type=checkbox], input[type=radio], input[type=file], input[type=date]');
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.dataset || !el.dataset.in || isChangeEl(el)) return;
  IN[el.dataset.in]?.(el, e);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (!el.dataset || !el.dataset.in || !isChangeEl(el)) return;
  IN[el.dataset.in]?.(el, e);
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const n = f.dataset.submit;
  if (n && A[n]) A[n](f, e);
});
document.addEventListener('focusout', e => {
  const el = e.target;
  if (el?.dataset?.blur && BLUR[el.dataset.blur]) BLUR[el.dataset.blur](el);
  if (['input', 'textarea'].includes(el?.tagName?.toLowerCase()) || el?.isContentEditable) {
    window.scrollTo(0, 0);
  }
});
document.addEventListener('mouseover', e => {
  const el = e.target.closest?.('[data-hover-i]');
  if (!el || !S.ui.palette) return;
  const i = +el.dataset.hoverI;
  if (S.ui.palette.hl === i) return;
  S.ui.palette.hl = i;
  $$('.pi.hl').forEach(x => x.classList.remove('hl'));
  el.classList.add('hl');
});
addEventListener('resize', () => {
  if (S.ui.pop) {
    S.ui.pop = null;
    render();
  }
  placeAnchoredModals();
});
try {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (S.prefs.theme === 'system') render();
  });
} catch {
  /* not supported here; safe to skip */
}

// Calendar wheel / scroll to change month
let calWheelCooldown = 0;
let calWheelAccum = 0;

document.addEventListener(
  'wheel',
  e => {
    const wrap = e.target.closest?.('.cal-g, .cal-month-wrap, .cal-toolbar');
    if (!wrap) return;

    // Do not intercept if an overlay, modal, drawer, palette, or popover is open
    if (S.ui.pop || S.ui.modals.length || S.ui.palette || S.ui.drawer) return;

    const now = Date.now();
    if (now - calWheelCooldown < 400) {
      e.preventDefault();
      return;
    }

    const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(dy) < 6) return;

    calWheelAccum += dy;

    if (Math.abs(calWheelAccum) >= 30) {
      const dir = calWheelAccum > 0 ? 1 : -1;
      calWheelAccum = 0;
      calWheelCooldown = now;
      e.preventDefault();
      A.calNav({ dataset: { d: dir } });
    }
  },
  { passive: false },
);

// Calendar touch swipe to change month
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

document.addEventListener(
  'touchstart',
  e => {
    const grid = e.target.closest?.('.cal-g');
    if (!grid || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  },
  { passive: true },
);

document.addEventListener(
  'touchend',
  e => {
    if (!touchStartTime || Date.now() - touchStartTime > 600) return;
    const grid = e.target.closest?.('.cal-g');
    if (!grid || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartTime = 0;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const dir = dx < 0 ? 1 : -1;
      A.calNav({ dataset: { d: dir } });
    }
  },
  { passive: true },
);
