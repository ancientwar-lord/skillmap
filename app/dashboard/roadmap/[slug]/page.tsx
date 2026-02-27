'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Roadmap from '@/components/Roadmap';
import ScatteredIconsBg from '@/components/ScatteredIconsBg';

interface SubTask {
  $id: string;
  title: string;
  completed: boolean;
  ainotes?: string | null;
}

interface RoadmapTaskData {
  taskId: string;
  title: string;
  tag?: string;
  ainotes?: string | null;
  resources?: Record<string, unknown> | null;
  subtasks: SubTask[];
}

interface RoadmapInfo {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
}

export default function DashboardRoadmapDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [roadmapInfo, setRoadmapInfo] = useState<RoadmapInfo | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapTaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const res = await fetch(`/api/roadmaps/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Roadmap not found');
        setRoadmapInfo(data.roadmap);
        setRoadmapData(data.roadmapData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmap();
  }, [slug]);

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!roadmapInfo) return;

    setRoadmapData((prev) =>
      prev.map((task) => ({
        ...task,
        subtasks: task.subtasks.map((sub) =>
          sub.$id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        ),
      }))
    );

    try {
      const res = await fetch('/api/roadmaps/toggle-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtaskId,
          roadmapId: roadmapInfo.id,
        }),
      });

      if (!res.ok) {
        setRoadmapData((prev) =>
          prev.map((task) => ({
            ...task,
            subtasks: task.subtasks.map((sub) =>
              sub.$id === subtaskId
                ? { ...sub, completed: !sub.completed }
                : sub
            ),
          }))
        );
      }
    } catch {
      setRoadmapData((prev) =>
        prev.map((task) => ({
          ...task,
          subtasks: task.subtasks.map((sub) =>
            sub.$id === subtaskId ? { ...sub, completed: !sub.completed } : sub
          ),
        }))
      );
    }
  };

  const handleAiNotesUpdate = useCallback(
    (type: 'task' | 'subtask', id: string, notes: string) => {
      setRoadmapData((prev) =>
        prev.map((task) => {
          if (type === 'task' && task.taskId === id) {
            return { ...task, ainotes: notes };
          }
          return {
            ...task,
            subtasks: task.subtasks.map((sub) =>
              type === 'subtask' && sub.$id === id
                ? { ...sub, ainotes: notes }
                : sub
            ),
          };
        })
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
        <p className="text-slate-500">Loading roadmap...</p>
      </div>
    );
  }

  if (error || !roadmapInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 font-medium text-lg mb-4">
          {error || 'Roadmap not found'}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <ScatteredIconsBg />
      <div className="container mx-auto px-4">
        <Roadmap
          title={roadmapInfo.title}
          description={roadmapInfo.description || undefined}
          roadmapData={roadmapData}
          roadmapId={roadmapInfo.id}
          initialNotes={roadmapInfo.notes}
          onToggleSubtask={handleToggleSubtask}
          onAiNotesUpdate={handleAiNotesUpdate}
        />
      </div>
    </div>
  );
}
