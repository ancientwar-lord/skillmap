import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const { subtaskId, roadmapId } = await request.json();

    if (!subtaskId || !roadmapId) {
      return NextResponse.json(
        { error: 'subtaskId and roadmapId are required.' },
        { status: 400 }
      );
    }

    // Check if progress already exists
    const existing = await db.roadmapSubtaskProgress.findUnique({
      where: {
        userId_subtaskId: {
          userId: session.userId,
          subtaskId,
        },
      },
    });

    if (existing) {
      // Remove progress (uncomplete)
      await db.roadmapSubtaskProgress.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ completed: false });
    } else {
      // Add progress (complete)
      await db.roadmapSubtaskProgress.create({
        data: {
          userId: session.userId,
          roadmapId,
          subtaskId,
        },
      });
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    console.error('Error toggling progress:', error);
    return NextResponse.json(
      { error: 'Failed to toggle progress.' },
      { status: 500 }
    );
  }
}
