import { RoadmapSummary, TodoItem } from './types';

// ── IST offset: UTC+5:30 = 330 minutes ─────────────────
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19800000

/** Convert a Date to a new Date representing the IST wall-clock time in UTC fields */
function toIST(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

// ── Period-key utilities ────────────────────────────────

export function getISOWeekNumber(date: Date): number {
  // date is expected to already be IST-shifted
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // Set to nearest Thursday: current date + 4 − current day number (Mon=1…Sun=7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return weekNo;
}

/*
 * Generates the current period key for a given recurrence type.
 *
 * | Recurrence | Format          | Example      |
 * |------------|-----------------|--------------|
 * | DAILY      | `YYYY-MM-DD`    | `2026-03-05` |
 * | WEEKLY     | `YYYY-Www`      | `2026-W10`   |
 * | MONTHLY    | `YYYY-MM`       | `2026-03`    |
 *
 */
export function getCurrentPeriodKey(
  recurrence: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  now: Date = new Date()
): string {
  const ist = toIST(now);
  const yyyy = ist.getUTCFullYear();
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(ist.getUTCDate()).padStart(2, '0');

  switch (recurrence) {
    case 'DAILY':
      return `${yyyy}-${mm}-${dd}`;
    case 'WEEKLY': {
      const week = String(getISOWeekNumber(ist)).padStart(2, '0');
      return `${yyyy}-W${week}`;
    }
    case 'MONTHLY':
      return `${yyyy}-${mm}`;
    default:
      throw new Error(`Unknown recurrence type: ${recurrence}`);
  }
}

// ── Recurrence categories that map to period-key types ──────────────

const RECURRENCE_CATEGORIES = new Set(['DAILY', 'WEEKLY', 'MONTHLY'] as const);

export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export function isRecurrenceCategory(
  value: string | null | undefined
): value is RecurrenceType {
  return !!value && RECURRENCE_CATEGORIES.has(value as RecurrenceType);
}

export function getPeriodKeyForDate(
  recurrence: RecurrenceType,
  date: Date
): string {
  const ist = toIST(date);
  const yyyy = ist.getUTCFullYear();
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(ist.getUTCDate()).padStart(2, '0');

  switch (recurrence) {
    case 'DAILY':
      return `${yyyy}-${mm}-${dd}`;
    case 'WEEKLY': {
      const week = String(getISOWeekNumber(ist)).padStart(2, '0');
      return `${yyyy}-W${week}`;
    }
    case 'MONTHLY':
      return `${yyyy}-${mm}`;
  }
}

export function generateExpectedPeriods(
  recurrence: RecurrenceType,
  startDate: Date,
  now: Date = new Date()
): string[] {
  const currentKey = getCurrentPeriodKey(recurrence, now);
  const periods: string[] = [];

  // Work in IST for cap calculation
  const istNow = toIST(now);
  let cap: Date;
  switch (recurrence) {
    case 'DAILY':
      cap = new Date(
        Date.UTC(
          istNow.getUTCFullYear(),
          istNow.getUTCMonth(),
          istNow.getUTCDate() - 90
        )
      );
      break;
    case 'WEEKLY':
      cap = new Date(
        Date.UTC(
          istNow.getUTCFullYear(),
          istNow.getUTCMonth(),
          istNow.getUTCDate() - 12 * 7
        )
      );
      break;
    case 'MONTHLY':
      cap = new Date(
        Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() - 3, 1)
      );
      break;
  }

  // Convert startDate to IST for comparison
  const istStart = toIST(startDate);
  const effectiveStart = istStart.getTime() >= cap.getTime() ? istStart : cap;

  let cursor: Date;
  switch (recurrence) {
    case 'DAILY':
    case 'WEEKLY':
      cursor = new Date(
        Date.UTC(
          effectiveStart.getUTCFullYear(),
          effectiveStart.getUTCMonth(),
          effectiveStart.getUTCDate()
        )
      );
      break;
    case 'MONTHLY':
      cursor = new Date(
        Date.UTC(
          effectiveStart.getUTCFullYear(),
          effectiveStart.getUTCMonth(),
          1
        )
      );
      break;
  }

  // Cursor is already in IST-aligned UTC fields, so getPeriodKeyForDate
  // will apply toIST again — we need to feed it a raw date that, when
  // shifted by +5:30, gives back our cursor values. So subtract the offset.
  const cursorToRaw = (c: Date) => new Date(c.getTime() - IST_OFFSET_MS);

  const MAX_ITERATIONS = 400;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const key = getPeriodKeyForDate(recurrence, cursorToRaw(cursor));
    if (key === currentKey) break;
    periods.push(key);

    switch (recurrence) {
      case 'DAILY':
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        break;
      case 'WEEKLY':
        cursor.setUTCDate(cursor.getUTCDate() + 7);
        break;
      case 'MONTHLY':
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        break;
    }
  }

  return periods;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
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
