import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { getCurrentPeriodKey, isRecurrenceCategory } from '@/lib/utils';

export async function GET() {
  try {
    const session = await verifySession();

    const items = await db.goalItem.findMany({
      where: { userId: session.userId },
      include: { section: true },
      orderBy: { createdAt: 'desc' },
    });
    const repetitiveItems = items.filter((i) => i.isRepetitive);
    const logCompletionMap = new Map<string, boolean>();

    if (repetitiveItems.length > 0) {
      const goalIdsByPeriodKey = new Map<string, string[]>();
      for (const item of repetitiveItems) {
        const cat = item.section?.category;
        if (!isRecurrenceCategory(cat)) continue;
        const periodKey = getCurrentPeriodKey(cat);
        const ids = goalIdsByPeriodKey.get(periodKey) || [];
        ids.push(item.id);
        goalIdsByPeriodKey.set(periodKey, ids);
      }

      const allGoalIds = repetitiveItems.map((i) => i.id);
      const allPeriodKeys = [...goalIdsByPeriodKey.keys()];

      if (allGoalIds.length > 0 && allPeriodKeys.length > 0) {
        const logs = await db.goalLog.findMany({
          where: {
            goalId: { in: allGoalIds },
            periodKey: { in: allPeriodKeys },
          },
          select: { goalId: true, isCompleted: true },
        });
        for (const log of logs) {
          logCompletionMap.set(log.goalId, log.isCompleted);
        }
      }
    }

    const payload = items.map((i) => ({
      id: i.id,
      text: i.text,
      completed: i.isRepetitive
        ? (logCompletionMap.get(i.id) ?? false)
        : i.completed,
      targetDate: i.targetDate ? i.targetDate.toISOString() : null,
      isPinned: i.isPinned,
      isRepetitive: !!i.isRepetitive,
      category: i.section?.category || null,
    }));

    return NextResponse.json(
      { items: payload },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('GET /api/goals/items error', err);
    return NextResponse.json(
      { error: 'Failed to fetch goal items' },
      { status: 500 }
    );
  }
}
