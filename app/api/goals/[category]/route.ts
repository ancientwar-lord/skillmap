import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';
import {
  getCurrentPeriodKey,
  generateExpectedPeriods,
  isRecurrenceCategory,
  type RecurrenceType,
} from '@/lib/utils';

type GoalCategory =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'LONGTERM'
  | 'PASSION'
  | 'BOREDOM'
  | 'RANDOM'
  | 'CUSTOM';

interface Params {
  params: Promise<{ category: string }>;
}

const validCategories = new Set([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'LONGTERM',
  'PASSION',
  'BOREDOM',
  'RANDOM',
  'CUSTOM',
]);

interface GoalItemPayload {
  id?: string;
  text: string;
  startDate?: string | null;
  targetDate?: string | null;
  isRepetitive?: boolean;
  completed?: boolean;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await verifySession();

    const resolvedParams = await params;
    const rawCat = resolvedParams.category;

    if (typeof rawCat !== 'string' || !rawCat) {
      return NextResponse.json({ error: 'Missing category' }, { status: 400 });
    }
    const category = rawCat.toUpperCase();
    if (!validCategories.has(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const catEnum = category as GoalCategory;

    const section = await db.goalSection.findFirst({
      where: { userId: session.userId, category: catEnum },
      include: { items: true },
    });
    type RawItem = {
      id: string;
      text: string;
      completed: boolean;
      startDate?: Date | null;
      targetDate?: Date | null;
      isRepetitive?: boolean;
      createdAt?: Date;
      [key: string]: unknown;
    };
    const rawItems = (section?.items ?? []) as RawItem[];
    const repetitiveIds = rawItems
      .filter((i) => i.isRepetitive)
      .map((i) => i.id);
    const logCompletionMap = new Map<string, boolean>();
    const completedPeriodsMap = new Map<string, Set<string>>();

    if (repetitiveIds.length > 0 && isRecurrenceCategory(category)) {
      const currentPeriodKey = getCurrentPeriodKey(category as RecurrenceType);
      const allLogs = await db.goalLog.findMany({
        where: {
          goalId: { in: repetitiveIds },
          userId: session.userId,
          isCompleted: true,
        },
        select: { goalId: true, periodKey: true },
      });

      for (const log of allLogs) {
        if (log.periodKey === currentPeriodKey) {
          logCompletionMap.set(log.goalId, true);
        }
        let set = completedPeriodsMap.get(log.goalId);
        if (!set) {
          set = new Set<string>();
          completedPeriodsMap.set(log.goalId, set);
        }
        set.add(log.periodKey);
      }
    }

    const now = new Date();

    const items = rawItems.map((i) => {
      const base = {
        id: i.id,
        text: i.text,
        startDate: i.startDate ? (i.startDate as Date).toISOString() : null,
        targetDate: i.targetDate ? (i.targetDate as Date).toISOString() : null,
        completed: i.isRepetitive
          ? (logCompletionMap.get(i.id) ?? false)
          : !!i.completed,
        isRepetitive: !!i.isRepetitive,
      };
      if (i.isRepetitive && isRecurrenceCategory(category)) {
        const effectiveStart = (i.startDate ??
          i.createdAt ??
          new Date()) as Date;
        const expectedPeriods = generateExpectedPeriods(
          category as RecurrenceType,
          effectiveStart,
          now
        );
        const completedPeriods =
          completedPeriodsMap.get(i.id) ?? new Set<string>();
        const missedPeriods = expectedPeriods.filter(
          (p) => !completedPeriods.has(p)
        );
        return { ...base, missedPeriods };
      }

      return base;
    });

    return NextResponse.json({
      sectionId: section?.id || null,
      items,
    });
  } catch (err) {
    console.error('GET /api/goals/[category] error', err);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await verifySession();
    const resolvedParams = await params;
    const rawCat = resolvedParams.category;

    if (typeof rawCat !== 'string' || !rawCat) {
      return NextResponse.json({ error: 'Missing category' }, { status: 400 });
    }
    const category = rawCat.toUpperCase();
    if (!validCategories.has(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const { items } = await req.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const catEnum = category as GoalCategory;

    let section = await db.goalSection.findFirst({
      where: { userId: session.userId, category: catEnum },
    });

    if (!section) {
      section = await db.goalSection.create({
        data: { userId: session.userId, name: category, category: catEnum },
      });
    } else {
      section = await db.goalSection.update({
        where: { id: section.id },
        data: { name: category },
      });
    }

    await db.goalItem.deleteMany({ where: { sectionId: section.id } });

    for (const item of items as GoalItemPayload[]) {
      if (item && typeof item.text === 'string' && item.text.trim()) {
        const createData = {
          userId: session.userId,
          sectionId: section.id,
          text: item.text.trim(),
          completed: item.completed ? true : false,
          ...(item.startDate ? { startDate: new Date(item.startDate) } : {}),
          ...(item.targetDate ? { targetDate: new Date(item.targetDate) } : {}),
          ...(item.isRepetitive ? { isRepetitive: item.isRepetitive } : {}),
        };
        await db.goalItem.create({ data: createData });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/goals/[category] error', err);
    return NextResponse.json(
      { error: 'Failed to save goals' },
      { status: 500 }
    );
  }
}
