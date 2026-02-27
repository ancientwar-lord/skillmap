import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { db } from '@/lib/db';
import type { TestQuestion, AIEvaluation } from '@/lib/types';

const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_AI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();

    const {
      questions,
      userAnswers,
      questionTimes,
      totalTimeTaken,
      topic,
      title,
      difficulty,
    } = (await request.json()) as {
      questions: TestQuestion[];
      userAnswers: Record<string, string>;
      questionTimes: Record<string, number>;
      totalTimeTaken: number;
      topic?: string;
      title?: string;
      difficulty?: string;
    };

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid test data provided.' },
        { status: 400 }
      );
    }

    // Build a summary of the test for AI analysis
    const questionSummaries = questions.map((q) => {
      const userAns = userAnswers[q.id] || 'Not Attempted';
      const isCorrect = userAns === q.correct_answer;
      const timeSpent = questionTimes[q.id] || 0;

      return {
        question_no: q.question_no,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        user_answer: userAns,
        is_correct: userAns !== 'Not Attempted' ? isCorrect : null,
        time_spent_seconds: Math.round(timeSpent),
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'medium',
      };
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
    }

    const aiPrompt = `You are an expert test evaluator and educational analyst. Analyze the following test results and provide a detailed evaluation.

Test Data:
${JSON.stringify(questionSummaries, null, 2)}

Total Time Taken: ${Math.round(totalTimeTaken)} seconds

You MUST respond with ONLY valid JSON (no markdown, no code fences). Use this exact structure:
{
  "questionAnalysis": [
    {
      "questionId": "q1",
      "isCorrect": true,
      "explanation": "Detailed explanation of why the correct answer is correct and why the user's answer was right/wrong. Include the concept being tested."
    }
  ],
  "strengths": ["List of topics or areas where the student performed well"],
  "weaknesses": ["List of topics or areas where the student needs improvement"],
  "recommendations": ["Specific actionable recommendations for improvement"]
}

Requirements:
- Provide an explanation for EVERY question, whether correct, incorrect, or unattempted.
- For incorrect answers, explain why the chosen answer is wrong and why the correct answer is right.
- For unattempted questions, explain the correct answer and encourage attempting next time.
- Identify 2-4 strengths based on correct answers and speed.
- Identify 2-4 weaknesses based on incorrect/unattempted answers.
- Provide 3-5 actionable, specific recommendations for improvement.
- Be encouraging but honest in your analysis.

Return ONLY valid JSON.`;

    const pollinationsResponse = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON-only test evaluator. Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text.',
          },
          { role: 'user', content: aiPrompt },
        ],
        model: 'openai',
        response_format: { type: 'json_object' },
        seed: Math.floor(Math.random() * 10000),
      }),
    });

    if (!pollinationsResponse.ok) {
      const errBody = await pollinationsResponse.text().catch(() => '');
      console.error(
        'Pollinations API error:',
        pollinationsResponse.status,
        errBody
      );
      return NextResponse.json(
        { error: 'Failed to evaluate test. Please try again.' },
        { status: 502 }
      );
    }

    const responseJson = await pollinationsResponse.json();
    const aiText = responseJson.choices?.[0]?.message?.content || '';

    if (!aiText) {
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    let rawData: Partial<AIEvaluation>;
    try {
      rawData = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        rawData = JSON.parse(jsonMatch[1].trim());
      } else {
        const objectMatch = aiText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          rawData = JSON.parse(objectMatch[0]);
        } else {
          return NextResponse.json(
            { error: 'Failed to parse AI evaluation. Please try again.' },
            { status: 500 }
          );
        }
      }
    }

    // Calculate scores locally for accuracy
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q) => {
      const userAns = userAnswers[q.id];
      if (!userAns) {
        unattemptedCount++;
      } else if (userAns === q.correct_answer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const evaluation: AIEvaluation = {
      overallScore: correctCount,
      totalQuestions: questions.length,
      correctCount,
      incorrectCount,
      unattemptedCount,
      strengths: rawData.strengths || ['Completed the test'],
      weaknesses: rawData.weaknesses || ['Review all topics'],
      recommendations: rawData.recommendations || ['Practice more questions'],
      questionAnalysis:
        rawData.questionAnalysis ||
        questions.map((q) => ({
          questionId: q.id,
          isCorrect: userAnswers[q.id] === q.correct_answer,
          explanation: 'Explanation not available.',
        })),
    };

    // Save test result to database
    try {
      await db.testResult.create({
        data: {
          topic: topic || 'Unknown',
          title: title || 'Untitled Test',
          difficulty: difficulty || 'medium',
          totalQuestions: questions.length,
          correctCount,
          incorrectCount,
          unattemptedCount,
          scorePercentage:
            questions.length > 0
              ? Math.round((correctCount / questions.length) * 100)
              : 0,
          totalTimeTaken,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          recommendations: evaluation.recommendations,
          questionsJson: JSON.stringify(questions),
          userAnswersJson: JSON.stringify(userAnswers),
          analysisJson: JSON.stringify(evaluation.questionAnalysis),
          userId: session.userId,
        },
      });
    } catch (dbErr) {
      console.error('Failed to save test result to DB:', dbErr);
      // Don't fail the request — still return the evaluation
    }

    return NextResponse.json({ evaluation }, { status: 200 });
  } catch (error) {
    console.error('Error evaluating test:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
