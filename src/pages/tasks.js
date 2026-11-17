/* ---------- WORKSPACE TASKS ---------- */
import { ic } from '../core/icons.js';
import { allTasks, canSee, visibleProjects } from '../core/store.js';
import { applyView, groupTasks, viewOf, viewToolbar } from '../shell/view-engine.js';
import { listHtml } from '../components/task-list.js';
import { boardHtml } from '../views/board.js';

export function pageTasks() {
  const key = 'tasks';
  const v = viewOf(key);
  if (v.mode === 'table') v.mode = 'list';
  v.mode = v.mode || 'list';
  const ts = applyView(allTasks(), v);
  const right = `<div class="seg">${[
    ['list', 'List', 'list'],
    ['board', 'Board', 'square-kanban'],
  ]
    .map(
      ([k, n, i]) =>
        `<button class="${v.mode === k ? 'on' : ''}" data-a="setViewMode" data-key="${key}" data-v="${k}">${ic(i, 13)}<span class="hide-m">${n}</span></button>`,
    )
    .join('')}</div>`;
  let body;
  if (v.mode === 'board') body = boardHtml(ts, key, {});
  else body = `<div class="list-wrap">${listHtml(groupTasks(ts, v.group), key, { cols: ['status', 'assignee', 'priority', 'due', 'project'] })}</div>`;
  return `<div class="page flush">
    <div class="ph"><div><h1>Tasks</h1><p>Every task across ${visibleProjects().filter(canSee).length} projects.</p></div><div class="acts"><button class="btn btn-primary" data-a="newTask">${ic('plus', 14)}New task</button></div></div>
    ${viewToolbar(key, { right, cols: false, group: v.mode !== 'board' })}
    ${body}
  </div>`;
}
