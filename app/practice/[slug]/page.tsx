'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, ChevronDown, Target, Zap } from 'lucide-react';
import TestInterface from '@/components/TestInterface';
import TestResults from '@/components/TestResults';
import type { TestQuestion, TestResultData, AIEvaluation } from '@/lib/types';

type Phase = 'setup' | 'generating' | 'test' | 'results';

export default function PracticeSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicFromSlug = decodeURIComponent(slug).replace(/-/g, ' ');
  const scopeParam = searchParams.get('scope') || 'topic';
  const contextParam = searchParams.get('context') || '';
  const numQParam = searchParams.get('numQ');
  const diffParam = searchParams.get('diff');
  const autostart = searchParams.get('autostart') === '1';

  const [phase, setPhase] = useState<Phase>(autostart ? 'generating' : 'setup');
  const [topic] = useState(topicFromSlug);
  const [numberOfQuestions, setNumberOfQuestions] = useState(
    numQParam ? Math.min(Math.max(Number(numQParam), 5), 30) : 10
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    diffParam === 'easy' || diffParam === 'hard' ? diffParam : 'medium'
  );
  const [error, setError] = useState('');

  // Test data
  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);

  // Results data
  const [resultData, setResultData] = useState<TestResultData | null>(null);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  const handleGenerateTest = useCallback(async () => {
    setPhase('generating');
    setError('');

    try {
      const res = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          numberOfQuestions,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate test.');
      }

      setTestTitle(data.title);
      setQuestions(data.questions);
      setPhase('test');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
      setPhase('setup');
    }
  }, [topic, numberOfQuestions, difficulty]);

  // Auto-start test generation when autostart param is present
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (autostart && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleGenerateTest();
    }
  }, [autostart, handleGenerateTest]);

  const handleTestSubmit = async (data: TestResultData) => {
    setResultData(data);
    setPhase('results');
    setEvaluationLoading(true);

    try {
      const res = await fetch('/api/evaluate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: data.questions,
          userAnswers: data.userAnswers,
          questionTimes: data.questionTimes,
          totalTimeTaken: data.totalTimeTaken,
          topic: topic.trim(),
          title: testTitle,
          difficulty,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setAiEvaluation(result.evaluation);
      } else {
        console.error('Evaluation error:', result.error);
      }
    } catch (err) {
      console.error('Failed to evaluate test:', err);
    } finally {
      setEvaluationLoading(false);
    }
  };

  const handleRetry = () => {
    setPhase('setup');
    setQuestions([]);
    setResultData(null);
    setAiEvaluation(null);
    setTestTitle('');
    setError('');
  };

  const getScopeLabel = () => {
    switch (scopeParam) {
      case 'subtask':
        return 'Subtask';
      case 'task':
        return 'Task';
      case 'roadmap':
        return 'Full Roadmap';
      default:
        return 'Topic';
    }
  };

  const getScopeColor = () => {
    switch (scopeParam) {
      case 'subtask':
        return 'bg-emerald-100 text-emerald-700';
      case 'task':
        return 'bg-blue-100 text-blue-700';
      case 'roadmap':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // ── Test Phase ──
  if (phase === 'test' && questions.length > 0) {
    return (
      <TestInterface
        questions={questions}
        testTitle={testTitle}
        onSubmit={handleTestSubmit}
      />
    );
  }

  // ── Results Phase ──
  if (phase === 'results' && resultData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Back bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Roadmap
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm text-gray-500 truncate">
            Results: <span className="font-medium text-gray-800">{topic}</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              Retake Test
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        <TestResults
          questions={resultData.questions}
          userAnswers={resultData.userAnswers}
          questionTimes={resultData.questionTimes}
          totalTimeTaken={resultData.totalTimeTaken}
          aiEvaluation={aiEvaluation}
          evaluationLoading={evaluationLoading}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // ── Generating Phase ──
  if (phase === 'generating') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-2">
            <Loader2 size={40} className="text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Generating Your Test
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            AI is preparing {numberOfQuestions} {difficulty}-level questions on{' '}
            <span className="font-medium text-gray-700">{topic}</span>
          </p>
          <div className="flex justify-center gap-1 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Setup Phase ──
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 mb-4">
            <Target size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Test Your Skills</h1>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getScopeColor()}`}
            >
              {getScopeLabel()}
            </span>
            {contextParam && (
              <span className="text-xs text-gray-400 truncate max-w-48">
                from: {decodeURIComponent(contextParam)}
              </span>
            )}
          </div>
        </div>

        {/* Topic display */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Testing Topic
            </label>
            <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-medium">
              {topic}
            </div>
          </div>

          {/* Number of Questions */}
          <div>
            <label
              htmlFor="numQ"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Number of Questions
            </label>
            <div className="relative">
              <select
                id="numQ"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 appearance-none outline-none"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Difficulty
            </label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all capitalize ${
                    difficulty === d
                      ? d === 'easy'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : d === 'hard'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateTest}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            Start Test
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Tests are generated by AI and may occasionally contain inaccuracies.
        </p>
      </div>
    </div>
  );
}
