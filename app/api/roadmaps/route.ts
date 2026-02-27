import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function GET() {
  try {
    const session = await verifySession();

    const roadmaps = await db.roadmap.findMany({
      where: { authorId: session.userId },
      include: {
        tasks: {
          include: {
            subTasks: {
              include: {
                progress: {
                  where: { userId: session.userId },
                },
              },
            },
          },
          orderBy: { taskNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute progress for each roadmap
    const roadmapsWithProgress = roadmaps.map((roadmap) => {
      const allSubtasks = roadmap.tasks.flatMap((t) => t.subTasks);
      const totalSubtasks = allSubtasks.length;
      const completedSubtasks = allSubtasks.filter(
        (s) => s.progress.length > 0
      ).length;
      const progress =
        totalSubtasks === 0
          ? 0
          : Math.round((completedSubtasks / totalSubtasks) * 100);

      return {
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        taskCount: roadmap.tasks.length,
        subtaskCount: totalSubtasks,
        completedSubtasks,
        progress,
        createdAt: roadmap.createdAt,
        updatedAt: roadmap.updatedAt,
      };
    });

    return NextResponse.json({ roadmaps: roadmapsWithProgress });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roadmaps.' },
      { status: 500 }
    );
  }
}
