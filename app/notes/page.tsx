'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import NoteEditor from '@/components/NoteEditor';

interface RoadmapSummary {
  id: string;
  title: string;
  notes?: string | null;
}

interface NoteSummary {
  id: string;
  title: string;
  content: string;
}

type ActiveEditor = { kind: 'newNote' } | null;

export default function NotesPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [rmRes, notesRes] = await Promise.all([
          fetch('/api/roadmaps'),
          fetch('/api/notes'),
        ]);
        const rmData = await rmRes.json();
        const notesData = await notesRes.json();
        if (rmRes.ok && Array.isArray(rmData.roadmaps)) {
          setRoadmaps(rmData.roadmaps);
        } else {
          console.error('roadmaps fetch failed', rmData);
          setError('Unable to load roadmaps');
        }
        if (notesRes.ok && Array.isArray(notesData.notes)) {
          setNotes(notesData.notes);
        } else {
          console.error('notes fetch failed', notesData);
          setError((prev) =>
            prev ? prev + '; notes error' : 'Unable to load notes'
          );
        }
      } catch (err) {
        console.error('fetchData error', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const startNewNote = () => setActiveEditor({ kind: 'newNote' });

  const openNote = (id: string) => router.push(`/notes/${id}?type=note`);
  const openRoadmapNote = (id: string) =>
    router.push(`/notes/${id}?type=roadmap`);

  const handleNoteSave = (note: NoteSummary) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = note;
        return next;
      }
      return [note, ...prev];
    });
  };

  const visibleRoadmaps = roadmaps.filter(
    (r) => r.notes && r.notes.trim().length > 0
  );

  type CombinedNote = {
    id: string;
    title: string;
    content?: string | null;
    tag: 'Personal' | 'Roadmap';
    isRoadmap?: boolean;
  };

  const combinedNotes: CombinedNote[] = [
    ...notes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      tag: 'Personal' as const,
      isRoadmap: false,
    })),
    ...visibleRoadmaps.map((rm) => ({
      id: rm.id,
      title: rm.title,
      content: rm.notes,
      tag: 'Roadmap' as const,
      isRoadmap: true,
    })),
  ];

  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Notes</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all of your personal &amp; roadmap notes in one
              place.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search notes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={startNewNote}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700 hover:shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus size={16} /> New note
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-purple-500" size={32} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-600 font-medium mb-4">{error}</p>
          </div>
        ) : (
          <>
            {activeEditor?.kind === 'newNote' && (
              <div className="mt-6">
                <NoteEditor
                  onSave={handleNoteSave}
                  onClose={() => setActiveEditor(null)}
                />
              </div>
            )}
            {/* combined notes section */}
            <section className="mb-12">
              {combinedNotes.length === 0 && (
                <p className="text-slate-500">
                  You haven&#39;t created any notes yet.
                </p>
              )}
              {combinedNotes.length > 0 &&
                combinedNotes.filter(
                  (item) =>
                    item.title.toLowerCase().includes(query.toLowerCase()) ||
                    (item.content || '')
                      .toLowerCase()
                      .includes(query.toLowerCase())
                ).length === 0 && (
                  <p className="text-slate-500">No notes match your search.</p>
                )}
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {combinedNotes
                  .filter(
                    (item) =>
                      item.title.toLowerCase().includes(query.toLowerCase()) ||
                      (item.content || '')
                        .toLowerCase()
                        .includes(query.toLowerCase())
                  )
                  .map((item) => (
                    <li
                      key={item.id + item.tag}
                      className="relative bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-transform transition-shadow min-h-[120px]"
                      onClick={() =>
                        item.isRoadmap
                          ? openRoadmapNote(item.id)
                          : openNote(item.id)
                      }
                    >
                      <span
                        className={
                          'absolute top-2 right-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ' +
                          (item.tag === 'Personal'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-green-50 text-green-600')
                        }
                      >
                        {item.tag}
                      </span>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-slate-800 line-clamp-1">
                          {item.title || '<untitled>'}
                        </h3>
                      </div>
                      {item.content && (
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                          {item.content}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
