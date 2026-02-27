import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_AI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    await verifySession();

    const {
      type,
      id,
      taskTitle,
      subtaskTitle,
      subtasks,
      followUpQuestion,
      chatHistory,
    } = await request.json();

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
    }

    // ── Follow-up question flow ──
    if (type === 'followup') {
      if (!followUpQuestion) {
        return NextResponse.json(
          { error: 'Missing follow-up question.' },
          { status: 400 }
        );
      }

      // Build messages array with chat history for context
      const messages: { role: string; content: string }[] = [
        {
          role: 'system',
          content: `You are an expert educational tutor helping a student learn about "${taskTitle}"${subtaskTitle ? ` (specifically: "${subtaskTitle}")` : ''}. Answer follow-up questions clearly and concisely in markdown format. Use the conversation history for context.`,
        },
      ];

      // Add chat history (last 10 messages)
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      }

      // Add the new follow-up question
      messages.push({ role: 'user', content: followUpQuestion });

      const aiResponse = await fetch(POLLINATIONS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          model: 'openai',
          seed: Math.floor(Math.random() * 10000),
        }),
      });

      if (!aiResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to generate AI response.' },
          { status: 502 }
        );
      }

      const responseJson = await aiResponse.json();
      const aiText = responseJson.choices?.[0]?.message?.content || '';

      if (!aiText) {
        return NextResponse.json(
          { error: 'AI returned an empty response.' },
          { status: 502 }
        );
      }

      // Follow-up responses only stored in localStorage on the client
      return NextResponse.json({ ainotes: aiText });
    }

    // ── Initial explanation flow (task / subtask) ──
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id for initial explanation.' },
        { status: 400 }
      );
    }

    let prompt: string;

    if (type === 'task') {
      const subtaskList =
        subtasks?.map((s: string) => `- ${s}`).join('\n') || '';
      prompt = `You are an expert tutor. Explain the following learning topic in detail.

      Topic: "${taskTitle}"

      ${subtaskList ? `This topic covers the following subtasks:\n${subtaskList}\n` : ''}

      Provide a comprehensive explanation that includes:
      1. An overview of what this topic covers and why it's important
      2. Key concepts and terminology
      3. How the subtasks relate to each other
      4. Practical tips for learning this topic effectively
      5. Common pitfalls to avoid

      Format your response in clear, readable markdown with headers and bullet points.`;
    } else if (type === 'subtask') {
      prompt = `You are an expert tutor. Explain the following learning subtask in detail.

      Main Topic: "${taskTitle}"
      Subtask: "${subtaskTitle}"

      Provide a focused explanation that includes:
      1. What this subtask involves
      2. Key concepts to understand
      3. Step-by-step approach to learning it
      4. Practical examples or exercises
      5. Resources or tips for deeper understanding

      Format your response in clear, readable markdown with headers and bullet points.`;
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "task", "subtask", or "followup".' },
        { status: 400 }
      );
    }

    const aiResponse = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educational tutor. Provide clear, detailed explanations in markdown format.',
          },
          { role: 'user', content: prompt },
        ],
        model: 'openai',
        seed: Math.floor(Math.random() * 10000),
      }),
    });

    if (!aiResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to generate AI explanation.' },
        { status: 502 }
      );
    }

    const responseJson = await aiResponse.json();
    const aiText = responseJson.choices?.[0]?.message?.content || '';

    if (!aiText) {
      return NextResponse.json(
        { error: 'AI returned an empty response.' },
        { status: 502 }
      );
    }

    // Save the AI notes to the database
    if (type === 'task') {
      await db.roadmapTask.update({
        where: { id },
        data: { ainotes: aiText.slice(0, 10000) },
      });
    } else {
      await db.roadmapSubTask.update({
        where: { id },
        data: { ainotes: aiText.slice(0, 5000) },
      });
    }

    return NextResponse.json({ ainotes: aiText });
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
