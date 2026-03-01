import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function GET(req: Request) {
  try {
    const session = await verifySession();

    const url = new URL(req.url);
    const all = url.searchParams.get('all') === 'true';
    const todos = await db.routineTodo.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(todos, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text' },
        { status: 400 }
      );
    }

    const todo = await db.routineTodo.create({
      data: {
        userId: session.userId,
        text: text.trim(),
      },
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo.' },
      { status: 500 }
    );
  }
}
