import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface UpdatePayload {
  text?: string;
  completed?: boolean;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await verifySession();
    const { id } = await params;
    const data = await req.json();

    const updateData: UpdatePayload = {};
    if (typeof data.text === 'string') updateData.text = data.text;
    if (typeof data.completed === 'boolean')
      updateData.completed = data.completed;
    const existingTodo = await db.routineTodo.findUnique({
      where: { id },
    });

    if (!existingTodo || existingTodo.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized or Todo not found' },
        { status: 403 }
      );
    }

    const todo = await db.routineTodo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const session = await verifySession();
    const { id } = await params;
    const existingTodo = await db.routineTodo.findUnique({
      where: { id },
    });

    if (!existingTodo || existingTodo.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized or Todo not found' },
        { status: 403 }
      );
    }

    await db.routineTodo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo.' },
      { status: 500 }
    );
  }
}
