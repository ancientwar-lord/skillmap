import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';

  try {
    const res = await fetch(
      'https://api.joinrise.io/api/v1/jobs/public?page=1&limit=20&sort=asc&sortedBy=createdAt&includeDescription=true&isTrending=true',
      { next: { revalidate: 60 } }
    );

    if (!res.ok) throw new Error('Failed to fetch from Rise API');

    const data = await res.json();
    interface RiseJob {
      title?: string;
      owner?: {
        companyName?: string;
      };
    }

    let jobs: RiseJob[] = data.result?.jobs || [];
    if (search) {
      jobs = jobs.filter((job) => {
        const titleMatch = job.title?.toLowerCase().includes(search);
        const companyMatch = job.owner?.companyName
          ?.toLowerCase()
          .includes(search);
        return titleMatch || companyMatch;
      });
    }

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
