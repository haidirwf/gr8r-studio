/* ---------- PROJECTS ---------- */
import { ago, esc, fmtDate, minsAgo } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { PSTAT } from '../core/constants.js';
import { S, canSee, progressOf, tasksOf, visibleProjects } from '../core/store.js';
import { avStack, empty, linkIcon, pIcon, pStatus, progBar } from '../ui/helpers.js';

export function projectCard(p) {
  const ts = tasksOf(p.id);
  const pr = progressOf(p.id);
  const open = ts.filter(t => t.status !== 'done').length;
  const locked = !canSee(p);
  return `<div class="pcard" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project" role="link" tabindex="0" aria-label="${esc(p.name)}">
    <div class="row">${pIcon(p)}<div class="grow" style="min-width:0"><div class="row" style="gap:6px"><b class="trunc" style="font-weight:600;font-size:14px">${esc(p.name)}</b>${p.fav ? `<span style="color:var(--amber)">${ic('star', 12)}</span>` : ''}${p.private ? `<span class="faint" data-tip="Private project">${ic('lock', 12)}</span>` : ''}</div></div>${pStatus(p.status)}</div>
    <div class="desc">${esc(p.desc)}</div>
    ${
      p.tags && p.tags.length
        ? `<div class="row" style="gap:5px;flex-wrap:wrap;margin:4px 0">
      ${p.tags
        .map(
          t => `<span class="badge" style="font-size:11px;padding:1px 7px;border-radius:4px;background:var(--surface-2);border:1px solid var(--border-subtle);color:var(--text);font-weight:500">${esc(t)}</span>`,
        )
        .join('')}
    </div>`
        : ''
    }
    ${locked ? `<div class="row faint" style="font-size:12px">${ic('lock', 12)}Restricted — request access to see tasks</div>` : `<div class="row" style="gap:10px">${progBar(pr, p.status === 'complete' ? 'green' : p.status === 'risk' ? 'red' : '')}<span class="num" style="font-size:12px;font-weight:500">${pr}%</span></div>`}
    ${
      p.links && p.links.length
        ? `<div class="row" style="gap:5px;flex-wrap:wrap;margin-top:4px">
      ${p.links
        .slice(0, 3)
        .map(
          l => `<a class="chip" data-a="openProjectLink" data-url="${esc(l.url)}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" style="font-size:11.5px;padding:2px 7px;border-radius:12px;background:var(--surface-2);border:1px solid var(--border-subtle);display:inline-flex;align-items:center;gap:4px;color:var(--text);text-decoration:none;max-width:130px" title="${esc(l.label)}">
        ${linkIcon(l.type, 11)}<span class="trunc">${esc(l.label)}</span><span style="opacity:0.6;display:inline-flex;align-items:center">${ic('external-link', 9)}</span>
      </a>`,
        )
        .join('')}
      ${p.links.length > 3 ? `<span class="faint" style="font-size:11px;align-self:center">+${p.links.length - 3}</span>` : ''}
    </div>`
        : ''
    }
    <div class="foot"><span class="row" style="gap:4px">${ic('circle-check', 12)}${locked ? '—' : `${ts.length - open}/${ts.length}`}</span><span class="row" style="gap:4px">${ic('calendar', 12)}${fmtDate(p.due)}</span><span class="row hide-m" style="gap:4px">${ic('clock', 12)}${ago(minsAgo(p.last))}</span><span class="sp"></span>${avStack(p.members, 3)}</div>
    <button class="ibtn ibtn-sm more" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Project options" style="background:var(--surface);box-shadow:0 0 0 1px var(--border)">${ic('ellipsis', 14)}</button>
  </div>`;
}
export function pageProjects() {
  const u = S.ui;
  const q = (u.projQ || '').toLowerCase();
  const st = u.projStatus || 'all';
  const sort = u.projSort || 'recent';
  const tagFilter = u.projTag || 'all';

  const allAvailableTags = [
    ...new Set([
      'UI/UX',
      'Webdev',
      'SKL',
      ...visibleProjects().flatMap(p => p.tags || []),
    ]),
  ].filter(Boolean);

  let ps = visibleProjects().filter(
    p =>
      (st === 'all' || p.status === st) &&
      (tagFilter === 'all' || (p.tags && p.tags.includes(tagFilter))) &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))),
  );
  const sorter = { recent: p => p.last, name: p => p.name, due: p => p.due, progress: p => -progressOf(p.id) }[sort];
  ps.sort((a, b) => (sorter(a) > sorter(b) ? 1 : -1));
  const view = u.projView === 'table' ? 'grid' : (u.projView || 'grid');
  let body;
  if (!visibleProjects().length)
    body = `<div class="panel">${empty('folder-kanban', 'No projects yet', 'Create your first project to start organizing your work.', `<button class="btn btn-primary btn-sm" data-a="newProject">${ic('plus', 14)}Create project</button>`)}</div>`;
  else if (!ps.length)
    body = `<div class="panel">${empty('search-x', 'No results found', 'No projects match your search or filters. Try a different term.', `<button class="btn btn-secondary btn-sm" data-a="clearProjFilters">Clear filters</button>`)}</div>`;
  else if (view === 'list')
    body = `<div class="panel" style="overflow:hidden">${ps
      .map(p => {
        const pr = progressOf(p.id);
        const tagsHtml = (p.tags || []).map(t => `<span class="badge" style="font-size:10.5px;padding:0 5px">${esc(t)}</span>`).join('');
        return `<div class="mini" style="min-height:52px;gap:12px" data-a="go" data-r="project" data-id="${p.id}" data-ctx="project">${pIcon(p)}<div class="grow" style="min-width:0"><div class="row" style="gap:6px"><b style="font-weight:500">${esc(p.name)}</b>${p.private ? ic('lock', 12) : ''}${tagsHtml}</div><div class="trunc faint" style="font-size:12px">${esc(p.desc)}</div></div><span class="hide-m">${pStatus(p.status)}</span><span class="row hide-m" style="width:140px">${progBar(pr)}<span class="num faint" style="font-size:11.5px">${pr}%</span></span><span class="num muted hide-m" style="width:70px;font-size:12px">${fmtDate(p.due)}</span>${avStack(p.members, 3)}<button class="ibtn ibtn-sm" data-a="ctxBtn" data-ctx="project" data-id="${p.id}" aria-label="Options">${ic('ellipsis', 14)}</button></div>`;
      })
      .join('')}</div>`;
  else
    body = `<div class="pgrid">${ps.map(projectCard).join('')}</div>`;
  return `<div class="page wide">
    <div class="ph"><div><h1>Projects</h1><p>${visibleProjects().filter(p => p.status !== 'complete').length} active · ${visibleProjects().filter(p => p.status === 'complete').length} completed</p></div><div class="acts"><button class="btn btn-primary" data-a="newProject">${ic('plus', 14)}New project</button></div></div>
    <div class="row" style="margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div class="inwrap">${ic('search', 13)}<input class="input search-sm" id="proj-q" data-in="projQ" placeholder="Search projects or tags" value="${esc(u.projQ || '')}" aria-label="Search projects"></div>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="projTag" aria-label="Filter by tag"><option value="all">Semua Tag</option>${allAvailableTags
        .map(t => `<option value="${esc(t)}" ${tagFilter === t ? 'selected' : ''}>Tag: ${esc(t)}</option>`)
        .join('')}</select>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="projStatus" aria-label="Filter by status"><option value="all">All statuses</option>${Object.entries(
        PSTAT,
      )
        .map(([k, v]) => `<option value="${k}" ${st === k ? 'selected' : ''}>${v.name}</option>`)
        .join('')}</select>
      <select class="select" style="height:26px;width:auto;font-size:12px" data-in="projSort" aria-label="Sort">${[
        ['recent', 'Recently active'],
        ['name', 'Name'],
        ['due', 'Due date'],
        ['progress', 'Progress'],
      ]
        .map(([k, n]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>Sort: ${n}</option>`)
        .join('')}</select>
      <span class="sp"></span>
      <div class="seg" role="tablist" aria-label="Layout">${[
        ['grid', 'Grid', 'layout-grid'],
        ['list', 'List', 'list'],
      ]
        .map(
          ([k, n, i]) =>
            `<button class="${view === k ? 'on' : ''}" data-a="set" data-k="projView" data-v="${k}" aria-label="${n}">${ic(i, 13)}<span class="hide-m">${n}</span></button>`,
        )
        .join('')}</div>
    </div>
    ${body}
  </div>`;
}
