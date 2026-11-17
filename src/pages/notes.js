/* =====================================================================
   QUICK NOTES PAGE (Google Keep style for ide lomba & tugas SKL)
   ===================================================================== */
import { ago, esc } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { S, allNotes, note } from '../core/store.js';
import { empty } from '../ui/helpers.js';

export const NOTE_COLORS = {
  default: { name: 'Default', hex: 'var(--surface)', bg: 'var(--surface)', border: 'var(--border)' },
  sand: { name: 'Sand (Kuning)', hex: '#8f5e0e', bg: 'color-mix(in srgb, var(--amber) 16%, var(--surface))', border: 'color-mix(in srgb, var(--amber) 35%, var(--border))' },
  mint: { name: 'Mint (Hijau)', hex: '#25754b', bg: 'color-mix(in srgb, var(--green) 14%, var(--surface))', border: 'color-mix(in srgb, var(--green) 35%, var(--border))' },
  fog: { name: 'Fog (Biru)', hex: '#3570c4', bg: 'color-mix(in srgb, var(--blue) 14%, var(--surface))', border: 'color-mix(in srgb, var(--blue) 35%, var(--border))' },
  blossom: { name: 'Blossom (Pink)', hex: '#bc4270', bg: 'color-mix(in srgb, var(--rose) 14%, var(--surface))', border: 'color-mix(in srgb, var(--rose) 35%, var(--border))' },
  coral: { name: 'Coral (Merah)', hex: '#b23c30', bg: 'color-mix(in srgb, var(--red) 14%, var(--surface))', border: 'color-mix(in srgb, var(--red) 35%, var(--border))' },
  peach: { name: 'Peach (Oranye)', hex: '#c0612b', bg: 'color-mix(in srgb, var(--orange) 14%, var(--surface))', border: 'color-mix(in srgb, var(--orange) 35%, var(--border))' },
  sage: { name: 'Sage (Teal)', hex: '#1e8580', bg: 'color-mix(in srgb, var(--teal) 14%, var(--surface))', border: 'color-mix(in srgb, var(--teal) 35%, var(--border))' },
  dusk: { name: 'Dusk (Ungu)', hex: '#7652c2', bg: 'color-mix(in srgb, var(--violet) 14%, var(--surface))', border: 'color-mix(in srgb, var(--violet) 35%, var(--border))' },
};

export function noteCard(n) {
  const col = NOTE_COLORS[n.color] || NOTE_COLORS.default;
  const time = n.updatedAt ? ago(new Date(n.updatedAt).getTime()) : 'baru saja';
  return `<div class="note-card" style="--card-bg:${col.bg};--card-border:${col.border}" data-a="openEditNote" data-id="${n.id}" tabindex="0" role="article" aria-label="Catatan: ${esc(n.title || n.content.slice(0, 30))}">
    <div class="note-card-h">
      <div class="note-card-title ${n.title ? '' : 'empty'}">${esc(n.title || 'Tanpa judul')}</div>
      <button type="button" class="ibtn ibtn-xs note-pin-btn ${n.pinned ? 'pinned' : ''}" data-a="togglePinNote" data-id="${n.id}" aria-label="${n.pinned ? 'Lepas sematan' : 'Sematkan catatan'}" data-tip="${n.pinned ? 'Lepas sematan' : 'Sematkan'}" tabindex="0">${ic('pin', 14)}</button>
    </div>
    <div class="note-card-body">${esc(n.content)}</div>
    <div class="note-card-f">
      <span>${time}</span>
      <div class="note-card-actions">
        <button type="button" class="ibtn ibtn-xs" data-a="pop" data-pop="noteColor" data-id="${n.id}" aria-label="Ubah warna" data-tip="Ubah warna">${ic('palette', 14)}</button>
        <button type="button" class="ibtn ibtn-xs" data-a="openEditNote" data-id="${n.id}" aria-label="Edit catatan" data-tip="Edit">${ic('pencil', 14)}</button>
        <button type="button" class="ibtn ibtn-xs" data-a="deleteNote" data-id="${n.id}" aria-label="Hapus catatan" data-tip="Hapus">${ic('trash-2', 14)}</button>
      </div>
    </div>
  </div>`;
}

export function noteComposer() {
  const draft = S.ui.noteDraft || { active: false, title: '', content: '', color: 'default', pinned: false };
  const col = NOTE_COLORS[draft.color] || NOTE_COLORS.default;

  if (!draft.active) {
    return `<div class="notes-composer-wrap">
      <div class="notes-composer" data-a="expandNoteComposer" role="button" tabindex="0" aria-label="Tulis catatan cepat baru">
        <div class="composer-collapsed">
          ${ic('sticky-note', 18)}
          <span class="composer-placeholder">Catat cepat ide lomba atau tugas SKL…</span>
          <button type="button" class="ibtn ibtn-sm" data-a="expandNoteComposer" aria-label="Buat catatan baru">${ic('plus', 16)}</button>
        </div>
      </div>
    </div>`;
  }

  return `<div class="notes-composer-wrap">
    <div class="notes-composer active" style="background:${col.bg};border-color:${col.border}">
      <form class="composer-expanded" data-submit="saveNewNote">
        <input class="notes-composer-title" id="note-draft-title" data-in="noteDraftTitle" value="${esc(draft.title)}" placeholder="Judul ide lomba atau tugas SKL…" autofocus>
        <textarea class="notes-composer-content" id="note-draft-content" data-in="noteDraftContent" placeholder="Tulis detail catatan, checklist SKL, tautan referensi..." rows="3" data-autosize>${esc(draft.content)}</textarea>
        <div class="notes-composer-bar">
          <div class="note-swatches" role="radiogroup" aria-label="Warna catatan">
            ${Object.entries(NOTE_COLORS)
              .map(
                ([k, c]) =>
                  `<button type="button" role="radio" aria-checked="${draft.color === k}" class="note-swatch ${draft.color === k ? 'on' : ''}" style="--sw-bg:${c.bg}" data-a="setNewNoteColor" data-c="${k}" title="${c.name}">${draft.color === k ? ic('check', 11) : ''}</button>`,
              )
              .join('')}
          </div>
          <button type="button" class="ibtn ibtn-sm note-pin-btn ${draft.pinned ? 'pinned' : ''}" data-a="toggleNewNotePin" aria-label="${draft.pinned ? 'Lepas sematan' : 'Sematkan catatan'}" data-tip="${draft.pinned ? 'Disematkan' : 'Sematkan'}">${ic('pin', 15)}</button>
          <span class="sp"></span>
          <button type="button" class="btn btn-secondary btn-sm" data-a="closeNoteComposer">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm" data-a="saveNewNote">Simpan</button>
        </div>
      </form>
    </div>
  </div>`;
}

export function pageNotes() {
  const all = allNotes();
  const q = (S.ui.noteSearch || '').trim().toLowerCase();
  const filtered = q
    ? all.filter(n => (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q)))
    : all;

  const pinned = filtered.filter(n => n.pinned);
  const others = filtered.filter(n => !n.pinned);

  return `<div class="page wide notes-page">
    <div class="ph notes-header">
      <div>
        <h1>Quick Notes</h1>
        <p>Pengganti Google Keep untuk mencatat cepat ide lomba, referensi riset, dan tugas SKL.</p>
      </div>
      <div class="notes-search-wrap">
        ${ic('search', 15)}
        <input class="input" type="search" placeholder="Cari catatan, ide lomba, atau tugas SKL…" data-in="noteSearch" value="${esc(S.ui.noteSearch || '')}" aria-label="Cari catatan">
      </div>
    </div>

    ${noteComposer()}

    ${
      !filtered.length
        ? `<div class="panel">${empty(
            'sticky-note',
            q ? 'Catatan tidak ditemukan' : 'Belum ada catatan',
            q ? `Tidak ada catatan yang cocok dengan pencarian “${q}”.` : 'Mulai catat ide lomba baru atau rincian tugas SKL menggunakan kotak di atas!',
          )}</div>`
        : `
          ${
            pinned.length
              ? `<div class="notes-section">
                  <div class="notes-section-title">${ic('pin', 13)}<span>Disematkan · ${pinned.length}</span></div>
                  <div class="notes-grid">${pinned.map(noteCard).join('')}</div>
                </div>`
              : ''
          }

          ${
            others.length
              ? `<div class="notes-section">
                  ${pinned.length ? `<div class="notes-section-title"><span>Catatan Lainnya · ${others.length}</span></div>` : ''}
                  <div class="notes-grid">${others.map(noteCard).join('')}</div>
                </div>`
              : ''
          }
        `
    }
  </div>`;
}

export function noteModal(m, H) {
  const n = note(m.id);
  if (!n) return '';
  const col = NOTE_COLORS[n.color] || NOTE_COLORS.default;
  const time = n.updatedAt ? ago(new Date(n.updatedAt).getTime()) : 'baru saja';

  return `${H('Edit Catatan', `<span class="faint">Terakhir diperbarui: ${time}</span>`)}
  <form class="modal-b" data-submit="saveEditNote" style="gap:12px;background:${col.bg};border-radius:var(--r);padding:14px;border:1px solid ${col.border}">
    <div class="field">
      <label class="sr" for="note-edit-title">Judul Catatan</label>
      <input class="input input-lg" id="note-edit-title" data-in="noteEditTitle" value="${esc(n.title)}" placeholder="Judul ide lomba atau tugas SKL..." style="font-size:15px;font-weight:600" autofocus>
    </div>
    <div class="field">
      <label class="sr" for="note-edit-content">Isi Catatan</label>
      <textarea class="textarea" id="note-edit-content" data-in="noteEditContent" rows="6" placeholder="Tulis detail catatan, checklist SKL, tautan referensi..." data-autosize style="font-size:13.5px;line-height:1.5">${esc(n.content)}</textarea>
    </div>
    <div class="row" style="gap:12px;align-items:center;flex-wrap:wrap">
      <div class="field">
        <span class="label">Pilih Warna</span>
        <div class="note-swatches" role="radiogroup" aria-label="Warna catatan">
          ${Object.entries(NOTE_COLORS)
            .map(
              ([k, c]) =>
                `<button type="button" role="radio" aria-checked="${n.color === k}" class="note-swatch ${n.color === k ? 'on' : ''}" style="--sw-bg:${c.bg}" data-a="setNoteColor" data-id="${n.id}" data-c="${k}" title="${c.name}">${n.color === k ? ic('check', 11) : ''}</button>`,
            )
            .join('')}
        </div>
      </div>
      <span class="sp"></span>
      <button type="button" class="btn btn-secondary btn-sm ${n.pinned ? 'btn-primary' : ''}" data-a="togglePinNote" data-id="${n.id}">${ic('pin', 14)}${n.pinned ? 'Disematkan' : 'Sematkan'}</button>
    </div>
  </form>
  <div class="modal-f">
    <button type="button" class="btn btn-danger btn-sm" data-a="deleteNote" data-id="${n.id}">${ic('trash-2', 14)}Hapus</button>
    <span class="sp"></span>
    <button type="button" class="btn btn-secondary" data-a="closeModal">Batal</button>
    <button type="button" class="btn btn-primary" data-a="saveEditNote" data-id="${n.id}">Simpan Perubahan</button>
  </div>`;
}
