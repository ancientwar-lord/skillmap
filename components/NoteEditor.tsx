'use client';

import { useState, useCallback, useEffect } from 'react';
import { Save, Loader2, Check, AlertCircle } from 'lucide-react';

type SaveStatus = 'idle' | 'edited' | 'saving' | 'saved' | 'error';

interface NoteData {
  id?: string;
  title: string;
  content: string;
  requiresRevision?: boolean;
}

interface NoteEditorProps {
  note?: NoteData;
  onSave: (note: NoteData & { id: string }) => void;
  onClose?: () => void;
}

export default function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [requiresRevision, setRequiresRevision] = useState(
    note?.requiresRevision || false
  );
  const [status, setStatus] = useState<SaveStatus>('saved');

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setRequiresRevision(note?.requiresRevision || false);
    setStatus('saved');
  }, [note]);

  const handleSave = useCallback(async () => {
    if (status === 'saving') return;
    if (title.trim() === '' && content.trim() === '') {
      return;
    }
    setStatus('saving');
    try {
      const method = note && note.id ? 'PUT' : 'POST';
      const body: {
        id?: string;
        title: string;
        content: string;
        requiresRevision?: boolean;
      } = {
        title: title.trim(),
        content: content.trim(),
        requiresRevision,
      };
      if (note && note.id) body.id = note.id;
      const res = await fetch('/api/notes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setStatus('saved');
      onSave(data.note);
      if (!note) {
        setTitle('');
        setContent('');
        setRequiresRevision(false);
      }
    } catch (err) {
      console.error('note save error', err);
      setStatus('error');
    }
  }, [title, content, requiresRevision, note, onSave, status]);

  return (
    <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <input
          className="w-full text-lg font-semibold border-b border-slate-300 focus:outline-none focus:border-indigo-300 pb-1"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setStatus('edited');
          }}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </div>
      <textarea
        rows={6}
        className="w-full p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-y placeholder:text-slate-400 transition-all"
        placeholder="Write your notes here..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setStatus('edited');
        }}
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={requiresRevision}
              onChange={(e) => {
                setRequiresRevision(e.target.checked);
                setStatus('edited');
              }}
            />
            Requires Revision
          </label>
          <div className="flex items-center gap-1">
            {status === 'saving' && (
              <Loader2 className="animate-spin text-indigo-500" size={16} />
            )}
            {status === 'saved' && (
              <Check className="text-green-500" size={16} />
            )}
            {status === 'error' && (
              <AlertCircle className="text-red-500" size={16} />
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={
            status === 'saving' ||
            (title.trim() === '' && content.trim() === '')
          }
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-3 h-3" /> Save
        </button>
      </div>
    </div>
  );
}
