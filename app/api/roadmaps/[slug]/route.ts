import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await verifySession();
    const { slug } = await params;

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
            resources: true,
          },
          orderBy: { taskNumber: 'asc' },
        },
      },
    });
    const roadmap = roadmaps.find((r) => slugify(r.title) === slug);

    if (!roadmap) {
      return NextResponse.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }
    const roadmapData = roadmap.tasks.map((task) => ({
      taskId: task.id,
      title: task.taskTitle,
      tag: task.tag,
      ainotes: task.ainotes,
      resources: task.resources,
      subtasks: task.subTasks.map((sub) => ({
        $id: sub.id,
        title: sub.subTaskTitle,
        completed: sub.progress.length > 0,
        ainotes: sub.ainotes,
      })),
    }));

    return NextResponse.json({
      roadmap: {
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        createdAt: roadmap.createdAt,
      },
      roadmapData,
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roadmap.' },
      { status: 500 }
    );
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await verifySession();
    const { slug } = await params;

    const roadmaps = await db.roadmap.findMany({
      where: { authorId: session.userId },
    });

    const roadmap = roadmaps.find((r) => slugify(r.title) === slug);

    if (!roadmap) {
      return NextResponse.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }

    await db.roadmap.delete({
      where: { id: roadmap.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to delete roadmap.' },
      { status: 500 }
    );
  }
}
