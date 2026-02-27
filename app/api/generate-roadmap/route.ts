import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';
import type { RoadmapSubTask, RoadmapTask } from '@/lib/types';
import {
  roadmapResponseSchema,
  createRoadmapPromptSchema,
  getZodErrorMessage,
} from '@/lib/zod/schema';

const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_AI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    const { prompt: rawPrompt } = await request.json();

    // Validate prompt with Zod
    const promptResult = createRoadmapPromptSchema.safeParse(rawPrompt);
    if (!promptResult.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(promptResult.error) },
        { status: 400 }
      );
    }
    const prompt = promptResult.data;

    // Generate roadmap using Pollinations AI
    const aiPrompt = `You are a learning roadmap generator. Create a detailed, structured learning roadmap based on the user's request.

    User request: "${prompt}"

    You MUST respond with ONLY valid JSON (no markdown, no explanation, no code fences). Use this exact structure:
    {
      "title": "Roadmap title (max 200 chars)",
      "description": "A comprehensive description of the roadmap goals and what the learner will achieve (max 500 chars)",
      "tasks": [
        {
          "taskTitle": "Task title",
          "taskNumber": 1,
          "tag": "Category tag like Fundamentals, Intermediate, Advanced, etc.",
          "subTasks": [
            {
              "subTaskTitle": "Specific subtask to complete"
            }
          ],
          "resources": {
            "youtubeLinks": ["https://youtube.com/watch?v=example"],
            "articles": ["https://example.com/article"],
            "selfstudyReferences": ["https://example.com/reference"],
            "practiceLinks": ["https://example.com/practice"]
          }
        }
      ]
    }

    Requirements:
    - Create 5-10 tasks ordered logically from beginner to advanced.
    - Each task must have 3-6 subtasks.
    - Task numbers must be sequential starting from 1.
    - Provide REAL, working URLs only (no placeholder domains like example.com).
    - Do NOT repeat the same resource across tasks.
    - Tags should categorize the difficulty or topic area.

    YouTube Resource Rules (IMPORTANT):
    - Provide 1-3 YouTube links for EACH task.
    - Each YouTube video MUST be directly related to that specific task topic (not general or unrelated videos).
    - Prefer high-quality educational channels (official docs channels, well-known educators, or long-form tutorials).
    - Prefer videos that clearly teach the exact subskills listed in the subtasks.
    - Avoid unrelated compilations or motivational videos.
    - Use full YouTube watch URLs only (https://www.youtube.com/watch?v=...).

    Return ONLY valid JSON.
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
    }

    const pollinationsResponse = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON-only learning roadmap generator. Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text.',
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
        { error: 'Failed to generate roadmap from AI. Please try again.' },
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

    // Parse AI response - try to extract JSON
    let rawData: unknown;
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

    // Validate with Zod
    const parseResult = roadmapResponseSchema.safeParse(rawData);
    if (!parseResult.success) {
      console.error('Zod validation failed:', parseResult.error.issues);
      return NextResponse.json(
        {
          error: 'AI generated an invalid roadmap structure. Please try again.',
        },
        { status: 500 }
      );
    }
    const roadmapData = parseResult.data;

    // Save to database
    const roadmap = await db.roadmap.create({
      data: {
        title: roadmapData.title.slice(0, 255),
        description: (roadmapData.description || '').slice(0, 10000),
        authorId: session.userId,
        tasks: {
          create: roadmapData.tasks.map((task: RoadmapTask) => ({
            taskTitle: task.taskTitle.slice(0, 255),
            taskNumber: task.taskNumber,
            tag: task.tag?.slice(0, 255) || null,
            ainotes: null,
            subTasks: {
              create: (task.subTasks || []).map((sub: RoadmapSubTask) => ({
                subTaskTitle: sub.subTaskTitle.slice(0, 500),
                ainotes: null,
              })),
            },
            resources: task.resources
              ? {
                  create: {
                    youtubeLinks: task.resources.youtubeLinks || [],
                    articles: task.resources.articles || [],
                    selfstudyReferences:
                      task.resources.selfstudyReferences || [],
                    practiceLinks: task.resources.practiceLinks || [],
                  },
                }
              : undefined,
          })),
        },
      },
      include: {
        tasks: {
          include: {
            subTasks: true,
            resources: true,
          },
          orderBy: { taskNumber: 'asc' },
        },
      },
    });

    return NextResponse.json({ roadmap }, { status: 201 });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
