import { db } from '@/lib/db';

async function getEmbedding(text: string): Promise<number[]> {
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
    throw new Error(`HF request failed ${res.status}`);
  }

  const data = await res.json();

  if (Array.isArray(data) && typeof data[0] === 'number') {
    return data;
  }
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0];
  }
  if (Array.isArray(data) && data[0]?.embedding) {
    return data[0].embedding;
  }
  if (data?.embedding) {
    return data.embedding;
  }
  if (data?.data) {
    return data.data;
  }

  console.log('Unknown HF format:', data);
  throw new Error('Invalid embedding format');
}


async function fetchJobs(page: number) {
  const url = `https://api.joinrise.io/api/v1/jobs/public?page=${page}&limit=20&sort=asc&sortedBy=createdAt&includeDescription=true&isTrending=true`;

  const res = await fetch(url);
  const json = await res.json();
  return json?.result?.jobs || [];
}

async function main() {
  console.log('===== JOB EMBEDDING START =====');

  let storedCount = 0;

  for (let page = 1; page <= 5; page++) {
    console.log('Fetching page:', page);

    const jobs = await fetchJobs(page);
    console.log('Jobs fetched:', jobs.length);

    for (const job of jobs) {
      try {
        const title = job.title ?? '';
        const link = job.url ?? '';
        const company = job.owner?.companyName ?? 'Unknown Company';
        const summary = job.descriptionBreakdown?.oneSentenceJobSummary ?? '';
        const keywords = job.descriptionBreakdown?.keywords?.join(', ') ?? '';
        const skills = job.skills_suggest?.join('. ') ?? '';
        const description = `${summary} Required skills: ${skills}. Keywords: ${keywords}.`;
        if (!title || !description.trim()) {
          console.log('Skipping empty job');
          continue;
        }
        const textToEmbed = `${title} at ${company}. ${description}`;
        console.log('Processing:', title);
        const existing = await db.job.findFirst({
          where: { link },
        });

        if (existing) {
          console.log('Already exists:', title);
          continue;
        }
        const embedding = await getEmbedding(textToEmbed);
        console.log('Embedding size:', embedding.length);
        await db.job.create({
          data: {
            title,
            description,
            link,
            embedding,
          },
        });

        storedCount++;
        console.log('Stored:', title);
      } catch (err) {
        console.log('Error processing job:', job?.title, err);
      }
    }
  }

  console.log('===== JOB EMBEDDING DONE =====');
  console.log('Total stored:', storedCount);
}

main().catch(console.error);