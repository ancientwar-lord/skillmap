import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const roadmap = await db.roadmap.findFirst({
      where: { id, authorId: session.userId },
      select: { id: true, title: true, notes: true },
    });
    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }
    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error('Error fetching roadmap notes', error);
    return NextResponse.json(
      { error: 'Failed to fetch roadmap notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const { roadmapId, notes } = await request.json();

    if (!roadmapId || typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'roadmapId and notes are required.' },
        { status: 400 }
      );
    }

    const roadmap = await db.roadmap.findFirst({
      where: { id: roadmapId, authorId: session.userId },
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }

    await db.roadmap.update({
      where: { id: roadmapId },
      data: { notes },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving notes:', error);
    return NextResponse.json(
      { error: 'Failed to save notes.' },
      { status: 500 }
    );
  }
}
