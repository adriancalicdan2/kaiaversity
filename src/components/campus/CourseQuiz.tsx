"use client";

import React, { useState, useTransition } from "react";
import { submitQuizAnswers } from "@/lib/actions/courses";
import Link from "next/link";
import { Sparkles, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Answer {
  id: string;
  answer: string;
}

interface Question {
  id: string;
  question: string;
  answers: Answer[];
}

interface CourseQuizProps {
  course: {
    id: string;
    slug: string;
    title: string;
    pointsReward: number;
  };
  quiz: {
    id: string;
    title: string;
    passingScore: number;
  };
  questions: Question[];
}

function deterministicShuffle<T>(array: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0; // Convert to 32bit integer
  }
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CourseQuiz({ course, quiz, questions }: CourseQuizProps) {
  const shuffledQuestions = React.useMemo(() => {
    return questions.map((q) => ({
      ...q,
      answers: deterministicShuffle(q.answers, q.id),
    }));
  }, [questions]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    completed: boolean;
    passed: boolean;
    score: number;
    correctCount: number;
    totalQuestions: number;
    badgeAwarded?: { name: string; icon: string; description: string } | null;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const currentQuestion = shuffledQuestions[currentIdx];
  const hasSelected = currentQuestion ? !!selectedAnswers[currentQuestion.id] : false;

  function selectOption(answerId: string) {
    if (!currentQuestion) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerId,
    });
  }

  function handleNext() {
    if (currentIdx < shuffledQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  }

  function handleSubmit() {
    setSubmissionError(null);
    startTransition(async () => {
      const payload = Object.entries(selectedAnswers).map(([qId, ansId]) => ({
        questionId: qId,
        selectedAnswerId: ansId,
      }));

      try {
        const res = await submitQuizAnswers(course.id, payload);
        setResult({
          completed: true,
          passed: res.passed,
          score: res.score,
          correctCount: res.correctCount,
          totalQuestions: res.totalQuestions,
          badgeAwarded: res.badgeAwarded,
        });
      } catch (err: any) {
        console.error("Failed to submit quiz:", err);
        setSubmissionError(err.message || "Failed to submit quiz answers. Please try again.");
      }
    });
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
        No questions available for this quiz. Please contact your administrator.
      </div>
    );
  }

  if (result?.completed) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: result.passed ? "2px solid rgba(16, 185, 129, 0.3)" : "2px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 20,
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
            maxWidth: 550,
            margin: "40px auto",
          }}
        >
          {result.passed ? (
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Sparkles size={64} style={{ color: "#10b981" }} />
              </div>
              <h2 style={{ color: "#10b981", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
                Congratulations, You Passed!
              </h2>
              <p style={{ color: "#e2e8f0", fontSize: 15, marginBottom: 24 }}>
                You scored <strong>{result.score}%</strong> ({result.correctCount} of {result.totalQuestions} correct answers).
              </p>

              <div
                style={{
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 32,
                }}
              >
                <span style={{ color: "#10b981", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  REWARDS EARNED
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "white", display: "block", marginBottom: 12 }}>
                  +{course.pointsReward} Points
                </span>
                
                {result.badgeAwarded && (
                  <div style={{ borderTop: "1px solid rgba(16, 185, 129, 0.15)", paddingTop: 12, display: "flex", alignItems: "center", justifyItems: "center", gap: 12, justifyContent: "center" }}>
                    <span style={{ fontSize: 32 }}>{result.badgeAwarded.icon}</span>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ color: "white", fontWeight: 700, fontSize: 13, display: "block" }}>
                        {result.badgeAwarded.name}
                      </span>
                      <span style={{ color: "#64748b", fontSize: 11 }}>
                        {result.badgeAwarded.description}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <XCircle size={64} style={{ color: "#ef4444" }} />
              </div>
              <h2 style={{ color: "#ef4444", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
                Quiz Attempt Failed
              </h2>
              <p style={{ color: "#e2e8f0", fontSize: 15, marginBottom: 24 }}>
                You scored <strong>{result.score}%</strong>. The passing score is {quiz.passingScore}%. Keep studying and try again!
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <Link
              href={`/campus/courses/${course.slug}`}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
                color: "white",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              Back to Course
            </Link>
            {!result.passed && (
              <button
                onClick={() => {
                  setCurrentIdx(0);
                  setSelectedAnswers({});
                  setResult(null);
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  color: "white",
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Retry Quiz
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const progress = Math.round(((currentIdx + 1) / shuffledQuestions.length) * 100);

  return (
    <div style={{ maxWidth: 650, margin: "20px auto" }}>
      {/* Quiz details header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
          QUESTION {currentIdx + 1} OF {shuffledQuestions.length}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>
          Passing Score: {quiz.passingScore}%
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#8b5cf6", borderRadius: 2, transition: "width 0.2s ease" }} />
      </div>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 20,
          padding: "32px 36px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, lineHeight: 1.4, marginBottom: 24 }}>
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {currentQuestion.answers.map((option) => {
            const isSelected = selectedAnswers[currentQuestion.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => selectOption(option.id)}
                disabled={isPending}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 20px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  color: isSelected ? "white" : "#94a3b8",
                  background: isSelected ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.01)",
                  border: isSelected ? "1px solid #8b5cf6" : "1px solid rgba(255, 255, 255, 0.05)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {option.answer}
              </button>
            );
          })}
        </div>

        {submissionError && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#f87171",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <XCircle size={16} />
            <span>{submissionError}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0 || isPending}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: currentIdx === 0 ? "#475569" : "#94a3b8",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            }}
          >
            Previous
          </button>

          {currentIdx === shuffledQuestions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!hasSelected || isPending}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "white",
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                border: "none",
                cursor: !hasSelected ? "not-allowed" : "pointer",
                opacity: !hasSelected ? 0.5 : 1,
              }}
            >
              {isPending ? "Grading..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasSelected}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "white",
                background: "#8b5cf6",
                border: "none",
                cursor: !hasSelected ? "not-allowed" : "pointer",
                opacity: !hasSelected ? 0.5 : 1,
              }}
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
