import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    const { id } = await params;
    let note = await db.note.findUnique({ where: { id } });
    if (!note || note.userId !== session.userId) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Update lastSeenAt
    note = await db.note.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error fetching note', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}
