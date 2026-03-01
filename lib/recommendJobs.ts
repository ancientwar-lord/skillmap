import { db } from '@/lib/db';
import { cosineSimilarity } from '@/lib/cosine';

export interface RecommendationResult {
  job: {
    id: string;
    title: string;
    link: string;
    description: string;
  };
  score: number;
}
export async function generateJobRecommendations(
  userId: string,
  limit: number = 20
): Promise<RecommendationResult[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { skillEmbedding: true },
  });

  if (!user || !user.skillEmbedding || user.skillEmbedding.length === 0) {
    await db.recommendedJob.deleteMany({ where: { userId } });
    return [];
  }

  const userEmbedding = user.skillEmbedding as number[];
  const jobs = await db.job.findMany({
    select: {
      id: true,
      title: true,
      link: true,
      description: true,
      embedding: true,
    },
  });

  const scored = jobs
    .map((job) => {
      const jobEmb = job.embedding as number[];
      let score = 0;
      try {
        score = cosineSimilarity(userEmbedding, jobEmb);
      } catch (e) {
        console.warn('Skipping job with invalid embedding', job.id, e);
        score = 0;
      }
      return { job, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit);
  await db.recommendedJob.deleteMany({ where: { userId } });

  if (top.length > 0) {
    await db.recommendedJob.createMany({
      data: top.map((r) => ({
        userId,
        jobId: r.job.id,
        score: r.score,
      })),
      skipDuplicates: true,
    });
  }

  return top.map((r) => ({ job: r.job, score: r.score }));
}

export async function getRecommendedJobs(userId: string): Promise<
  {
    id: string;
    score: number;
    job: {
      id: string;
      title: string;
      link: string;
      description: string;
    };
  }[]
> {
  return db.recommendedJob.findMany({
    where: { userId },
    orderBy: { score: 'desc' },
    include: {
      job: {
        select: { id: true, title: true, link: true, description: true },
      },
    },
  });
}
