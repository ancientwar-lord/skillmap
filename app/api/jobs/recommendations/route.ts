import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import {
  generateJobRecommendations,
  getRecommendedJobs,
} from '@/lib/recommendJobs';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const recs = await getRecommendedJobs(session.userId);
    return NextResponse.json({ recommendations: recs });
  } catch (err) {
    console.error('GET /api/jobs/recommendations error', err);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await generateJobRecommendations(session.userId);
    const recs = await getRecommendedJobs(session.userId);
    return NextResponse.json({ success: true, recommendations: recs });
  } catch (err) {
    console.error('POST /api/jobs/recommendations error', err);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
