'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import RoadmapNotes from '@/components/RoadmapNotes';

interface NoteData {
  id: string;
  title: string;
  content: string;
  requiresRevision?: boolean;
}

interface RoadmapData {
  id: string;
  title: string;
  notes: string | null;
}

function NoteContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id as string;
  const type = searchParams.get('type'); // 'note' | 'roadmap-notes'

  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !type) {
      setError('Invalid URL');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        if (type === 'note') {
          const res = await fetch(`/api/notes/${id}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Note not found');
          setNoteData(data.note);
        } else if (type === 'roadmap') {
          const res = await fetch(`/api/roadmaps/notes?id=${id}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Roadmap not found');
          setRoadmapData(data.roadmap);
        } else {
          throw new Error('Unknown note type');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, type]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 size={36} className="animate-spin text-purple-500 mb-3" />
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          onClick={() => router.push('/notes')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft size={15} /> Back to notes
        </button>
      </div>
    );
  }

  if (type === 'note' && noteData) {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {noteData.title || '<untitled>'}
          </h2>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              checked={noteData.requiresRevision || false}
              onChange={async (e) => {
                const isChecked = e.target.checked;
                setNoteData((prev) =>
                  prev ? { ...prev, requiresRevision: isChecked } : prev
                );
                try {
                  const res = await fetch('/api/notes', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: noteData.id,
                      title: noteData.title,
                      content: noteData.content,
                      requiresRevision: isChecked,
                    }),
                  });
                  if (!res.ok)
                    throw new Error('Failed to save revision status');
                  const data = await res.json();
                  setNoteData(data.note);
                } catch (err) {
                  console.error(err);
                  setNoteData((prev) =>
                    prev ? { ...prev, requiresRevision: !isChecked } : prev
                  );
                }
              }}
            />
            <span className="font-medium">Requires Revision</span>
          </label>
        </div>
        <RoadmapNotes
          initialNotes={noteData.content}
          saveFn={async (text) => {
            const res = await fetch('/api/notes', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: noteData.id,
                title: noteData.title,
                content: text,
                requiresRevision: noteData.requiresRevision,
              }),
            });
            if (!res.ok) throw new Error('Failed to save');
            const data = await res.json();
            setNoteData(data.note);
          }}
        />
      </>
    );
  }

  if (type === 'roadmap' && roadmapData) {
    return (
      <>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {roadmapData.title}
        </h2>
        <RoadmapNotes
          roadmapId={roadmapData.id}
          initialNotes={roadmapData.notes}
          onSave={(notes) =>
            setRoadmapData((prev) => (prev ? { ...prev, notes } : prev))
          }
        />
      </>
    );
  }

  return null;
}

export default function NoteDetailPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button
        onClick={() => router.push('/notes')}
        className="inline-flex items-center gap-2 mb-6 text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeft size={15} /> Back to all notes
      </button>
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-purple-500" size={32} />
          </div>
        }
      >
        <NoteContent />
      </Suspense>
    </div>
  );
}
