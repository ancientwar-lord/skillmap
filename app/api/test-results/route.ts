import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await verifySession();

    const results = await db.testResult.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        topic: true,
        title: true,
        difficulty: true,
        totalQuestions: true,
        correctCount: true,
        incorrectCount: true,
        unattemptedCount: true,
        scorePercentage: true,
        totalTimeTaken: true,
        strengths: true,
        weaknesses: true,
        createdAt: true,
      },
      take: 50,
    });

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results.' },
      { status: 500 }
    );
  }
}
