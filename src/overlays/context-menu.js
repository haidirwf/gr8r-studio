/* ---------------- CONTEXT MENUS ---------------- */
import { ic } from '../core/icons.js';
import { ST } from '../core/constants.js';
import { fmtDate } from '../core/utils.js';
import { D, mem, proj, task, visibleProjects } from '../core/store.js';

export function ctxMenu(p) {
  const I = (act, icon, label, extra = '', r = '') =>
    `<button class="mi ${extra}" data-a="${act}" data-id="${p.id}" data-key="${p.key || ''}">${ic(icon, 15)}${label}${r ? `<span class="r">${r}</span>` : ''}</button>`;
  const sep = '<div class="msep"></div>';
  if (p.ctx === 'task') {
    const t = task(p.id);
    if (!t) return '';
    return (
      I('openQuickTask', 'layout-list', 'Buka Tugas') +
      I('openTask', 'panel-right-open', 'Buka Panel Samping') +
      I('editTask', 'pencil', 'Edit Lengkap', '', 'E') +
      I('toggleDone', t.status === 'done' ? 'rotate-ccw' : 'circle-check', t.status === 'done' ? 'Buka Kembali' : 'Tandai Selesai') +
      sep +
      I('ctxStatus', 'circle-dot', 'Ubah Status…') +
      I('ctxAssign', 'user', 'Tugaskan ke…') +
      I('ctxPrio', 'signal-high', 'Ubah Prioritas…') +
      I('ctxMove', 'folder-input', 'Pindahkan ke Proyek…') +
      sep +
      I('toggleFavTask', 'star', t.fav ? 'Hapus dari Favorit' : 'Tambah ke Favorit') +
      I('copyLink', 'link', 'Salin Tautan') +
      I('dupTask', 'copy', 'Duplikat') +
      I('archiveTask', 'archive', 'Arsipkan') +
      sep +
      I('delTask', 'trash-2', 'Hapus Tugas', 'danger', 'Del')
    );
  }
  if (p.ctx === 'project') {
    const pr = proj(p.id);
    if (!pr) return '';
    return (
      I('openProject', 'arrow-up-right', 'Buka Proyek') +
      I('newTaskForProj', 'plus', 'Tambah Tugas untuk Proyek Ini...') +
      I('editProject', 'pencil', 'Edit Detail & Deadline Proyek') +
      I('toggleFavProj', 'star', pr.fav ? 'Hapus dari Favorit' : 'Tambah ke Favorit') +
      sep +
      I('share', 'share-2', 'Bagikan') +
      I('copyLink', 'link', 'Salin Tautan') +
      I('dupProject', 'copy', 'Duplikat Proyek') +
      sep +
      (visibleProjects().indexOf(pr) > 0 ? I('projUp', 'arrow-up', 'Pindah ke Atas') : '') +
      (visibleProjects().indexOf(pr) < visibleProjects().length - 1 ? I('projDown', 'arrow-down', 'Pindah ke Bawah') : '') +
      sep +
      I('archiveProject', 'archive', pr.status === 'complete' ? 'Arsipkan' : 'Arsipkan Proyek') +
      I('delProject', 'trash-2', 'Hapus Proyek', 'danger')
    );
  }
  if (p.ctx === 'calday') {
    const ds = p.id || p.date;
    return (
      `<div class="mh" style="font-weight:600;font-size:12px;color:var(--text)">${fmtDate(ds, true)}</div>` +
      I('newCalTask', 'plus', 'Tugas Baru pada Tanggal Ini') +
      I('newCalProject', 'folder-plus', 'Proyek Baru (Deadline Tanggal Ini)') +
      sep +
      I('selectCalDay', 'calendar', 'Lihat Agenda Tanggal Ini')
    );
  }
  if (p.ctx === 'column') {
    return (
      `<div class="mh">${ST[p.id].name}</div>` +
      I('colAdd', 'plus', 'Add task') +
      I('colCollapse', 'fold-horizontal', 'Collapse column') +
      (p.id !== 'done' ? I('colDoneAll', 'check-check', 'Mark all as done') : I('colArchive', 'archive', 'Archive completed')) +
      I('colSortPrio', 'arrow-down-wide-narrow', 'Sort by priority')
    );
  }
  if (p.ctx === 'member') {
    const m = mem(p.id);
    if (!m) return '';
    const canRm = m.role !== 'Owner' && m.id !== D().me;
    return (
      I('viewProfile', 'user', 'View profile') +
      I('assignToMember', 'plus', 'Assign a task') +
      I('copyEmail', 'mail', 'Copy email') +
      (canRm
        ? I('ctxRole', 'shield', 'Change role…') +
          (m.status === 'invited' ? I('resendInvite', 'send', 'Resend invite') : '') +
          sep +
          I('removeMember', 'user-minus', 'Remove from workspace', 'danger')
        : '')
    );
  }
  if (p.ctx === 'file') {
    return (
      I('previewFile', 'eye', 'Preview') +
      I('renameFile', 'pencil', 'Rename') +
      I('copyLink', 'link', 'Copy link') +
      I('dupFile', 'copy', 'Duplicate') +
      sep +
      I('delFile', 'trash-2', 'Delete', 'danger')
    );
  }
  if (p.ctx === 'savedview') {
    return `<button class="mi" data-a="renameView" data-id="${p.vid}">${ic('pencil', 15)}Rename view</button><button class="mi danger" data-a="delView" data-id="${p.vid}">${ic('trash-2', 15)}Delete view</button>`;
  }
  return '';
}
