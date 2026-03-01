'use client';

import { useState, useEffect } from 'react';

interface RecommendedJob {
  id: string;
  score: number;
  job: {
    id: string;
    title: string;
    link: string;
    description: string;
  };
}

export default function ApplyPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [recs, setRecs] = useState<RecommendedJob[]>([]);

  const updateSkills = async () => {
    setLoading(true);
    setMsg('');

    const res = await fetch('/api/jobs/update-skills', {
      method: 'POST',
    });

    if (res.ok) {
      setMsg('Skills updated successfully');
    } else {
      setMsg('Something went wrong');
    }

    setLoading(false);
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setMsg('');
    setRecs([]);

    const res = await fetch('/api/jobs/recommendations', {
      method: 'POST',
    });

    if (res.ok) {
      const data = await res.json();
      setRecs(data.recommendations || []);
      setMsg('Recommendations updated');
    } else {
      setMsg('Failed to generate recommendations');
    }

    setLoading(false);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/jobs/recommendations');
      if (res.ok) {
        const data = await res.json();
        setRecs(data.recommendations || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Current Openings</h1>

        <p className="text-slate-600 mt-2">Find your next opportunity below.</p>

        <div className="mt-6 bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row sm:justify-center sm:gap-6 gap-4">
            <button
              onClick={updateSkills}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? 'Updating skills...' : 'Update Skills'}
            </button>
            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Calculating...' : 'Get Recommendations'}
            </button>
          </div>
          {msg && (
            <p className="mt-4 text-center text-sm text-slate-700 font-medium">
              {msg}
            </p>
          )}
        </div>
      </div>

      {recs.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Recommended Jobs
          </h2>
          <ul className="space-y-4">
            {recs.map((r) => (
              <li
                key={r.job.id}
                className="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition"
              >
                <a
                  href={r.job.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg font-semibold text-indigo-600 hover:underline"
                >
                  {r.job.title}
                </a>
                <div className="mt-1 text-sm text-slate-500">
                  cosine similarity:{' '}
                  <span className="font-medium">
                    {(r.score * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="mt-2 text-slate-700 line-clamp-3">
                  {r.job.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
