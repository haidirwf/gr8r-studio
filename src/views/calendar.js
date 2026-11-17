/* ---------- CALENDAR (Month Only & Extra Spacious) ---------- */
import { MONL, TODAY, WD, addD, diffD, esc, fmtDate, iso, parse, sod } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { D, S, allTasks, pColor, proj } from '../core/store.js';
import { av, prIcon, stIcon } from '../ui/helpers.js';
import { fxc } from '../shell/render.js';
import { applyView, viewOf, viewToolbar } from '../shell/view-engine.js';

export function startOfWeek(d) {
  const x = sod(d);
  const ws = S.prefs.weekStart;
  const diff = (x.getDay() - ws + 7) % 7;
  return addD(x, -diff);
}

function renderCalItem(it) {
  const t = it.t || it;
  if (!t || !t.id) return '';
  const p = proj(t.project);
  const isDone = t.status === 'done';
  const isOver = t.due && !isDone && diffD(parse(t.due), TODAY) < 0;
  return `<div class="cal-agenda-card ${isDone ? 'done' : ''}" style="--c:${pColor(p)}" data-a="openQuickTask" data-id="${t.id}" data-ctx="task" role="button" tabindex="0">
    <button class="cal-agenda-check ${isDone ? 'on' : ''}" data-a="toggleTaskDone" data-id="${t.id}" aria-label="Toggle task done">
      ${isDone ? ic('check', 12) : ''}
    </button>
    <div class="cal-agenda-info grow trunc">
      <div class="cal-agenda-title-text ${isDone ? 'done' : ''}">${esc(t.title)}</div>
      <div class="cal-agenda-meta">
        <span class="pdot" style="--c:${pColor(p)}"></span>
        <span class="trunc ptag">${esc(p?.name || 'Tugas')}</span>
        ${t.due ? `<span class="cal-meta-badge ${isOver ? 'overdue' : ''}">${isOver ? ic('alert-circle', 11) + ' ' : ''}${fmtDate(t.due)}</span>` : ''}
        ${prIcon(t.priority, 12)}
      </div>
    </div>
    <span class="ibtn ibtn-xs hide-m text-muted">${ic('chevron-right', 14)}</span>
  </div>`;
}

export function calendarHtml(ts, opt = {}) {
  const cur = parse(S.ui.calDate || iso(TODAY));
  const selectedDate = S.ui.calSelectedDate || iso(TODAY);
  const evs = opt.events ? D().events.filter(e => !opt.project || e.project === opt.project) : [];
  const itemsOn = ds => [...evs.filter(e => e.date === ds).map(e => ({ ev: e })), ...ts.filter(t => t.due === ds).map(t => ({ t }))];
  const wdn = Array.from({ length: 7 }, (_, i) => WD[(i + S.prefs.weekStart) % 7]);

  const chip = it => {
    if (it.ev) {
      const p = proj(it.ev.project);
      return `<button class="cev event" style="--c:${pColor(p)}" data-a="pop" data-pop="event" data-id="${it.ev.id}" title="${esc(it.ev.title)} · ${it.ev.time}"><span class="num faint" style="font-size:11px">${it.ev.time}</span><span class="trunc">${esc(it.ev.title)}</span></button>`;
    }
    const t = it.t;
    const p = proj(t.project);
    return `<button class="cev ${t.status === 'done' ? 'done' : ''}${fxc('moved', t.id)}" style="--c:${pColor(p)}" draggable="true" data-drag-cal="${t.id}" data-a="openQuickTask" data-id="${t.id}" data-ctx="task" title="${esc(t.title)}">${t.status === 'done' ? stIcon('done', 11) : prIcon(t.priority, 11)}<span class="trunc">${esc(t.title)}</span>${av(t.assignee, '', false)}</button>`;
  };

  const label = `${MONL[cur.getMonth()]} ${cur.getFullYear()}`;
  const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const start = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addD(start, i));
  const trimmed = cells[35].getMonth() !== cur.getMonth() ? cells.slice(0, 35) : cells;

  const selectedItems = itemsOn(selectedDate);
  const isSelectedToday = diffD(parse(selectedDate), TODAY) === 0;

  const projs = [...new Set(ts.map(t => t.project))].map(proj).filter(Boolean);

  return `<div class="cal">
    <div class="cal-toolbar">
      <div class="cal-nav-group">
        <div class="cal-arrows-box">
          <button class="cal-arrow-btn" data-a="calNav" data-d="-1" aria-label="Bulan Sebelumnya">${ic('chevron-left', 16)}</button>
          <button class="cal-arrow-btn" data-a="calNav" data-d="1" aria-label="Bulan Selanjutnya">${ic('chevron-right', 16)}</button>
        </div>
        <h2 class="cal-label" aria-live="polite">${label}</h2>
        <button class="btn btn-secondary btn-sm cal-today-btn" data-a="calNav" data-d="0">Hari Ini</button>
      </div>
      <div class="cal-actions-group">
        ${!opt.project && projs.length > 0
          ? `<span class="row hide-m" style="gap:10px;font-size:12px;color:var(--text-2);margin-right:8px">${projs
              .map(p => `<span class="row" style="gap:5px"><span class="pdot" style="--c:${pColor(p)}"></span>${esc(p.name)}</span>`)
              .join('')}</span>`
          : ''}
      </div>
    </div>

    <div class="cal-month-wrap">
      <div class="cal-h">${wdn.map(d => `<div>${d}</div>`).join('')}</div>
      <div class="cal-g" style="grid-template-rows:repeat(${trimmed.length / 7},minmax(auto,1fr))">${trimmed
        .map(d => {
          const ds = iso(d);
          const items = itemsOn(ds);
          const isToday = diffD(d, TODAY) === 0;
          const isSelected = ds === selectedDate;
          const isOut = d.getMonth() !== cur.getMonth();
          return `<div class="cday ${isOut ? 'out' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-drop-day="${ds}" data-a="selectCalDay" data-date="${ds}">
            <div class="cday-top">
              <span class="dn" ${isToday ? 'aria-current="date"' : ''}>${d.getDate()}</span>
              <button class="ibtn ibtn-xs add hide-m" data-a="newTask" data-due="${ds}" ${opt.project ? `data-project="${opt.project}"` : ''} aria-label="Tambah tugas pada ${fmtDate(ds)}">${ic('plus', 13)}</button>
            </div>
            <div class="cday-dots">${items.slice(0, 4).map(it => {
              const p = proj(it.t ? it.t.project : it.ev.project);
              return `<span class="cday-dot" style="--c:${pColor(p)}"></span>`;
            }).join('')}${items.length > 4 ? '<span class="cday-dot-more">+</span>' : ''}</div>
            <div class="cday-chips hide-m">
              ${items.slice(0, 3).map(chip).join('')}
              ${items.length > 3 ? `<button class="cmore" data-a="pop" data-pop="daylist" data-date="${ds}" data-key="${opt.key || ''}">+${items.length - 3} lagi</button>` : ''}
            </div>
          </div>`;
        })
        .join('')}</div>

      <div class="cal-day-agenda">
        <div class="cal-agenda-header">
          <div class="cal-agenda-title">
            <span class="cal-agenda-icon">${ic('calendar', 16)}</span>
            <span class="cal-agenda-date">${fmtDate(selectedDate, true)}${isSelectedToday ? ' · Hari Ini' : ''}</span>
            <span class="badge ${selectedItems.length ? 'badge-primary' : ''}">${selectedItems.length} tugas</span>
          </div>
          <button class="btn btn-sm btn-secondary" data-a="newTask" data-due="${selectedDate}" ${opt.project ? `data-project="${opt.project}"` : ''}>
            ${ic('plus', 13)}<span>Tambah</span>
          </button>
        </div>
        <div class="cal-agenda-list">
          ${selectedItems.length
            ? selectedItems.map(renderCalItem).join('')
            : `<div class="cal-agenda-empty">Tidak ada deadline atau tugas pada tanggal ini. <button class="btn-link" data-a="newTask" data-due="${selectedDate}" ${opt.project ? `data-project="${opt.project}"` : ''}>+ Tambah tugas baru</button></div>`
          }
        </div>
      </div>
    </div>
  </div>`;
}

export function pageWsCalendar() {
  const key = 'cal';
  const v = viewOf(key);
  return `<div class="page flush"><div class="ph"><div><div class="cal-title-row"><h1>Kalender Tugas</h1><button class="btn btn-primary btn-sm" data-a="newTask">${ic('plus', 14)}<span>Tugas Baru</span></button></div><p>Pantau deadline lomba dan tugas SKL secara visual.</p></div></div>
  ${viewToolbar(key, { group: false })}${calendarHtml(applyView(allTasks(), v), { key, events: true })}</div>`;
}
