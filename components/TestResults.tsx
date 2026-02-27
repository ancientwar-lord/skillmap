'use client';

import { useState } from 'react';
import {
  Trophy,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import type { TestQuestion, AIEvaluation } from '@/lib/types';

interface TestResultsProps {
  questions: TestQuestion[];
  userAnswers: Record<string, string>;
  questionTimes: Record<string, number>;
  totalTimeTaken: number;
  aiEvaluation: AIEvaluation | null;
  evaluationLoading: boolean;
  onRetry: () => void;
}

type TabType = 'all' | 'correct' | 'incorrect' | 'unattempted';

export default function TestResults({
  questions,
  userAnswers,
  questionTimes,
  totalTimeTaken,
  aiEvaluation,
  evaluationLoading,
  onRetry,
}: TestResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  questions.forEach((q) => {
    if (!userAnswers[q.id]) {
      unattemptedCount++;
    } else if (userAnswers[q.id] === q.correct_answer) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  const scorePercentage =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  const filteredQuestions = questions.filter((q) => {
    const userAns = userAnswers[q.id];
    const isCorrect = userAns === q.correct_answer;

    switch (activeTab) {
      case 'correct':
        return !!userAns && isCorrect;
      case 'incorrect':
        return !!userAns && !isCorrect;
      case 'unattempted':
        return !userAns;
      default:
        return true;
    }
  });

  const getAiExplanation = (questionId: string) => {
    if (!aiEvaluation?.questionAnalysis) return null;
    return aiEvaluation.questionAnalysis.find(
      (a) => a.questionId === questionId
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 text-yellow-600 mb-2">
          <Trophy size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Test Results</h1>
        <p className="text-gray-600">
          You scored {correctCount} out of {questions.length} ({scorePercentage}
          %)
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
          <Target size={20} className="mx-auto text-blue-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase font-medium">Score</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {scorePercentage}%
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
          <CheckCircle size={20} className="mx-auto text-green-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase font-medium">Correct</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {correctCount}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
          <XCircle size={20} className="mx-auto text-red-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase font-medium">
            Incorrect
          </p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {incorrectCount}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
          <HelpCircle size={20} className="mx-auto text-yellow-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase font-medium">Skipped</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">
            {unattemptedCount}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-center">
          <Clock size={20} className="mx-auto text-gray-500 mb-2" />
          <p className="text-xs text-gray-500 uppercase font-medium">Time</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">
            {Math.floor(totalTimeTaken / 60)}m {Math.floor(totalTimeTaken % 60)}
            s
          </p>
        </div>
      </div>

      {/* AI Evaluation Panel */}
      {evaluationLoading && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center">
          <Sparkles
            size={32}
            className="mx-auto text-purple-500 mb-3 animate-pulse"
          />
          <p className="text-purple-700 font-semibold text-lg">
            AI is analyzing your performance...
          </p>
          <p className="text-purple-500 text-sm mt-1">
            This may take a few seconds
          </p>
        </div>
      )}

      {aiEvaluation && !evaluationLoading && (
        <div className="space-y-4">
          {/* Strengths */}
          {aiEvaluation.strengths.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                <TrendingUp size={18} /> Strengths
              </h3>
              <ul className="space-y-2">
                {aiEvaluation.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-green-700 text-sm flex items-start gap-2"
                  >
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {aiEvaluation.weaknesses.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                <AlertTriangle size={18} /> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {aiEvaluation.weaknesses.map((w, i) => (
                  <li
                    key={i}
                    className="text-red-700 text-sm flex items-start gap-2"
                  >
                    <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {aiEvaluation.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                <BookOpen size={18} /> Recommendations
              </h3>
              <ul className="space-y-2">
                {aiEvaluation.recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="text-blue-700 text-sm flex items-start gap-2"
                  >
                    <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md transition-all"
        >
          <RotateCcw size={20} />
          Back to Practice
        </button>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-xl transition-all"
        >
          <RotateCcw size={20} />
          Take Another Test
        </button>
      </div>

      {/* Question Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Detailed Analysis
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {[
              { key: 'all' as TabType, label: 'All', count: questions.length },
              {
                key: 'correct' as TabType,
                label: 'Correct',
                count: correctCount,
              },
              {
                key: 'incorrect' as TabType,
                label: 'Incorrect',
                count: incorrectCount,
              },
              {
                key: 'unattempted' as TabType,
                label: 'Skipped',
                count: unattemptedCount,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Question List */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">
              No questions in this category.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const userAns = userAnswers[q.id];
              const isUnattempted = !userAns;
              const isCorrect = userAns === q.correct_answer;
              const timeSpent = questionTimes[q.id] || 0;
              const isExpanded = expandedQuestions.has(q.id);
              const aiAnalysis = getAiExplanation(q.id);

              let statusColor = 'bg-red-50 border-red-200';
              let StatusIcon = XCircle;
              let statusText = 'Incorrect';
              let iconColor = 'text-red-600';

              if (isUnattempted) {
                statusColor = 'bg-yellow-50 border-yellow-200';
                StatusIcon = AlertTriangle;
                statusText = 'Skipped';
                iconColor = 'text-yellow-600';
              } else if (isCorrect) {
                statusColor = 'bg-green-50 border-green-200';
                StatusIcon = CheckCircle;
                statusText = 'Correct';
                iconColor = 'text-green-600';
              }

              return (
                <div
                  key={q.id}
                  className={`rounded-xl border ${statusColor} overflow-hidden`}
                >
                  {/* Question Header - Always Visible */}
                  <button
                    onClick={() => toggleExpand(q.id)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <StatusIcon className={iconColor} size={22} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 text-sm">
                          Q{q.question_no}.{' '}
                        </span>
                        <span className="text-gray-700 text-sm line-clamp-1">
                          {q.question_text}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {Math.floor(timeSpent / 60)}m{' '}
                        {Math.floor(timeSpent % 60)}s
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60">
                        {statusText}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-200/50 pt-4">
                      {/* Question Text */}
                      <p className="text-gray-800 font-medium">
                        {q.question_text}
                      </p>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((option) => {
                          const isUserAnswer = userAns === option.key;
                          const isCorrectAnswer =
                            q.correct_answer === option.key;

                          let optClass =
                            'bg-white border-gray-200 text-gray-700';
                          if (isCorrectAnswer) {
                            optClass =
                              'bg-green-100 border-green-400 text-green-800';
                          }
                          if (isUserAnswer && !isCorrect) {
                            optClass = 'bg-red-100 border-red-400 text-red-800';
                          }

                          return (
                            <div
                              key={option.key}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${optClass}`}
                            >
                              <span className="w-7 h-7 rounded-full border-2 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                {option.key}
                              </span>
                              <span className="text-sm pt-1 flex-1">
                                {option.text}
                              </span>
                              {isCorrectAnswer && (
                                <CheckCircle
                                  size={16}
                                  className="text-green-600 flex-shrink-0 mt-1"
                                />
                              )}
                              {isUserAnswer && !isCorrect && (
                                <XCircle
                                  size={16}
                                  className="text-red-600 flex-shrink-0 mt-1"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Your Answer vs Correct */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-600">
                            Your Answer:{' '}
                          </span>
                          <span
                            className={
                              isCorrect
                                ? 'text-green-700'
                                : isUnattempted
                                  ? 'text-yellow-700'
                                  : 'text-red-700'
                            }
                          >
                            {isUnattempted ? 'Not Answered' : userAns}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-600">
                            Correct Answer:{' '}
                          </span>
                          <span className="text-green-700 font-medium">
                            {q.correct_answer}
                          </span>
                        </div>
                      </div>

                      {/* AI Explanation */}
                      {aiAnalysis && aiAnalysis.explanation && (
                        <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="font-semibold text-purple-800 flex items-center gap-2 mb-2 text-sm">
                            <Sparkles size={14} /> AI Explanation
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {aiAnalysis.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
