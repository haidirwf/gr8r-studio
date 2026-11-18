/* ---------- OVERVIEW ---------- */
import { TODAY, dayBucket, diffD, esc, fmtDate, parse } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { STATUSES } from '../core/constants.js';
import { D, isOver, pColor, progressOf, task, tasksOf } from '../core/store.js';
import { empty, formatUrlDomain, linkMeta, pStatus, stIcon } from '../ui/helpers.js';
import { sortTasks } from '../shell/view-engine.js';
import { actHtml, miniRow } from '../components/task-list.js';

export function projOverview(p) {
  const ts = tasksOf(p.id);
  const pr = progressOf(p.id);
  const cnt = STATUSES.map(s => ({ s, n: ts.filter(t => t.status === s.id).length }));
  const over = ts.filter(isOver);
  const soon = sortTasks(
    ts.filter(t => t.status !== 'done' && t.due),
    { f: 'due', dir: 1 },
  ).slice(0, 6);
  const acts = D()
    .activity.filter(a => a.project === p.id)
    .slice(0, 6);
  const daysLeft = diffD(parse(p.due), TODAY);
  const annDays = p.announce ? diffD(parse(p.announce), TODAY) : null;
  const annText = p.announce
    ? (annDays === 0 ? '📢 Pengumuman hari ini!' : annDays > 0 ? `📢 ${annDays} hari lagi menuju pengumuman` : `📢 Diumumkan ${fmtDate(p.announce)}`)
    : '';
  const links = p.links || [];
  const CORE_DELIVERABLES = [
    { type: 'ui', label: 'Desain UI', hint: 'Figma / Prototype', icon: 'palette', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
    { type: 'ux', label: 'Riset & UX', hint: 'FigJam / Miro / Docs', icon: 'layers', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
    { type: 'slide', label: 'Slide Presentasi', hint: 'Canva / Slides / PPT', icon: 'presentation', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    { type: 'proposal', label: 'Proposal & Laporan', hint: 'Google Docs / PDF', icon: 'file-text', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  ];
  const otherLinks = links.filter(l => !CORE_DELIVERABLES.some(d => d.type === l.type));

  return `<div class="page" style="max-width:1160px;padding-top:22px">
    <div class="grid2">
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>About</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="editProject" data-id="${p.id}">${ic('pencil', 13)}Edit</button></div></div><div class="panel-b" style="font-size:14px;line-height:1.6;color:var(--text)">${esc(p.desc)}</div></section>
        <section class="panel"><div class="panel-h"><h2>Progress</h2><div class="acts"><span class="faint" style="font-size:12px">${ts.filter(t => t.status === 'done').length} of ${ts.length} tasks done</span></div></div>
          <div class="panel-b">
            <div class="row" style="align-items:baseline;gap:10px;margin-bottom:10px"><span style="font-size:30px;font-weight:600;letter-spacing:-.03em" class="num">${pr}%</span><span class="muted">${daysLeft >= 0 ? `${daysLeft} days until ${fmtDate(p.due)}` : `Ended ${fmtDate(p.due)}`}${annText ? ` · <span style="color:#8b5cf6;font-weight:500">${annText}</span>` : ''}</span>${over.length ? `<span class="badge red">${ic('clock-alert', 11)}${over.length} overdue</span>` : ''}</div>
            <div class="stackbar" style="height:8px;margin-bottom:12px">${cnt.map(c => `<i style="width:${(c.n / Math.max(ts.length, 1)) * 100}%;background:var(--st-${c.s.id})" title="${c.s.name}: ${c.n}"></i>`).join('')}</div>
            <div class="row" style="flex-wrap:wrap;gap:14px;font-size:12.5px">${cnt.map(c => `<button class="row" style="gap:5px" data-a="goFilteredList" data-id="${p.id}" data-st="${c.s.id}">${stIcon(c.s.id, 12)}<span class="muted">${c.s.name}</span><b class="num" style="font-weight:600">${c.n}</b></button>`).join('')}</div>
          </div></section>
        <section class="panel"><div class="panel-h"><h2>Coming up</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="project" data-id="${p.id}" data-tab="list">View list</button></div></div>${soon.map(t => miniRow(t, { noProj: true })).join('') || empty('circle-check', 'Nothing scheduled', 'Tasks with due dates will show up here.', '', 'sm')}</section>
      </div>
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>Details</h2></div><div class="panel-b"><dl class="kv">
          <dt>${ic('circle-dot', 14)}Status</dt><dd><button class="pillbtn" data-a="pop" data-pop="pstatus" data-id="${p.id}">${pStatus(p.status)}</button></dd>
          <dt>${ic('tag', 14)}Tags</dt><dd class="row" style="gap:4px;flex-wrap:wrap">${(p.tags || []).length ? (p.tags || []).map(t => `<span class="badge" style="font-size:11px;padding:2px 7px;font-weight:500">${esc(t)}</span>`).join('') : '<span class="faint">Belum ada tag</span>'}</dd>
          <dt>${ic('calendar', 14)}Start</dt><dd><button class="pillbtn num" data-a="pop" data-pop="date" data-field="start" data-ctx="project" data-id="${p.id}" title="Klik untuk ubah tanggal mulai">${p.start ? fmtDate(p.start, true) : '<span class="faint">Atur tanggal</span>'}</button></dd>
          <dt>${ic('flag', 14)}Due</dt><dd><button class="pillbtn num" data-a="pop" data-pop="date" data-field="due" data-ctx="project" data-id="${p.id}" title="Klik untuk ubah tenggat waktu">${p.due ? fmtDate(p.due, true) : '<span class="faint">Atur deadline</span>'}</button></dd>
          <dt>${ic('megaphone', 14)}Pengumuman</dt><dd><button class="pillbtn num" data-a="pop" data-pop="date" data-field="announce" data-ctx="project" data-id="${p.id}" title="Klik untuk ubah tanggal pengumuman" style="${p.status === 'waiting' || p.announce ? 'color:#8b5cf6;border-color:rgba(139,92,246,0.3)' : ''}">${p.announce ? fmtDate(p.announce, true) : '<span class="faint">Atur pengumuman</span>'}</button></dd>
        </dl></div></section>
        <section class="panel">
          <div class="panel-h">
            <h2>Competition Resources & Deliverables</h2>
            <div class="acts">
              <button class="btn btn-sm btn-ghost" data-a="addProjectLink" data-id="${p.id}">${ic('plus', 13)}Add Custom Link</button>
            </div>
          </div>
          <div class="panel-b" style="display:flex;flex-direction:column;gap:10px">
            <div class="deliv-list">
              ${CORE_DELIVERABLES.map(d => {
                const matched = links.find(l => l.type === d.type);
                if (matched) {
                  const host = formatUrlDomain(matched.url);
                  return `
                  <div class="deliv-row filled">
                    <div class="deliv-left">
                      <span class="deliv-badge-icon" style="background:${d.bg};color:${d.color}">${ic(d.icon, 14)}</span>
                      <span class="deliv-name">${esc(d.label)}</span>
                    </div>
                    <div class="deliv-right">
                      <a href="${esc(matched.url)}" target="_blank" rel="noopener noreferrer" class="deliv-url-btn" title="${esc(matched.url)}">
                        <span class="trunc">${esc(host || 'Buka')}</span>
                        ${ic('arrow-up-right', 11)}
                      </a>
                      <button class="ibtn ibtn-xs res-del" data-a="removeProjectLink" data-pid="${p.id}" data-lid="${matched.id}" title="Hapus link" aria-label="Hapus link">${ic('trash-2', 13)}</button>
                    </div>
                  </div>`;
                }
                return `
                <div class="deliv-row empty" data-a="addProjectLink" data-id="${p.id}" data-type="${d.type}" data-label="${esc(d.label)}" role="button" tabindex="0" title="Klik untuk masukkan tautan ${esc(d.label)} (${esc(d.hint)})">
                  <div class="deliv-left">
                    <span class="deliv-badge-icon" style="background:${d.bg};color:${d.color}">${ic(d.icon, 14)}</span>
                    <span class="deliv-name">${esc(d.label)}</span>
                  </div>
                  <div class="deliv-right">
                    <span class="deliv-add-btn">${ic('plus', 11)}<span>Tambah</span></span>
                  </div>
                </div>`;
              }).join('')}
            </div>

            ${otherLinks.length ? `
              <div style="border-top:1px solid var(--divider);padding-top:10px;display:flex;flex-direction:column;gap:8px">
                <span class="faint" style="font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.03em">Informasi & Panduan Panitia</span>
                ${otherLinks.map(l => {
                  const meta = linkMeta(l.type);
                  const host = formatUrlDomain(l.url);
                  return `
                  <div class="res-item">
                    <div class="res-icon" style="background:${meta.bg};color:${meta.color}">
                      ${ic(meta.icon, 18)}
                    </div>
                    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
                      <a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="res-link" title="${esc(l.url)}">
                        <span class="trunc">${esc(l.label)}</span>
                        <span style="display:inline-flex;align-items:center;color:var(--text-3);flex-shrink:0">${ic('arrow-up-right', 12)}</span>
                      </a>
                      ${host ? `<span style="font-size:11px;color:var(--text-3);font-family:var(--font-mono, monospace);line-height:1.2" class="trunc">${esc(host)}</span>` : ''}
                    </div>
                    <span class="res-badge" style="background:${meta.bg};color:${meta.color};border:1px solid ${meta.border}">${esc(meta.label)}</span>
                    <button class="ibtn ibtn-xs res-del" data-a="removeProjectLink" data-pid="${p.id}" data-lid="${l.id}" title="Hapus link" aria-label="Hapus link">${ic('trash-2', 14)}</button>
                  </div>`;
                }).join('')}
              </div>
            ` : ''}
          </div>
        </section>
        <section class="panel"><div class="panel-h"><h2>Milestones</h2></div><div class="panel-b">${
          (p.milestones || [])
            .map(m => {
              const n = diffD(parse(m.date), TODAY);
              return `<div class="row" style="height:32px;font-size:13px"><span style="width:9px;height:9px;transform:rotate(45deg);border-radius:2px;flex-shrink:0;margin:0 3px;background:${n < 0 ? 'var(--green)' : pColor(p)}"></span><span class="grow trunc ${n < 0 ? 'faint' : ''}">${esc(m.name)}</span><span class="num muted">${fmtDate(m.date)}</span></div>`;
            })
            .join('') || '<span class="faint">No milestones yet</span>'
        }</div></section>
        <section class="panel"><div class="panel-h"><h2>Recent activity</h2><div class="acts"><button class="btn btn-sm btn-ghost" data-a="go" data-r="project" data-id="${p.id}" data-tab="activity">View all</button></div></div><div class="panel-b feed">${acts.map(a => actHtml(a)).join('') || '<span class="faint">No activity yet</span>'}</div></section>
      </div>
    </div>
  </div>`;
}
export function projActivity(p) {
  const as = D().activity.filter(a => a.project === p.id);
  const cs = D()
    .comments.filter(c => task(c.task)?.project === p.id)
    .map(c => ({ id: c.id, by: c.by, verb: 'commented on', task: c.task, project: p.id, at: c.at, extra: '' }));
  const all = [...as, ...cs].sort((a, b) => b.at - a.at);
  const b = {};
  all.forEach(a => (b[dayBucket(a.at)] ||= []).push(a));
  return `<div class="page" style="max-width:780px;padding-top:18px">${
    all.length
      ? Object.entries(b)
          .map(([k, list]) => `<div class="day-h">${k}</div><div class="feed lined">${list.map(a => actHtml(a)).join('')}</div>`)
          .join('')
      : empty('activity', 'No activity yet', 'Changes to this project will appear here.')
  }</div>`;
}
