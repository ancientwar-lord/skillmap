import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    const { id } = await params;

    const result = await db.testResult.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Test result not found.' },
        { status: 404 }
      );
    }

    // Parse stored JSON fields
    let questions = [];
    let userAnswers: Record<string, string> = {};
    let questionAnalysis: {
      questionId: string;
      isCorrect: boolean;
      explanation: string;
    }[] = [];

    try {
      questions = JSON.parse(result.questionsJson);
    } catch {
      questions = [];
    }

    try {
      userAnswers = JSON.parse(result.userAnswersJson);
    } catch {
      userAnswers = {};
    }

    try {
      questionAnalysis = JSON.parse(result.analysisJson);
    } catch {
      questionAnalysis = [];
    }

    return NextResponse.json(
      {
        result: {
          id: result.id,
          topic: result.topic,
          title: result.title,
          difficulty: result.difficulty,
          totalQuestions: result.totalQuestions,
          correctCount: result.correctCount,
          incorrectCount: result.incorrectCount,
          unattemptedCount: result.unattemptedCount,
          scorePercentage: result.scorePercentage,
          totalTimeTaken: result.totalTimeTaken,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          recommendations: result.recommendations,
          questions,
          userAnswers,
          questionAnalysis,
          createdAt: result.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching test result detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test result.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    const { id } = await params;

    const deleted = await db.testResult.deleteMany({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Test result not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting test result:', error);
    return NextResponse.json(
      { error: 'Failed to delete test result.' },
      { status: 500 }
    );
  }
}
