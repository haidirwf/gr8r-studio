/* ---------------- MODALS ---------------- */
import { $$, MOD, TODAY, ago, diffD, esc, fmtDate, parse } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { PCOLORS, PICONS, PR, PROJECT_TAGS, ST, TASK_COLORS } from '../core/constants.js';
import { D, S, mem, pColor, proj, task, teamsList } from '../core/store.js';
import { FT, av, filePrev, lbl, pIcon, prIcon, prPill, stIcon, stPill } from '../ui/helpers.js';
import { focusKey, render } from '../shell/render.js';
import { teamModal } from '../features/teams.js';
import { noteModal } from '../pages/notes.js';

export function openModal(m) {
  S.ui.modalOpeners = S.ui.modalOpeners || [];
  S.ui.modalOpeners[S.ui.modals.length] = S.ui.popOpener && S.ui.pop ? S.ui.popOpener : focusKey(document.activeElement);
  S.ui.modals.push(m);
  S.ui.pop = null;
  render();
  setTimeout(() => {
    const all = $$('.modal');
    const last = all[all.length - 1];
    const af = last?.querySelector('[autofocus]');
    (af || last?.querySelector('input,textarea,button'))?.focus();
  }, 30);
}
export function closeModal() {
  S.ui.modals.pop();
  S.ui.pop = null;
  render();
}
export function placeAnchoredModals() {
  if (typeof window === 'undefined') return;
  const el = document.querySelector('.modal.quick-task-popover');
  if (!el) return;

  if (window.innerWidth <= 768) {
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.margin = '';
    return;
  }

  const modals = S.ui.modals;
  if (!modals || !modals.length) return;
  const m = modals[modals.length - 1];
  if (!m || !m.anchor || m.type !== 'quickTask') return;

  const a = m.anchor;
  const pad = 12;
  const popW = Math.min(el.offsetWidth || 390, window.innerWidth - pad * 2);
  const popH = el.offsetHeight || 260;

  let left = a.left;
  if (left + popW > window.innerWidth - pad) {
    const rEdge = a.cellRight != null ? a.cellRight : a.right;
    left = rEdge - popW;
  }
  if (left < pad) left = pad;
  if (left + popW > window.innerWidth - pad) left = window.innerWidth - pad - popW;

  let top = a.bottom + 6;
  if (top + popH > window.innerHeight - pad) {
    if (a.top - 6 - popH >= pad) {
      top = a.top - 6 - popH;
    } else {
      top = Math.max(pad, window.innerHeight - pad - popH);
    }
  }

  el.style.position = 'fixed';
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  el.style.margin = '0';
  el.style.width = `${popW}px`;
}
export function modalHtml(m) {
  const H = (title, sub = '') =>
    `<div class="modal-h"><div><h2 id="mt-${m.type}">${title}</h2>${sub ? `<div class="muted" style="font-size:12.5px;margin-top:2px">${sub}</div>` : ''}</div><button class="ibtn ibtn-sm" data-a="closeModal" aria-label="Close">${ic('x', 16)}</button></div>`;
  const wrap = (cls, inner, extraAttr = '') => `<div class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="mt-${m.type}" ${extraAttr}>${inner}</div>`;
  switch (m.type) {
    case 'quickTask': {
      let initStyle = '';
      if (m.anchor && typeof window !== 'undefined' && window.innerWidth > 768) {
        const pad = 12;
        const popW = Math.min(390, window.innerWidth - pad * 2);
        let left = m.anchor.left;
        if (left + popW > window.innerWidth - pad) {
          const rEdge = m.anchor.cellRight != null ? m.anchor.cellRight : m.anchor.right;
          left = rEdge - popW;
        }
        if (left < pad) left = pad;
        if (left + popW > window.innerWidth - pad) left = window.innerWidth - pad - popW;

        let top = m.anchor.bottom + 6;
        if (top + 280 > window.innerHeight - pad && m.anchor.top - 6 - 280 >= pad) {
          top = m.anchor.top - 6 - 280;
        }
        initStyle = `style="position:fixed;left:${Math.round(left)}px;top:${Math.round(top)}px;width:${popW}px;margin:0;"`;
      }
      return wrap(`sm${m.anchor ? ' quick-task-popover' : ''}`, quickTaskModal(m, H), initStyle);
    }
    case 'task':
      return wrap('', taskModal(m, H));
    case 'project':
      return wrap('', projectModal(m, H));
    case 'share':
      return wrap('', shareModal(m, H));
    case 'invite':
      return wrap('', inviteModal(m, H));
    case 'confirm':
      return wrap('sm', confirmModal(m, H));
    case 'prompt':
      return wrap(
        'sm',
        `${H(m.title)}<form class="modal-b" data-submit="promptSubmit"><div class="field"><label class="label" for="prompt-in">${esc(m.label)}</label><input class="input" id="prompt-in" value="${esc(m.value || '')}" autofocus></div></form><div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="promptSubmit">${esc(m.ok || 'Save')}</button></div>`,
      );
    case 'shortcuts':
      return wrap('lg', shortcutsModal(H));
    case 'team':
      return wrap('', teamModal(m, H));
    case 'projectLink':
      return wrap(
        'sm',
        `${H(m.presetLabel ? `Tambah ${esc(m.presetLabel)}` : 'Tambah Tautan Proyek', 'Tambahkan tautan berkas karya atau kebutuhan informasi lomba.')}
        <form class="modal-b" data-submit="submitProjectLink" style="gap:12px">
          <div class="field"><label class="label" for="pl-type">Tipe Link</label>
            <select class="select" id="pl-type">
              <option value="ui" ${m.presetType === 'ui' ? 'selected' : ''}>🎨 Desain UI</option>
              <option value="ux" ${m.presetType === 'ux' ? 'selected' : ''}>🧠 Riset dan Desain UX</option>
              <option value="slide" ${m.presetType === 'slide' ? 'selected' : ''}>📊 Slide Presentasi</option>
              <option value="proposal" ${m.presetType === 'proposal' ? 'selected' : ''}>📄 Proposal dan Dokumen</option>
              <option value="website" ${m.presetType === 'website' ? 'selected' : ''}>🌐 Website Resmi Lomba</option>
              <option value="guidebook" ${m.presetType === 'guidebook' ? 'selected' : ''}>📖 Buku Panduan</option>
              <option value="submission" ${m.presetType === 'submission' ? 'selected' : ''}>📤 Formulir Pengumpulan</option>
              <option value="group" ${m.presetType === 'group' ? 'selected' : ''}>💬 Grup Koordinasi</option>
              <option value="social" ${m.presetType === 'social' ? 'selected' : ''}>📸 Media Sosial Panitia</option>
              <option value="other" ${!m.presetType || m.presetType === 'other' ? 'selected' : ''}>🔗 Lainnya</option>
            </select>
          </div>
          <div class="field"><label class="label" for="pl-label">Nama Link</label><input class="input" id="pl-label" placeholder="Contoh: Figma Prototype, Riset FigJam, Pitch Deck Canva..." value="${esc(m.presetLabel || '')}" required></div>
          <div class="field"><label class="label" for="pl-url">Tautan URL</label><input class="input" id="pl-url" type="url" placeholder="https://..." autofocus required></div>
        </form>
        <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Batal</button><button class="btn btn-primary" data-a="submitProjectLink">Simpan Link</button></div>`,
      );
    case 'note':
      return wrap('', noteModal(m, H));
    case 'filePreview':
      return wrap('lg', filePreviewModal(m, H));
    case 'saveView':
      return wrap(
        'sm',
        `${H('Save view', 'Save the current filters as a tab on this project.')}<form class="modal-b" data-submit="saveViewSubmit"><div class="field"><label class="label" for="sv-name">View name</label><input class="input" id="sv-name" placeholder="e.g. Design review queue" autofocus></div><div class="field"><label class="label" for="sv-type">Layout</label><select class="select" id="sv-type"><option value="board">Board</option></select></div>${m.nf ? `<div class="hint">${m.nf} filter${m.nf > 1 ? 's' : ''} will be saved with this view.</div>` : '<div class="alert info">' + ic('info', 14) + '<span>No filters are active — the view will show all tasks. You can add filters after saving.</span></div>'}</form><div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="saveViewSubmit">Save view</button></div>`,
      );
  }
  return '';
}
export function formChip(pop, html, label) {
  return `<button class="pillbtn bordered" data-a="pop" data-pop="${pop}" data-id="__form" ${pop === 'date' ? `data-field="${label}"` : ''} aria-label="${esc(label)}">${html}</button>`;
}
export function taskModal(m, H) {
  const f = S.ui.form;
  const p = proj(f.project);
  const err = S.ui.errors.title;
  return `${H(m.edit ? 'Edit Tugas' : 'Tugas Baru', m.edit ? `<span class="mono">${task(m.edit)?.key}</span>` : '')}
  <form class="modal-b" data-submit="submitTask" style="gap:12px">
    <div class="field"><label class="sr" for="f-title">Nama tugas atau pengingat</label><input class="input input-lg ${err ? 'is-error' : ''}" id="f-title" data-in="form" data-f="title" value="${esc(f.title)}" placeholder="Contoh: Beli perlengkapan, deadline revisi..." autofocus aria-invalid="${!!err}" aria-describedby="f-title-err" style="font-size:15px;font-weight:500">${err ? `<span class="err" id="f-title-err">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    <div class="field"><label class="sr" for="f-desc">Deskripsi</label><textarea class="textarea" id="f-desc" data-in="form" data-f="desc" placeholder="Catatan tambahan… (opsional)" rows="2">${esc(f.desc)}</textarea></div>
    <div class="row" style="flex-wrap:wrap;gap:6px">
      ${formChip('project', p ? `${pIcon(p, 'xs')}<span>${esc(p.name)}</span>` : `${ic('bell', 13)}<span>Tanpa Proyek (Pengingat)</span>`, 'Project')}
      ${formChip('status', stPill(f.status), 'Status')}
      ${formChip('assignee', `${av(f.assignee, 'sm', false)}${esc(mem(f.assignee)?.name || 'Assignee')}`, 'Assignee')}
      ${formChip('priority', prPill(f.priority), 'Priority')}
      ${formChip('date', `${ic('calendar', 13)}${f.due ? 'Due ' + fmtDate(f.due) : 'Due date'}`, 'due')}
      ${formChip('date', `${ic('calendar-arrow-up', 13)}${f.start ? 'Starts ' + fmtDate(f.start) : 'Start date'}`, 'start')}
      ${formChip('labels', f.labels.length ? f.labels.map(lbl).join('') : `${ic('tag', 13)}Labels`, 'Labels')}
      ${formChip('recur', `${ic('repeat', 13)}${f.recur || 'Repeat'}`, 'Repeat')}
    </div>
    <div class="field" style="margin-top:2px">
      <span class="label" style="font-size:12px;margin-bottom:4px">Warna Penanda Tugas</span>
      <div class="swatches" style="display:flex;gap:7px;flex-wrap:wrap">
        ${Object.entries(TASK_COLORS).map(([k, c]) => {
          const bg = c.c || (p ? pColor(p) : 'var(--amber, #f59e0b)');
          const isSelected = (f.color || 'default') === k;
          return `<button type="button" class="sw ${isSelected ? 'on' : ''}" style="--c:${bg};width:22px;height:22px;border-radius:50%;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;background:${bg};border:2px solid ${isSelected ? 'var(--text)' : 'transparent'};box-shadow:0 0 0 1px var(--border)" data-a="formSetColor" data-c="${k}" title="${c.name}">${isSelected ? ic('check', 11) : ''}</button>`;
        }).join('')}
      </div>
    </div>
    <div class="field"><span class="label">Subtasks</span>
      ${f.subtasks.map((s, i) => `<div class="subt" style="padding:0 4px">${ic('circle', 13)}<span class="s">${esc(s.title)}</span><button type="button" class="ibtn ibtn-xs x" style="opacity:1" data-a="formRmSub" data-i="${i}" aria-label="Remove">${ic('x', 12)}</button></div>`).join('')}
      <div class="inwrap">${ic('plus', 14)}<input class="input" id="f-sub" data-key-enter="formAddSub" placeholder="Add a subtask and press Enter"></div></div>
    <div class="field"><span class="label">Attachments</span>
      ${f.files.length ? `<div class="col" style="gap:4px">${f.files.map((x, i) => `<div class="upl" style="padding:6px 10px"><span class="ftype" style="--c:${FT[x.type].c};width:22px;height:22px">${ic(FT[x.type].i, 12)}</span><span class="grow trunc">${esc(x.name)}</span><span class="faint" style="font-size:11.5px">${x.size}</span><button type="button" class="ibtn ibtn-xs" data-a="formRmFile" data-i="${i}" aria-label="Remove">${ic('x', 12)}</button></div>`).join('')}</div>` : ''}
      <label class="dropzone" style="padding:10px">${ic('paperclip', 14)}<span>Attach files</span><input type="file" multiple hidden data-in="formFiles"></label></div>
  </form>
  <div class="modal-f">${m.edit ? '' : `<label class="row" style="gap:8px;font-size:12.5px;color:var(--text-2);cursor:pointer"><input type="checkbox" class="toggle" id="f-more" data-in="formMore" ${f.more ? 'checked' : ''}>Create more</label>`}<span class="sp"></span>
    <span class="faint hide-m" style="font-size:11.5px"><kbd>${MOD}</kbd> <kbd>↵</kbd></span>
    <button class="btn btn-secondary" data-a="closeModal">Batal</button><button class="btn btn-primary" data-a="submitTask" id="f-submit">${m.edit ? 'Simpan' : 'Tambah Tugas'}</button></div>`;
}
export const TEMPLATES = [
  { id: 'blank', name: 'Blank project', icon: 'file', desc: 'Start from scratch', tasks: [] },
  {
    id: 'product',
    name: 'Product Development',
    icon: 'target',
    desc: 'Discovery to launch',
    tasks: ['Define problem statement', 'User research plan', 'Write PRD', 'Design exploration', 'Build MVP', 'Beta launch'],
  },
  {
    id: 'web',
    name: 'Website',
    icon: 'globe',
    desc: 'IA, design, build, launch',
    tasks: ['Sitemap & information architecture', 'Wireframes', 'Visual design', 'Build page templates', 'Content migration', 'QA & launch'],
  },
  {
    id: 'mkt',
    name: 'Marketing Campaign',
    icon: 'megaphone',
    desc: 'Brief, assets, channels',
    tasks: ['Campaign brief', 'Audience research', 'Creative assets', 'Channel plan', 'Launch campaign', 'Performance report'],
  },
  {
    id: 'design',
    name: 'Design Project',
    icon: 'palette',
    desc: 'Discovery to handoff',
    tasks: ['Discovery workshop', 'Moodboard', 'Concept directions', 'Refinement', 'Developer handoff'],
  },
  {
    id: 'software',
    name: 'Software Development',
    icon: 'code',
    desc: 'Spec, build, ship',
    tasks: ['Technical spec', 'Set up repo & CI', 'Implement core API', 'Write tests', 'Code review', 'Deploy to staging'],
  },
  {
    id: 'personal',
    name: 'Personal Project',
    icon: 'heart',
    desc: 'Plan your own goals',
    tasks: ['Brain dump ideas', 'Pick top 3 priorities', 'Schedule focus time', 'Weekly review'],
  },
];
export function quickTaskModal(m, H) {
  const t = task(m.id);
  if (!t) return `${H('Tugas')}<div class="modal-b" style="padding:16px 20px"><div class="cal-agenda-empty">Tugas tidak ditemukan.</div></div>`;
  const p = proj(t.project);
  return `${H(p ? esc(p.name) : 'Pengingat Pribadi', t.key ? `<span class="mono">${esc(t.key)}</span>` : '')}
  <div class="modal-b" style="gap:14px;padding:16px 20px">
    <div class="field" style="margin-bottom:0">
      <input class="input" style="font-size:16px;font-weight:600;padding:6px 10px;height:auto;line-height:1.4" value="${esc(t.title)}" data-blur="commitDrawerTitle" data-key-enter="blur" data-id="${t.id}" placeholder="Nama tugas..." aria-label="Nama tugas">
    </div>
    
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center">
      <button type="button" class="pillbtn bordered" data-a="pop" data-pop="status" data-id="${t.id}" aria-label="Status: ${ST[t.status].name}" style="cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px">
        ${stIcon(t.status)}
        <span>${ST[t.status].name}</span>
        ${ic('chevron-down', 11)}
      </button>

      <button type="button" class="pillbtn bordered ${t.priority === 'none' ? 'empty' : ''}" data-a="pop" data-pop="priority" data-id="${t.id}" aria-label="Prioritas: ${PR[t.priority || 'none'].name}" style="cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px">
        ${prIcon(t.priority, 13)}
        <span>${PR[t.priority || 'none'].name}</span>
        ${ic('chevron-down', 11)}
      </button>

      <button type="button" class="pillbtn bordered num ${t.due && t.status !== 'done' && diffD(parse(t.due), TODAY) < 0 ? 'over' : ''}" data-a="pop" data-pop="date" data-field="due" data-id="${t.id}" aria-label="Tenggat Waktu" style="cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px">
        ${ic('calendar', 13)}
        <span>${t.due ? fmtDate(t.due, true) : 'Atur deadline'}</span>
        ${ic('chevron-down', 11)}
      </button>

      <button type="button" class="pillbtn bordered" data-a="pop" data-pop="project" data-id="${t.id}" aria-label="Proyek" style="cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px">
        ${p ? pIcon(p, 'sm') : ic('bell', 13)}
        <span>${esc(p ? p.name : 'Pengingat Pribadi')}</span>
        ${ic('chevron-down', 11)}
      </button>
    </div>

    <div class="row" style="gap:8px;align-items:center;padding:4px 0">
      <span class="faint" style="font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;gap:4px">
        ${ic('palette', 12)}<span>Warna:</span>
      </span>
      <div class="swatches" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        ${Object.entries(TASK_COLORS).map(([k, c]) => {
          const bg = c.c || (p ? pColor(p) : 'var(--amber, #f59e0b)');
          const isSelected = (t.color || 'default') === k;
          return `<button type="button" class="sw ${isSelected ? 'on' : ''}" style="--c:${bg};width:18px;height:18px;border-radius:50%;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;background:${bg};border:2px solid ${isSelected ? 'var(--text)' : 'transparent'};box-shadow:0 0 0 1px var(--border)" data-a="setTaskColor" data-id="${t.id}" data-c="${k}" title="${c.name}">${isSelected ? ic('check', 10) : ''}</button>`;
        }).join('')}
      </div>
    </div>

    <div class="field" style="margin-bottom:0">
      <textarea class="textarea" rows="2" data-blur="quickTaskDesc" data-id="${t.id}" placeholder="Tambah catatan atau deskripsi... (opsional)" style="font-size:13px;line-height:1.5">${esc(t.desc || '')}</textarea>
    </div>

    ${t.attachments && t.attachments.length ? `
      <div style="display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--divider);padding-top:10px">
        <span style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em">Lampiran & Gambar (${t.attachments.length})</span>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${t.attachments.map(att => `
            <div class="attc" data-a="filePreview" data-tid="${t.id}" data-aid="${att.id}" role="button" tabindex="0" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:var(--sunken);cursor:pointer;font-size:12px;max-width:220px">
              ${att.url ? `<img src="${att.url}" alt="" style="width:20px;height:20px;border-radius:3px;object-fit:cover;flex-shrink:0" />` : ic('paperclip', 12)}
              <span class="trunc" style="font-weight:500">${esc(att.name)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="row" style="gap:8px;align-items:center;padding-top:2px">
      <label class="btn btn-xs btn-secondary" style="cursor:pointer;display:inline-flex;align-items:center;gap:5px">
        ${ic('upload', 12)}<span>Upload Gambar/File</span>
        <input type="file" accept="image/*,application/pdf" multiple hidden data-in="uploadFiles" data-task="${t.id}" data-project="${t.project || ''}">
      </label>
      <span class="faint" style="font-size:11px">Gambar otomatis dikonversi ke WebP.</span>
    </div>
  </div>
  <div class="modal-f" style="justify-content:space-between">
    <button class="btn btn-ghost btn-sm text-danger" data-a="deleteQuickTask" data-id="${t.id}">${ic('trash-2', 14)}<span>Hapus</span></button>
    <div class="row" style="gap:8px">
      ${p ? `<button class="btn btn-secondary btn-sm" data-a="goProjectFromTask" data-id="${p.id}"><span>Lihat Proyek</span>${ic('arrow-right', 13)}</button>` : ''}
      <button class="btn btn-primary btn-sm" data-a="saveQuickTask" data-id="${t.id}">${ic('check', 14)}<span>Simpan</span></button>
    </div>
  </div>`;
}

export function projectModal(m, H) {
  const f = S.ui.pform;
  const err = S.ui.errors.pname;
  return `${H(m.edit ? 'Pengaturan Proyek' : 'Tambah Proyek Baru', m.edit ? '' : 'Kelola timeline dan kebutuhan proyek Anda.')}
  <form class="modal-b" data-submit="submitProject" style="gap:14px;overflow-x:hidden;max-width:100%;box-sizing:border-box">
    <div class="row" style="gap:12px;align-items:flex-start;min-width:0">
      <div class="picon-upload-wrap">
        <label class="picon lg ${f.image ? 'picon-has-img' : ''}" style="--c:${PCOLORS[f.color]};overflow:hidden;position:relative" title="${f.image ? 'Klik untuk ganti logo/gambar' : 'Upload logo/gambar proyek'}" aria-label="Upload logo atau gambar">
          ${f.image
            ? `<img src="${f.image}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />`
            : ic(f.icon, 20)
          }
          <div class="picon-upload-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:#fff;opacity:0;transition:opacity var(--dur)">
            ${ic('camera', 16)}
          </div>
          <input type="file" accept="image/*" hidden data-in="pformImageUpload">
        </label>
        ${f.image ? `<button type="button" class="picon-del-btn" data-a="pformClearImage" title="Hapus gambar" aria-label="Hapus gambar">${ic('x', 11)}</button>` : ''}
      </div>
      <div class="field grow" style="min-width:0"><label class="label" for="p-name">Nama Proyek</label><input class="input ${err ? 'is-error' : ''}" id="p-name" data-in="pform" data-f="name" value="${esc(f.name)}" placeholder="Contoh: Lomba Web Design 2026" autofocus aria-invalid="${!!err}">${err ? `<span class="err">${ic('circle-alert', 12)}${err}</span>` : ''}</div>
    </div>
    <div class="field" style="min-width:0"><label class="label" for="p-desc">Deskripsi Singkat</label><textarea class="textarea" id="p-desc" data-in="pform" data-f="desc" rows="2" placeholder="Deskripsi singkat proyek...">${esc(f.desc)}</textarea></div>
    
    <div class="row" style="gap:10px;min-width:0;flex-wrap:wrap">
      <div class="field grow" style="min-width:130px;flex:1">
        <label class="label" for="p-start">Tanggal Mulai</label>
        <input type="date" class="input" id="p-start" data-in="pform" data-f="start" value="${f.start || ''}">
      </div>
      <div class="field grow" style="min-width:130px;flex:1">
        <label class="label" for="p-due">Tenggat Waktu</label>
        <input type="date" class="input" id="p-due" data-in="pform" data-f="due" value="${f.due || ''}">
      </div>
      <div class="field grow" style="min-width:130px;flex:1">
        <label class="label" for="p-announce">Tanggal Pengumuman</label>
        <input type="date" class="input" id="p-announce" data-in="pform" data-f="announce" value="${f.announce || ''}">
      </div>
    </div>
    
    <div class="field" style="min-width:0">
      <label class="label" for="p-tag-select">Tag Proyek</label>
      <select class="select" id="p-tag-select" data-in="pformTagSelect" style="width:100%;height:36px">
        ${[...new Set([...PROJECT_TAGS, ...(f.tags || [])])].map(t => `<option value="${esc(t)}" ${(f.tags || ['Webdev']).includes(t) ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        <option value="__custom__">+ Tambah Tag Lain...</option>
      </select>
    </div>

    <div class="field" style="min-width:0"><span class="label">Icon Statis</span><div class="iconpick" role="radiogroup" aria-label="Icon" style="width:100%">${PICONS.map(i => `<button type="button" role="radio" aria-checked="${f.icon === i}" class="${f.icon === i ? 'on' : ''}" data-a="pformSet" data-f="icon" data-v="${i}" aria-label="${i}">${ic(i, 15)}</button>`).join('')}</div></div>
    
    <div class="field" style="min-width:0"><span class="label">Warna</span><div class="swatches" role="radiogroup" aria-label="Color" style="display:flex;flex-wrap:wrap;gap:8px">${Object.entries(
      PCOLORS,
    )
      .map(
        ([k, v]) =>
          `<button type="button" role="radio" aria-checked="${f.color === k}" class="sw ${f.color === k ? 'on' : ''}" style="--c:${v};width:24px;height:24px" data-a="pformSet" data-f="color" data-v="${k}" aria-label="${k}">${f.color === k ? ic('check', 12) : ''}</button>`,
      )
      .join('')}</div></div>

    <div class="field" style="border-top:1px solid var(--divider);padding-top:14px;margin-top:4px;min-width:0">
      <span class="label" style="font-weight:600;color:var(--text);font-size:13px">Tautan Karya & Kebutuhan Lomba</span>
      <div class="col" style="gap:8px;margin-top:6px;min-width:0">
        <span class="faint" style="font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.03em;margin-top:2px">Berkas Karya Utama</span>
        <div class="field" style="min-width:0"><label class="label" for="p-link-ui" style="font-size:12px">🎨 Desain UI</label><input class="input" id="p-link-ui" data-in="pform" data-f="ui" placeholder="https://figma.com/design/... atau link prototype" value="${esc(f.ui || '')}" autocapitalize="off" autocorrect="off"></div>
        <div class="field" style="min-width:0"><label class="label" for="p-link-ux" style="font-size:12px">🧠 Riset dan Desain UX</label><input class="input" id="p-link-ux" data-in="pform" data-f="ux" placeholder="https://figma.com/board/... atau link riset UX" value="${esc(f.ux || '')}" autocapitalize="off" autocorrect="off"></div>
        <div class="field" style="min-width:0"><label class="label" for="p-link-slide" style="font-size:12px">📊 Slide Presentasi</label><input class="input" id="p-link-slide" data-in="pform" data-f="slide" placeholder="https://canva.com/... atau link Google Slides" value="${esc(f.slide || '')}" autocapitalize="off" autocorrect="off"></div>
        <div class="field" style="min-width:0"><label class="label" for="p-link-proposal" style="font-size:12px">📄 Proposal dan Dokumen</label><input class="input" id="p-link-proposal" data-in="pform" data-f="proposal" placeholder="https://docs.google.com/document/... atau link PDF" value="${esc(f.proposal || '')}" autocapitalize="off" autocorrect="off"></div>

        <span class="faint" style="font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.03em;margin-top:6px">Informasi & Panduan Panitia</span>
        <div class="field" style="min-width:0"><label class="label" for="p-link-website" style="font-size:12px">🌐 Website Lomba</label><input class="input" id="p-link-website" data-in="pform" data-f="website" placeholder="https://namalomba.com atau link pendaftaran..." value="${esc(f.website || '')}" autocapitalize="off" autocorrect="off"></div>
        <div class="field" style="min-width:0"><label class="label" for="p-link-guidebook" style="font-size:12px">📖 Buku Panduan</label><input class="input" id="p-link-guidebook" data-in="pform" data-f="guidebook" placeholder="https://drive.google.com/..." value="${esc(f.guidebook || '')}" autocapitalize="off" autocorrect="off"></div>
        <div class="field" style="min-width:0"><label class="label" for="p-link-submission" style="font-size:12px">📤 Formulir Pengumpulan</label><input class="input" id="p-link-submission" data-in="pform" data-f="submission" placeholder="https://forms.gle/..." value="${esc(f.submission || '')}" autocapitalize="off" autocorrect="off"></div>
        <div class="field" style="min-width:0"><label class="label" for="p-link-group" style="font-size:12px">💬 Grup Koordinasi</label><input class="input" id="p-link-group" data-in="pform" data-f="group" placeholder="https://chat.whatsapp.com/..." value="${esc(f.group || '')}" autocapitalize="off" autocorrect="off"></div>
        <div class="field" style="min-width:0"><label class="label" for="p-link-social" style="font-size:12px">📸 Media Sosial Panitia</label><input class="input" id="p-link-social" data-in="pform" data-f="social" placeholder="https://instagram.com/..." value="${esc(f.social || '')}" autocapitalize="off" autocorrect="off"></div>
      </div>
    </div>
  </form>
  <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Batal</button><button class="btn btn-primary" data-a="submitProject">${m.edit ? 'Simpan' : 'Buat Proyek'}</button></div>`;
}
export const PERMS = ['Can view', 'Can comment', 'Can edit', 'Full access'];
export function shareModal(m, H) {
  const p = proj(m.id);
  p.perms = p.perms || {};
  p.access = p.access || 'workspace';
  return `${H(`Share “${esc(p.name)}”`)}
  <div class="modal-b">
    <form class="row" style="gap:6px" data-submit="shareInvite"><div class="grow"><label class="sr" for="share-in">Invite by email</label><input class="input" id="share-in" placeholder="Add people by name or email" value="${esc(S.ui.shareQ || '')}" data-in="shareQ" autofocus></div>
      <select class="select" id="share-perm" style="width:132px" aria-label="Permission">${PERMS.map(x => `<option ${x === 'Can edit' ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <button class="btn btn-primary" data-a="shareInvite" type="button">Invite</button></form>
    ${
      S.ui.shareQ
        ? `<div class="panel" style="padding:4px">${
            D()
              .members.filter(
                x => !p.members.includes(x.id) && (x.name.toLowerCase().includes(S.ui.shareQ.toLowerCase()) || x.email.includes(S.ui.shareQ.toLowerCase())),
              )
              .map(
                x =>
                  `<button class="mi" data-a="shareAdd" data-id="${p.id}" data-mid="${x.id}">${av(x.id, 'sm', false)}${esc(x.name)}<span class="r">${esc(x.email)}</span></button>`,
              )
              .join('') ||
            `<div class="mi faint" style="cursor:default">${S.ui.shareQ.includes('@') ? `Press Invite to send an invitation to ${esc(S.ui.shareQ)}` : 'No matching members — enter an email to invite someone new'}</div>`
          }</div>`
        : ''
    }
    <div><div class="eyebrow" style="margin-bottom:4px">People with access</div>
      ${p.members
        .map(id => {
          const x = mem(id);
          if (!x) return '';
          const perm = id === p.lead ? 'Full access' : p.perms[id] || (x.role === 'Guest' ? 'Can comment' : 'Can edit');
          return `<div class="row" style="height:44px">${av(id, 'md', false)}<div class="grow"><div style="font-weight:500;font-size:13px">${esc(x.name)}${id === D().me ? ' <span class="faint" style="font-weight:400">(you)</span>' : ''}</div><div class="faint" style="font-size:11.5px">${esc(x.email)}${id === p.lead ? ' · Project lead' : ''}</div></div>
          ${id === p.lead ? `<span class="muted" style="font-size:12.5px;padding-right:8px">Full access</span>` : `<select class="select" style="width:auto;height:26px;font-size:12px;border-color:transparent;background-color:transparent" data-in="sharePerm" data-id="${p.id}" data-mid="${id}" aria-label="Permission for ${esc(x.name)}">${PERMS.map(q => `<option ${q === perm ? 'selected' : ''}>${q}</option>`).join('')}<option value="__remove">Remove access</option></select>`}</div>`;
        })
        .join('')}
    </div>
    <div style="border-top:1px solid var(--divider);padding-top:12px"><div class="eyebrow" style="margin-bottom:8px">General access</div>
      <div class="row" style="gap:10px"><span class="ftype" style="--c:var(--text-2)">${ic(p.access === 'private' ? 'lock' : 'building-2', 14)}</span><div class="grow"><select class="select" style="height:28px;width:auto;border-color:transparent;padding-left:4px;font-weight:500" data-in="shareAccess" data-id="${p.id}" aria-label="General access"><option value="private" ${p.access === 'private' ? 'selected' : ''}>Only people invited</option><option value="workspace" ${p.access === 'workspace' ? 'selected' : ''}>Everyone at ${esc(D().ws.name)}</option></select><div class="faint" style="font-size:11.5px;padding-left:4px">${p.access === 'private' ? 'Only people listed above can open this project.' : 'Anyone in the workspace can view and comment.'}</div></div></div></div>
  </div>
  <div class="modal-f"><button class="btn btn-secondary" data-a="copyLink" data-pid="${p.id}">${ic('link', 14)}Copy link</button><span class="sp"></span><button class="btn btn-primary" data-a="closeModal">Done</button></div>`;
}
export function inviteModal(m, H) {
  const err = S.ui.errors.invite;
  return `${H('Invite to ' + esc(D().ws.name), 'Invited people get an email with a link to join.')}
  <form class="modal-b" data-submit="submitInvite">
    <div class="field"><label class="label" for="inv-emails">Email addresses</label><textarea class="textarea ${err ? 'is-error' : ''}" id="inv-emails" placeholder="name@company.com, another@company.com" rows="3" autofocus>${esc(S.ui.inviteDraft || '')}</textarea>${err ? `<span class="err">${ic('circle-alert', 12)}${err}</span>` : '<span class="hint">Separate multiple addresses with commas.</span>'}</div>
    <div class="row" style="gap:12px"><div class="field grow"><label class="label" for="inv-role">Role</label><select class="select" id="inv-role">${['Member', 'Admin', 'Guest'].map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field grow"><label class="label" for="inv-team">Team</label><select class="select" id="inv-team">${teamsList()
      .map(t => `<option value="${t.id}">${t.name}</option>`)
      .join('')}</select></div></div>
    <div class="alert info">${ic('info', 14)}<span><b>Guests</b> can only see projects they're added to and can't create projects.</span></div>
  </form>
  <div class="modal-f"><button class="btn btn-ghost" data-a="copyInviteLink">${ic('link', 14)}Copy invite link</button><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal">Cancel</button><button class="btn btn-primary" data-a="submitInvite" id="inv-submit">Send invites</button></div>`;
}
export function confirmModal(m) {
  const needs = m.typeName;
  const ok = !needs || (S.ui.confirmText || '') === needs;
  return `<div class="modal-b" style="padding-top:18px;gap:10px">
    <div class="row" style="gap:12px;align-items:flex-start"><span class="ftype" style="--c:${m.danger ? 'var(--red)' : 'var(--amber)'};width:34px;height:34px;border-radius:9px">${ic(m.icon || (m.danger ? 'trash-2' : 'archive'), 17)}</span>
    <div class="grow"><h2 id="mt-confirm" style="font-size:15px;font-weight:600;margin:4px 0 6px">${esc(m.title)}</h2><p class="muted" style="margin:0;font-size:13px;line-height:1.55">${m.body}</p></div></div>
    ${needs ? `<div class="field" style="margin-top:6px"><label class="label" for="confirm-in" style="font-weight:400;color:var(--text-2)">Type <b style="color:var(--text);font-weight:600">${esc(needs)}</b> to confirm</label><input class="input" id="confirm-in" data-in="confirmText" autocomplete="off" autofocus value="${esc(S.ui.confirmText || '')}"></div>` : ''}
  </div>
  <div class="modal-f"><span class="sp"></span><button class="btn btn-secondary" data-a="closeModal" ${needs ? '' : 'autofocus'}>Cancel</button><button class="btn ${m.danger ? 'btn-danger' : 'btn-primary'}" data-a="confirmOk" ${ok ? '' : 'disabled'}>${esc(m.ok)}</button></div>`;
}
export const SHORTCUTS = [
  [
    'General',
    [
      ['Command menu', [MOD, 'K']],
      ['Search', ['/']],
      ['Keyboard shortcuts', ['?']],
      ['Toggle sidebar', ['[']],
      ['Toggle dark mode', [MOD, 'Shift', 'L']],
      ['Close panel or dialog', ['Esc']],
    ],
  ],
  [
    'Create',
    [
      ['New task', ['N']],
      ['New project', ['P']],
      ['Submit form', [MOD, '↵']],
      ['Send comment', [MOD, '↵']],
    ],
  ],
  [
    'Navigate',
    [
      ['Go to Home', ['G', 'H']],
      ['Go to My Tasks', ['G', 'T']],
      ['Go to Projects', ['G', 'P']],
      ['Go to Inbox', ['G', 'I']],
      ['Go to Calendar', ['G', 'C']],
      ['Go to Settings', ['G', 'S']],
    ],
  ],
  [
    'Command menu',
    [
      ['Move selection', ['↑', '↓']],
      ['Run command', ['↵']],
      ['Search mode', ['Tab']],
    ],
  ],
];
export function shortcutsModal(H) {
  return `${H('Keyboard shortcuts')}<div class="modal-b" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px">${SHORTCUTS.map(([g, list]) => `<div><div class="eyebrow" style="margin-bottom:6px">${g}</div>${list.map(([n, k]) => `<div class="row" style="height:30px;font-size:13px;border-bottom:1px solid var(--divider)"><span class="grow">${n}</span>${k.map((x, i) => `${i && k[0] === 'G' ? '<span class="faint" style="font-size:11px">then</span>' : ''}<kbd>${x}</kbd>`).join('')}</div>`).join('')}</div>`).join('')}</div>`;
}
export function filePreviewModal(m, H) {
  const f = m.file;
  const t = FT[f.type] || FT.other;
  const isImg = f.url && (f.type === 'img' || (f.name && /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(f.name)));
  return `${H(esc(f.name), `${t.n} · ${f.size} · Uploaded by ${esc(mem(f.by)?.name || 'you')} ${ago(f.at)}`)}
  <div class="modal-b">
    ${isImg ? `<div style="text-align:center;background:var(--sunken);padding:12px;border-radius:var(--r-lg);border:1px solid var(--border);max-height:65vh;overflow:auto"><img src="${f.url}" alt="${esc(f.name)}" style="max-width:100%;max-height:60vh;object-fit:contain;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.2)" /></div>` : `<div style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">${filePrev(f).replace('class="fprev"', 'class="fprev" style="aspect-ratio:16/9"')}</div>`}
    ${m.tid ? `<div class="row faint" style="font-size:12.5px">${ic('link', 13)}Attached to <button class="link" data-a="openTask" data-id="${m.tid}">${esc(task(m.tid)?.title)}</button></div>` : ''}
  </div>
  <div class="modal-f">
    ${f.url ? `<a class="btn btn-secondary btn-sm" href="${f.url}" download="${esc(f.name)}">${ic('download', 14)}<span>Unduh WebP</span></a>` : `<button class="btn btn-secondary btn-sm" data-a="copyLink" data-fid="${f.id}">${ic('link', 14)}<span>Salin Tautan</span></button>`}
    <span class="sp"></span>
    <button class="btn btn-primary btn-sm" data-a="closeModal">Tutup</button>
  </div>`;
}
