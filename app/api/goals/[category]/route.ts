import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

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
  targetDate?: string | null;
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

    const items = (section?.items || []).map(
      (i: {
        id: string;
        text: string;
        targetDate: Date | null;
        completed: boolean;
      }) => ({
        id: i.id,
        text: i.text,
        targetDate: i.targetDate ? i.targetDate.toISOString() : null,
        completed: !!i.completed,
      })
    );

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
        await db.goalItem.create({
          data: {
            userId: session.userId,
            sectionId: section.id,
            text: item.text.trim(),
            targetDate: item.targetDate ? new Date(item.targetDate) : null,
            completed: item.completed ? true : false,
          },
        });
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
