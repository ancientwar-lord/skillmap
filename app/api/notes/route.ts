import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function GET() {
  try {
    const session = await verifySession();
    const notes = await db.note.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const { title, content } = await request.json();
    if (typeof title !== 'string' || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }
    const note = await db.note.create({
      data: {
        userId: session.userId,
        title,
        content,
      },
    });
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error creating note', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession();
    const { id, title, content, requiresRevision, lastSeenAt } = await request.json();
    if (!id || typeof title !== 'string' || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'id/title/content required' },
        { status: 400 }
      );
    }
    const existing = await db.note.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    const updateData: {
      title: string;
      content: string;
      requiresRevision?: boolean;
      lastSeenAt?: Date | null;
    } = { title, content };
    if (requiresRevision !== undefined) {
      updateData.requiresRevision = requiresRevision;
    }
    if (lastSeenAt !== undefined) {
      updateData.lastSeenAt = lastSeenAt ? new Date(lastSeenAt) : null;
    }

    const note = await db.note.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error updating note', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession();
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    const existing = await db.note.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    await db.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
