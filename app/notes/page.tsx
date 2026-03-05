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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Notes</h1>
        <button
          onClick={startNewNote}
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <Plus size={16} /> New note
        </button>
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
          {/* personal notes section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Personal notes</h2>
            {notes.length === 0 && (
              <p className="text-slate-500">
                You haven&#39;t created any notes yet.
              </p>
            )}
            <ul className="space-y-4">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                  onClick={() => openNote(n.id)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-slate-800 line-clamp-1">
                      {n.title || '<untitled>'}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNote(n.id);
                      }}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Open
                    </button>
                  </div>
                  {n.content && (
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                      {n.content}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {activeEditor?.kind === 'newNote' && (
              <div className="mt-6">
                <NoteEditor
                  onSave={handleNoteSave}
                  onClose={() => setActiveEditor(null)}
                />
              </div>
            )}
          </section>

          {/* roadmap notes section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Roadmap notes</h2>
            {visibleRoadmaps.length === 0 && (
              <p className="text-slate-500">
                You don&#39;t have any notes on roadmaps yet.
              </p>
            )}
            <ul className="space-y-6">
              {visibleRoadmaps.map((rm) => (
                <li
                  key={rm.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                  onClick={() => openRoadmapNote(rm.id)}
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">
                      {rm.title}
                    </h2>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRoadmapNote(rm.id);
                      }}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Open
                    </button>
                  </div>
                  {rm.notes && (
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                      {rm.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
