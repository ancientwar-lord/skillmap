import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    const { goalId } = await req.json();

    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid goalId' },
        { status: 400 }
      );
    }

    const item = await db.goalItem.findUnique({
      where: { id: goalId },
    });
    if (!item || item.userId !== session.userId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updated = await db.goalItem.update({
      where: { id: goalId },
      data: { isPinned: !item.isPinned },
    });

    return NextResponse.json({ isPinned: updated.isPinned });
  } catch (err) {
    console.error('POST /api/goals/toggle-pin error', err);
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    );
  }
}
