import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

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
