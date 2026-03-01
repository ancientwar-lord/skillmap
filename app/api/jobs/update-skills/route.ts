import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';
import { generateJobRecommendations } from '@/lib/recommendJobs';

async function getEmbedding(text: string) {
  console.log('Embedding input length:', text.length);

  const res = await fetch(
    'https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('HF Error Body:', errorBody);
    throw new Error(`HF request failed with status ${res.status}`);
  }

  const data = await res.json();

  // 1. Handle Case: Plain array of numbers [0.1, 0.2, ...]
  // This is what your logs show you are receiving.
  if (Array.isArray(data) && typeof data[0] === 'number') {
    return data;
  }

  // 2. Case: Nested array [[vector]]
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0];
  }

  // 3. Case: [{ embedding: [...] }]
  if (Array.isArray(data) && data[0]?.embedding) {
    return data[0].embedding;
  }

  // 4. Case: { embedding: [...] }
  if (data?.embedding) {
    return data.embedding;
  }

  // 5. Case: { data: [...] }
  if (data?.data) {
    return data.data;
  }

  console.log('Unknown HF format:', data);
  throw new Error('Invalid embedding format');
}

export async function POST() {
  try {
    console.log('===== UPDATE SKILLS START =====');

    const session = await verifySession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    console.log('UserId:', userId);

    /* --------------------------
       FETCH COMPLETED SUBTASKS
    ---------------------------*/

    const completed = await db.roadmapSubtaskProgress.findMany({
      where: { userId },
      include: { subtask: true },
    });

    console.log('Completed subtasks:', completed.length);

    if (!completed.length) {
      return NextResponse.json(
        { error: 'No completed skills found' },
        { status: 400 }
      );
    }

    /* --------------------------
       EXTRACT SKILLS
    ---------------------------*/

    const skills = completed.map((c) => c.subtask.subTaskTitle);

    console.log('Skills:', skills);

    const mergedText = skills.join(', ');

    console.log('Merged text length:', mergedText.length);

    /* --------------------------
       GENERATE EMBEDDING
    ---------------------------*/

    const embedding = await getEmbedding(mergedText);

    console.log('Embedding size:', embedding.length);

    /* --------------------------
       STORE EMBEDDING
    ---------------------------*/

    await db.user.update({
      where: { id: userId },
      data: {
        skillEmbedding: embedding,
      },
    });

    console.log('Embedding stored in DB');

    // after we persist the new vector, recompute recommendations
    try {
      const recs = await generateJobRecommendations(userId);
      console.log('Generated', recs.length, 'job recommendations');
    } catch (e) {
      console.error('Failed to generate job recommendations', e);
    }

    console.log('===== UPDATE SKILLS END =====');

    return NextResponse.json({
      success: true,
      totalSkills: skills.length,
      embeddingSize: embedding.length,
    });
  } catch (error) {
    console.error('ERROR updating skills embedding:', error);

    return NextResponse.json(
      { error: 'Failed to update skills embedding' },
      { status: 500 }
    );
  }
}
