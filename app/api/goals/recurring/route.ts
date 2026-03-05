import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';
import {
  getCurrentPeriodKey,
  isRecurrenceCategory,
  type RecurrenceType,
} from '@/lib/utils';

export async function GET() {
  try {
    const session = await verifySession();
    const now = new Date();
    const goals = await db.goalItem.findMany({
      where: {
        userId: session.userId,
        isRepetitive: true,
        startDate: { lte: now },
        section: {
          category: { in: ['DAILY', 'WEEKLY', 'MONTHLY'] },
        },
      },
      include: {
        section: {
          select: { category: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (goals.length === 0) {
      return NextResponse.json(
        { habits: [] },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }
    const goalPeriodMap = new Map<string, string>();
    const allPeriodKeys = new Set<string>();

    for (const goal of goals) {
      const recurrence = goal.section.category as RecurrenceType;
      if (!isRecurrenceCategory(recurrence)) continue; // guard
      const periodKey = getCurrentPeriodKey(recurrence, now);
      goalPeriodMap.set(goal.id, periodKey);
      allPeriodKeys.add(periodKey);
    }
    const existingLogs = await db.goalLog.findMany({
      where: {
        userId: session.userId,
        goalId: { in: [...goalPeriodMap.keys()] },
        periodKey: { in: [...allPeriodKeys] },
      },
      select: {
        goalId: true,
        periodKey: true,
        isCompleted: true,
      },
    });
    const completedSet = new Map<string, boolean>();
    for (const log of existingLogs) {
      completedSet.set(`${log.goalId}::${log.periodKey}`, log.isCompleted);
    }
    const habits = goals.map((goal) => {
      const periodKey = goalPeriodMap.get(goal.id)!;
      const logKey = `${goal.id}::${periodKey}`;
      const isCompleted = completedSet.get(logKey) ?? false;

      return {
        id: goal.id,
        text: goal.text,
        recurrence: goal.section.category as RecurrenceType,
        periodKey,
        isCompleted,
        startDate: goal.startDate?.toISOString() ?? null,
        category: goal.section.category,
        sectionName: goal.section.name,
      };
    });

    return NextResponse.json(
      { habits },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('GET /api/goals/recurring error', err);
    return NextResponse.json(
      { error: 'Failed to fetch recurring goals' },
      { status: 500 }
    );
  }
}
