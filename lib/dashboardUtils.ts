import { RoadmapSummary, TodoItem } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^ws-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

export function isTodayDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function buildTodosFromRoadmaps(roadmaps: RoadmapSummary[]): TodoItem[] {
  return roadmaps.map((r) => {
    const remaining = r.subtaskCount - r.completedSubtasks;
    const completed = r.progress === 100;
    const d = new Date(r.updatedAt || r.createdAt);
    return {
      id: `todo-${r.id}`,
      title: completed
        ? `✅ Completed "${r.title}"`
        : `Continue "${r.title}" — ${remaining} subtask${
            remaining !== 1 ? 's' : ''
          } left`,
      date: d.toISOString().split('T')[0],
      completed,
      roadmapSlug: slugify(r.title),
    };
  });
}
