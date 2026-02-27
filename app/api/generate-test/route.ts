import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import type { TestQuestion } from '@/lib/types';

const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_AI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    await verifySession();

    const {
      topic,
      numberOfQuestions = 10,
      difficulty = 'medium',
    } = await request.json();

    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide a valid topic for the test.' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
    }

    const aiPrompt = `You are a professional test question generator. Create a multiple-choice test based on the given topic.

Topic: "${topic.trim()}"
Number of Questions: ${Math.min(Math.max(numberOfQuestions, 5), 30)}
Difficulty: ${difficulty}

You MUST respond with ONLY valid JSON (no markdown, no explanation, no code fences). Use this exact structure:
{
  "title": "Test title based on the topic",
  "questions": [
    {
      "id": "q1",
      "question_no": 1,
      "question_text": "The full question text",
      "options": [
        { "key": "A", "text": "First option" },
        { "key": "B", "text": "Second option" },
        { "key": "C", "text": "Third option" },
        { "key": "D", "text": "Fourth option" }
      ],
      "correct_answer": "A",
      "difficulty": "medium",
      "topic": "Sub-topic or category"
    }
  ]
}

Requirements:
- Generate exactly ${Math.min(Math.max(numberOfQuestions, 5), 30)} questions.
- Each question must have exactly 4 options (A, B, C, D).
- correct_answer must be one of "A", "B", "C", or "D".
- Questions should cover different aspects of the topic.
- Questions should be clear, unambiguous, and educational.
- Mix difficulty levels around the specified difficulty.
- Question IDs must be sequential: "q1", "q2", "q3", etc.
- question_no must be sequential starting from 1.
- Include a relevant sub-topic for each question.
- Make distractors (wrong options) plausible but clearly incorrect.

Return ONLY valid JSON.`;

    const pollinationsResponse = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON-only test question generator. Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text.',
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
        { error: 'Failed to generate test questions. Please try again.' },
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

    let rawData: { title?: string; questions?: TestQuestion[] };
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
            { error: 'Failed to parse AI response. Please try again.' },
            { status: 500 }
          );
        }
      }
    }

    if (
      !rawData.questions ||
      !Array.isArray(rawData.questions) ||
      rawData.questions.length === 0
    ) {
      return NextResponse.json(
        { error: 'AI generated an invalid test structure. Please try again.' },
        { status: 500 }
      );
    }

    // Validate and sanitize questions
    const validQuestions: TestQuestion[] = rawData.questions
      .filter(
        (q) =>
          q.question_text &&
          q.options &&
          q.options.length === 4 &&
          ['A', 'B', 'C', 'D'].includes(q.correct_answer)
      )
      .map((q, idx) => ({
        id: `q${idx + 1}`,
        question_no: idx + 1,
        question_text: q.question_text,
        options: q.options.map((opt) => ({
          key: opt.key,
          text: opt.text,
        })),
        correct_answer: q.correct_answer,
        difficulty: q.difficulty || difficulty,
        topic: q.topic || topic,
      }));

    if (validQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions were generated. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        title: rawData.title || `${topic} Test`,
        questions: validQuestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating test:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
