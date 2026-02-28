import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function GET() {
  try {
    const session = await verifySession();

    const items = await db.goalItem.findMany({
      where: { userId: session.userId },
      include: { section: true },
      orderBy: { createdAt: 'desc' },
    });

    const payload = items.map((i) => ({
      id: i.id,
      text: i.text,
      completed: i.completed,
      targetDate: i.targetDate ? i.targetDate.toISOString() : null,
      isPinned: i.isPinned,
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
