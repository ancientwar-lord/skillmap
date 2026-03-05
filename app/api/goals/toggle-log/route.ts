import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { getCurrentPeriodKey, isRecurrenceCategory } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    const {
      goalId,
      isCompleted,
      periodKey: overridePeriodKey,
    } = await req.json();

    if (!goalId || typeof isCompleted !== 'boolean') {
      return NextResponse.json(
        { error: 'goalId (string) and isCompleted (boolean) are required' },
        { status: 400 }
      );
    }

    // Fetch the goal + its section to determine recurrence type
    const goal = await db.goalItem.findFirst({
      where: {
        id: goalId,
        userId: session.userId,
        isRepetitive: true,
      },
      include: {
        section: { select: { category: true } },
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Repetitive goal not found' },
        { status: 404 }
      );
    }

    const recurrence = goal.section.category;
    if (!isRecurrenceCategory(recurrence)) {
      return NextResponse.json(
        { error: `Invalid recurrence category: ${recurrence}` },
        { status: 400 }
      );
    }
    const periodKey = overridePeriodKey ?? getCurrentPeriodKey(recurrence);
    if (!isCompleted) {
      await db.goalLog.deleteMany({
        where: { goalId, periodKey },
      });

      return NextResponse.json({
        goalId,
        periodKey,
        isCompleted: false,
        deleted: true,
      });
    }
    const log = await db.goalLog.upsert({
      where: {
        goalId_periodKey: { goalId, periodKey },
      },
      create: {
        goalId,
        userId: session.userId,
        periodKey,
        isCompleted: true,
      },
      update: {
        isCompleted: true,
      },
    });

    return NextResponse.json({
      id: log.id,
      goalId: log.goalId,
      periodKey: log.periodKey,
      isCompleted: log.isCompleted,
    });
  } catch (err) {
    console.error('POST /api/goals/toggle-log error', err);
    return NextResponse.json(
      { error: 'Failed to toggle goal log' },
      { status: 500 }
    );
  }
}
