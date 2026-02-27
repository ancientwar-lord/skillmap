import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const { roadmapId } = await request.json();

    if (!roadmapId) {
      return NextResponse.json(
        { error: 'roadmapId is required.' },
        { status: 400 }
      );
    }

    // Verify ownership
    const roadmap = await db.roadmap.findFirst({
      where: { id: roadmapId, authorId: session.userId },
    });

    if (!roadmap) {
      return NextResponse.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }

    const updated = await db.roadmap.update({
      where: { id: roadmapId },
      data: { isPinned: !roadmap.isPinned },
    });

    return NextResponse.json({ isPinned: updated.isPinned });
  } catch (error) {
    console.error('Error toggling pin:', error);
    return NextResponse.json(
      { error: 'Failed to toggle pin.' },
      { status: 500 }
    );
  }
}
