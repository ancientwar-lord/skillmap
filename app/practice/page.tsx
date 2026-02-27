'use client';

import { useState, useEffect, useCallback, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Pen,
  Sparkles,
  Loader2,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Trophy,
  X,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Trash2,
  NotebookPen,
} from 'lucide-react';

// ── Types ──

interface TestHistoryItem {
  id: string;
  topic: string;
  title: string;
  difficulty: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  scorePercentage: number;
  totalTimeTaken: number;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
}

interface TestDetailQuestion {
  id: string;
  question_no: number;
  question_text: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  difficulty?: string;
  topic?: string;
}

interface QuestionAnalysis {
  questionId: string;
  isCorrect: boolean;
  explanation: string;
}

interface TestDetailData {
  id: string;
  topic: string;
  title: string;
  difficulty: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  scorePercentage: number;
  totalTimeTaken: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questions: TestDetailQuestion[];
  userAnswers: Record<string, string>;
  questionAnalysis: QuestionAnalysis[];
  createdAt: string;
}

// ── Component ──

export default function PracticePage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // History
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Detail popup
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<TestDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFilter, setDetailFilter] = useState<
    'all' | 'correct' | 'incorrect' | 'unattempted'
  >('all');

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/test-results');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGenerateTest = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Directs the user to the testing page with URL parameters
      router.push(
        `/practice/take?topic=${encodeURIComponent(topic)}&q=${numberOfQuestions}&diff=${difficulty}`
      );
    } catch (err) {
      setError('Failed to generate test.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/test-results/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data.result || data);
      } else {
        setDetailData(null);
      }
    } catch (err) {
      console.error('Failed to fetch test detail:', err);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // shared deletion logic for results
  const handleDeleteResult = async (
    e: MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    e.stopPropagation();
    if (!confirm('Delete this test result? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/test-results/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((r) => r.id !== id));
      } else {
        console.warn('failed to delete', await res.text());
      }
    } catch (err) {
      console.error('Error deleting test result:', err);
    }
  };

  const getFilteredQuestions = () => {
    if (!detailData) return [];
    return detailData.questions.filter((q) => {
      const userAns = detailData.userAnswers[q.id];
      if (detailFilter === 'correct') return userAns === q.correct_answer;
      if (detailFilter === 'incorrect')
        return userAns && userAns !== q.correct_answer;
      if (detailFilter === 'unattempted') return !userAns;
      return true;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50">
            <Pen className="w-6 h-6 text-blue-700" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-800 bg-clip-text text-transparent">
            Practice
          </h1>
        </div>
        <p className="text-slate-500 ml-14">
          Enter a topic and AI will generate a personalized test for you.
        </p>
      </motion.div>

      {/* ── Create Test Form ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-blue-200/50 shadow-sm shadow-blue-100/30 p-6 mb-10"
      >
        <div className="flex flex-col gap-4">
          <textarea
            id="topic"
            value={topic}
            rows={4}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. JavaScript Promises, React Hooks, Data Structures..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:bg-white transition-all disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateTest()}
            disabled={loading}
          />

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label
                htmlFor="numQ"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Number of Questions
              </label>
              <select
                id="numQ"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 focus:bg-white transition-all disabled:opacity-50"
                disabled={loading}
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={25}>25 Questions</option>
                <option value={30}>30 Questions</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Difficulty
              </label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    disabled={loading}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-all capitalize ${
                      difficulty === d
                        ? d === 'easy'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : d === 'hard'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            onClick={handleGenerateTest}
            disabled={loading || !topic.trim()}
            className="w-full sm:w-auto mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            Generate Test
          </button>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 mb-5">
        <NotebookPen className="w-5 h-5 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-800">
          Your Previous test results
        </h2>
        {!historyLoading && (
          <span className="text-xs text-slate-400 ml-1">
            ({history.length})
          </span>
        )}
      </div>

      {/* Empty */}
      {!historyLoading && history.length === 0 && (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            No tests taken yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Generate your first AI test above to get started
          </p>
        </div>
      )}

      {/* Test List */}
      {!historyLoading && history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {history.map((item, index) => {
            const date = new Date(item.createdAt);
            const timeAgo = getTimeAgo(date);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative bg-white rounded-2xl border border-blue-200/30 shadow-sm hover:shadow-lg hover:shadow-blue-200/20 hover:border-blue-300/50 transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleViewDetail(item.id)}
              >
                {/* delete button shown for all results now */}
                <button
                  onClick={(e) => handleDeleteResult(e, item.id)}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 border border-slate-200 hover:bg-red-50 hover:border-red-300 text-red-600 transition-all cursor-pointer"
                  title="Delete test result"
                >
                  <Trash2 size={14} />
                </button>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-800 transition-colors line-clamp-2 leading-snug text-sm">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {item.topic}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle size={12} className="text-green-500" />
                      {item.correctCount}/{item.totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={11} />
                      {Math.floor(item.totalTimeTaken / 60)}m
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        item.scorePercentage >= 80
                          ? 'text-green-600'
                          : item.scorePercentage >= 50
                            ? 'text-blue-600'
                            : 'text-slate-400'
                      }`}
                    >
                      {item.scorePercentage}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Test Detail Popup Overlay */}
      {typeof document !== 'undefined' &&
        detailOpen &&
        createPortal(
          <AnimatePresence>
            {detailOpen && (
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Backdrop */}
                <motion.div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setDetailOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                {/* Modal */}
                <motion.div
                  className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col"
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 30 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  {detailLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2
                        size={36}
                        className="text-blue-500 animate-spin mb-3"
                      />
                      <p className="text-gray-500 text-sm">
                        Loading test details...
                      </p>
                    </div>
                  ) : !detailData ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <AlertTriangle size={36} className="text-red-400 mb-3" />
                      <p className="text-gray-500 text-sm">
                        Failed to load test details.
                      </p>
                      <button
                        onClick={() => setDetailOpen(false)}
                        className="mt-4 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/60 shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg truncate">
                              {detailData.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Target size={12} />
                                {detailData.topic}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full font-medium capitalize ${
                                  detailData.difficulty === 'easy'
                                    ? 'bg-green-100 text-green-700'
                                    : detailData.difficulty === 'hard'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {detailData.difficulty}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(
                                  detailData.createdAt
                                ).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setDetailOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0 ml-4"
                          >
                            <X size={20} className="text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable content */}
                      <div className="flex-1 overflow-y-auto">
                        {/* Score Overview */}
                        <div className="px-6 py-5 border-b border-gray-100">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="bg-blue-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-blue-700">
                                {detailData.scorePercentage}%
                              </p>
                              <p className="text-xs text-blue-600 font-medium">
                                Score
                              </p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-green-700">
                                {detailData.correctCount}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                Correct
                              </p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-red-700">
                                {detailData.incorrectCount}
                              </p>
                              <p className="text-xs text-red-600 font-medium">
                                Wrong
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                              <p className="text-2xl font-bold text-gray-600">
                                {detailData.unattemptedCount}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">
                                Skipped
                              </p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                              <p className="text-2xl font-bold text-purple-700">
                                {Math.floor(detailData.totalTimeTaken / 60)}m{' '}
                                {Math.floor(detailData.totalTimeTaken % 60)}s
                              </p>
                              <p className="text-xs text-purple-600 font-medium">
                                Time
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Strengths / Weaknesses / Recommendations */}
                        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {detailData.strengths.length > 0 && (
                              <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle
                                    size={14}
                                    className="text-green-600"
                                  />
                                  <p className="text-xs font-bold text-green-800 uppercase tracking-wide">
                                    Strengths
                                  </p>
                                </div>
                                <ul className="space-y-1.5">
                                  {detailData.strengths.map((s, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-green-700 flex items-start gap-1.5"
                                    >
                                      <CheckCircle
                                        size={10}
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {detailData.weaknesses.length > 0 && (
                              <div className="bg-red-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <XCircle size={14} className="text-red-600" />
                                  <p className="text-xs font-bold text-red-800 uppercase tracking-wide">
                                    Areas to Improve
                                  </p>
                                </div>
                                <ul className="space-y-1.5">
                                  {detailData.weaknesses.map((w, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-red-700 flex items-start gap-1.5"
                                    >
                                      <XCircle
                                        size={10}
                                        className="mt-0.5 flex-shrink-0"
                                      />
                                      {w}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {detailData.recommendations.length > 0 && (
                            <div className="bg-indigo-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp
                                  size={14}
                                  className="text-indigo-600"
                                />
                                <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                                  Recommendations
                                </p>
                              </div>
                              <ul className="space-y-1.5">
                                {detailData.recommendations.map((r, i) => (
                                  <li
                                    key={i}
                                    className="text-xs text-indigo-700 flex items-start gap-1.5"
                                  >
                                    <Sparkles
                                      size={10}
                                      className="mt-0.5 flex-shrink-0"
                                    />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="px-6 pt-4 pb-2 sticky top-0 bg-white z-10 border-b border-gray-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-700 mr-2">
                              Questions
                            </span>
                            {(
                              [
                                'all',
                                'correct',
                                'incorrect',
                                'unattempted',
                              ] as const
                            ).map((f) => {
                              const count =
                                f === 'all'
                                  ? detailData.totalQuestions
                                  : f === 'correct'
                                    ? detailData.correctCount
                                    : f === 'incorrect'
                                      ? detailData.incorrectCount
                                      : detailData.unattemptedCount;
                              return (
                                <button
                                  key={f}
                                  onClick={() => setDetailFilter(f)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                                    detailFilter === f
                                      ? f === 'correct'
                                        ? 'bg-green-100 text-green-800'
                                        : f === 'incorrect'
                                          ? 'bg-red-100 text-red-800'
                                          : f === 'unattempted'
                                            ? 'bg-gray-200 text-gray-700'
                                            : 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  {f} ({count})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Questions List */}
                        <div className="px-6 py-4 space-y-4">
                          {getFilteredQuestions().length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-8">
                              No questions in this category.
                            </p>
                          ) : (
                            getFilteredQuestions().map((q) => {
                              const userAns = detailData.userAnswers[q.id];
                              const isCorrect = userAns === q.correct_answer;
                              const isUnattempted = !userAns;
                              const analysis = detailData.questionAnalysis.find(
                                (a) => a.questionId === q.id
                              );

                              return (
                                <div
                                  key={q.id}
                                  className={`rounded-xl border p-4 ${
                                    isUnattempted
                                      ? 'border-gray-200 bg-gray-50/50'
                                      : isCorrect
                                        ? 'border-green-200 bg-green-50/30'
                                        : 'border-red-200 bg-red-50/30'
                                  }`}
                                >
                                  {/* Question header */}
                                  <div className="flex items-start gap-3 mb-3">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                        isUnattempted
                                          ? 'bg-gray-200 text-gray-600'
                                          : isCorrect
                                            ? 'bg-green-200 text-green-800'
                                            : 'bg-red-200 text-red-800'
                                      }`}
                                    >
                                      {isUnattempted ? (
                                        <HelpCircle size={14} />
                                      ) : isCorrect ? (
                                        <CheckCircle size={14} />
                                      ) : (
                                        <XCircle size={14} />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                        <span className="text-gray-400 mr-1">
                                          Q{q.question_no}.
                                        </span>
                                        {q.question_text}
                                      </p>
                                      {q.topic && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                          Topic: {q.topic}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Options */}
                                  <div className="space-y-1.5 ml-10">
                                    {q.options.map((opt) => {
                                      const isUserChoice = userAns === opt.key;
                                      const isCorrectOption =
                                        q.correct_answer === opt.key;
                                      let optClass =
                                        'bg-white border-gray-200 text-gray-700';
                                      if (isCorrectOption) {
                                        optClass =
                                          'bg-green-50 border-green-300 text-green-800 font-medium';
                                      }
                                      if (isUserChoice && !isCorrect) {
                                        optClass =
                                          'bg-red-50 border-red-300 text-red-800 line-through';
                                      }

                                      return (
                                        <div
                                          key={opt.key}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${optClass}`}
                                        >
                                          <span
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                              isCorrectOption
                                                ? 'bg-green-500 text-white border-green-500'
                                                : isUserChoice && !isCorrect
                                                  ? 'bg-red-500 text-white border-red-500'
                                                  : 'border-gray-300 text-gray-500'
                                            }`}
                                          >
                                            {opt.key}
                                          </span>
                                          <span className="flex-1">
                                            {opt.text}
                                          </span>
                                          {isCorrectOption && (
                                            <CheckCircle
                                              size={14}
                                              className="text-green-500 shrink-0"
                                            />
                                          )}
                                          {isUserChoice && !isCorrect && (
                                            <XCircle
                                              size={14}
                                              className="text-red-500 shrink-0"
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Your answer + Correct answer labels */}
                                  <div className="ml-10 mt-2 flex items-center gap-3 text-[11px]">
                                    <span className="text-gray-500">
                                      Your answer:{' '}
                                      <span
                                        className={`font-semibold ${isUnattempted ? 'text-gray-400 italic' : isCorrect ? 'text-green-700' : 'text-red-700'}`}
                                      >
                                        {isUnattempted
                                          ? 'Not attempted'
                                          : userAns}
                                      </span>
                                    </span>
                                    {!isCorrect && (
                                      <span className="text-gray-500">
                                        Correct:{' '}
                                        <span className="font-semibold text-green-700">
                                          {q.correct_answer}
                                        </span>
                                      </span>
                                    )}
                                  </div>

                                  {/* AI Explanation */}
                                  {analysis?.explanation && (
                                    <div className="ml-10 mt-3 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Sparkles
                                          size={12}
                                          className="text-indigo-500"
                                        />
                                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                                          AI Explanation
                                        </span>
                                      </div>
                                      <p className="text-xs text-indigo-800 leading-relaxed">
                                        {analysis.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {detailData.totalQuestions} questions &bull;{' '}
                          {Math.floor(detailData.totalTimeTaken / 60)}m{' '}
                          {Math.floor(detailData.totalTimeTaken % 60)}s
                        </span>
                        <button
                          onClick={() => setDetailOpen(false)}
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
