'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import type { TestQuestion, TestResultData } from '@/lib/types';

interface TestInterfaceProps {
  questions: TestQuestion[];
  testTitle: string;
  onSubmit: (data: TestResultData) => void;
}

export default function TestInterface({
  questions,
  testTitle,
  onSubmit,
}: TestInterfaceProps) {
  const [isRightbarOpen, setIsRightbarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [testStartTime] = useState(() => Date.now());
  const [lastQuestionStartTime, setLastQuestionStartTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentQTimeDisplay, setCurrentQTimeDisplay] = useState(0);

  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(() => {
    if (questions.length > 0) {
      return new Set([questions[0].id]);
    }
    return new Set();
  });
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - testStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [testStartTime]);

  // Per-question timer display
  useEffect(() => {
    const updateCurrentTime = () => {
      if (questions.length > 0) {
        const now = Date.now();
        const sessionElapsed = (now - lastQuestionStartTime) / 1000;
        const currentQId = questions[currentIndex].id;
        const prevElapsed = questionTimes[currentQId] || 0;
        setCurrentQTimeDisplay(Math.floor(prevElapsed + sessionElapsed));
      }
    };
    updateCurrentTime();
    const timer = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(timer);
  }, [lastQuestionStartTime, currentIndex, questions, questionTimes]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    if (questions.length > 0) {
      const currentQ = questions[currentIndex];
      setUserAnswers((prev) => {
        const current = prev[currentQ.id];
        if (current === answer) {
          const newState = { ...prev };
          delete newState[currentQ.id];
          return newState;
        }
        return { ...prev, [currentQ.id]: answer };
      });
    }
  };

  const toggleMarkForReview = () => {
    const currentQId = questions[currentIndex].id;
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQId)) {
        newSet.delete(currentQId);
      } else {
        newSet.add(currentQId);
      }
      return newSet;
    });
  };

  const changeQuestion = (newIndex: number) => {
    const now = Date.now();
    const elapsed = (now - lastQuestionStartTime) / 1000;
    const currentQId = questions[currentIndex].id;

    setQuestionTimes((prev) => ({
      ...prev,
      [currentQId]: (prev[currentQId] || 0) + elapsed,
    }));

    if (questions[newIndex]) {
      setVisitedQuestions((prev) => {
        const newSet = new Set(prev);
        newSet.add(questions[newIndex].id);
        return newSet;
      });
    }

    setLastQuestionStartTime(now);
    setCurrentIndex(newIndex);
  };

  const handleSubmit = () => {
    if (!confirm('Are you sure you want to submit the test?')) return;

    const now = Date.now();
    const elapsed = (now - lastQuestionStartTime) / 1000;
    const currentQId = questions[currentIndex].id;

    const finalQuestionTimes = {
      ...questionTimes,
      [currentQId]: (questionTimes[currentQId] || 0) + elapsed,
    };

    const totalTime = (now - testStartTime) / 1000;

    onSubmit({
      questions,
      userAnswers,
      questionTimes: finalQuestionTimes,
      totalTimeTaken: totalTime,
    });
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const currentAnswer = userAnswers[currentQ.id];

  const answeredCount = Object.keys(userAnswers).length;
  const reviewCount = markedForReview.size;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-lg truncate">{testTitle}</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              ⏱️ {formatTime(currentQTimeDisplay)} on this question
            </span>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-6 pb-48">
          <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                  Q{currentQ.question_no}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {currentIndex + 1} of {questions.length}
                </span>
              </div>
              {currentQ.difficulty && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    currentQ.difficulty === 'easy'
                      ? 'bg-green-100 text-green-700'
                      : currentQ.difficulty === 'hard'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {currentQ.difficulty}
                </span>
              )}
            </div>

            {/* Question Text */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <p className="text-gray-900 text-lg leading-relaxed font-medium">
                {currentQ.question_text}
              </p>
              {currentQ.topic && (
                <p className="mt-3 text-xs text-gray-400">Topic: {currentQ.topic}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option) => {
                const isSelected = currentAnswer === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => handleAnswerSelect(option.key)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 font-bold flex items-center justify-center text-sm transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 group-hover:border-gray-400'
                      }`}
                    >
                      {option.key}
                    </span>
                    <span
                      className={`pt-2 text-base ${
                        isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => changeQuestion(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft size={20} /> Previous
            </button>

            <button
              onClick={toggleMarkForReview}
              className={`text-sm font-medium px-5 py-2.5 rounded-lg border transition-colors ${
                markedForReview.has(currentQ.id)
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {markedForReview.has(currentQ.id) ? '★ Marked' : '☆ Mark for Review'}
            </button>

            <button
              onClick={() =>
                changeQuestion(Math.min(questions.length - 1, currentIndex + 1))
              }
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Rightbar - Question Palette */}
      <div
        className={`${
          isRightbarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 bg-white border-l border-gray-200 flex flex-col h-full relative overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-sm">Questions</h3>
          <button
            onClick={() => setIsRightbarOpen(false)}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="p-3 border-b border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-green-50 rounded-lg p-2">
            <div className="font-bold text-green-700">{answeredCount}</div>
            <div className="text-green-600">Answered</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2">
            <div className="font-bold text-yellow-700">{reviewCount}</div>
            <div className="text-yellow-600">Review</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="font-bold text-gray-700">
              {questions.length - answeredCount}
            </div>
            <div className="text-gray-600">Left</div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!userAnswers[q.id];
              const isCurrent = currentIndex === idx;
              const isVisited = visitedQuestions.has(q.id);
              const isMarked = markedForReview.has(q.id);

              let btnClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
              if (isCurrent) {
                btnClass = 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1';
              } else if (isMarked && isAnswered) {
                btnClass = 'bg-yellow-100 text-yellow-700 border border-yellow-300';
              } else if (isMarked) {
                btnClass = 'bg-yellow-50 text-yellow-600 border border-yellow-200';
              } else if (isAnswered) {
                btnClass = 'bg-green-100 text-green-700 border border-green-300';
              } else if (isVisited) {
                btnClass = 'bg-blue-100 text-blue-700 border border-blue-300';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => changeQuestion(idx)}
                  className={`aspect-square rounded-lg font-medium text-sm transition-all ${btnClass}`}
                >
                  {q.question_no}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend + Submit */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="flex flex-wrap text-xs text-gray-500 gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
              <span>Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></div>
              <span>Visited</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-sm transition-colors"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Toggle Rightbar Button (when closed) */}
      {!isRightbarOpen && (
        <button
          onClick={() => setIsRightbarOpen(true)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 p-2 rounded-l-lg shadow-md text-gray-600 hover:text-blue-600 z-20"
        >
          <Menu size={20} />
        </button>
      )}
    </div>
  );
}
