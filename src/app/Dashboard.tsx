'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ─── Types ──────────────────────────────────────────────── */
type MindMapNode = { name: string; children?: MindMapNode[] };

type StudyData = {
  topic: string;
  summary: string;
  flashcards: { front: string; back: string }[];
  quiz: { question: string; options: string[]; answer: number }[];
  mindMapData: MindMapNode;
};

type Tab = 'Summary' | 'Flashcards' | 'Quiz' | 'Mind Map';

/* ─── Toast ──────────────────────────────────────────────── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] bg-inverse-surface text-on-inverse-surface px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-fade-in-up">
      <span className="material-symbols-outlined text-base">check_circle</span>
      {message}
    </div>
  );
}

/* ─── Mind Map (SVG connectors) ──────────────────────────── */
function MindMapNode({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
  const colors = [
    'bg-primary text-white shadow-lg shadow-primary/30',
    'bg-secondary-container text-on-secondary-container',
    'bg-surface-container-high text-on-surface',
    'bg-surface-container text-on-surface-variant',
  ];
  const color = colors[Math.min(depth, colors.length - 1)];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`flex flex-col items-center gap-0 ${depth > 0 ? 'pt-0' : ''}`}>
      <div className={`px-4 py-2 rounded-xl text-sm font-bold text-center max-w-[160px] min-w-[80px] ${color}`}>
        {node.name}
      </div>
      {hasChildren && (
        <div className="flex flex-col items-center">
          {/* Vertical stem down from parent */}
          <div className="w-px h-5 bg-outline-variant" />
          {/* Horizontal bar spanning children */}
          <div className="relative flex items-start">
            {node.children!.map((child, i) => (
              <div key={i} className="flex flex-col items-center px-3">
                {/* Vertical drop to child */}
                <div className="w-px h-5 bg-outline-variant" />
                <MindMapNode node={child} depth={depth + 1} />
              </div>
            ))}
            {/* Horizontal connector rendered as absolute overlay */}
            {node.children!.length > 1 && (
              <div
                className="absolute top-0 left-0 right-0 h-px bg-outline-variant"
                style={{ top: 0 }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Flash Card ─────────────────────────────────────────── */
function FlashCard({
  front,
  back,
  active,
}: {
  front: string;
  back: string;
  active: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip when card changes
  useEffect(() => { setFlipped(false); }, [front]);

  // Keyboard: space to flip when active
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active]);

  return (
    <div
      className="cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={() => setFlipped(f => !f)}
      role="button"
      aria-label={flipped ? 'Answer side — click to flip back' : 'Question side — click to reveal answer'}
    >
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          height: '180px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Question</span>
          <p className="text-on-surface font-semibold text-base leading-snug">{front}</p>
          <span className="text-[10px] text-on-surface-variant">Space or tap to reveal →</span>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 shadow-lg flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Answer</span>
          <p className="text-white font-semibold text-base leading-snug">{back}</p>
          <span className="text-[10px] text-white/60">Tap to flip back ←</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Flashcards Panel ───────────────────────────────────── */
function FlashcardsPanel({ flashcards }: { flashcards: { front: string; back: string }[] }) {
  const [index, setIndex] = useState(0);
  const total = flashcards.length;

  const prev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex(i => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') prev();
      if (e.code === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  const card = flashcards[index];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-primary rounded-full" />
          <h2 className="text-2xl font-bold font-headline text-on-surface">Flashcards</h2>
        </div>
        <span className="text-xs text-on-surface-variant font-semibold bg-surface-container px-3 py-1 rounded-full">
          {index + 1} / {total}
        </span>
      </div>

      <FlashCard front={card.front} back={card.back} active />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5 gap-3">
        <button
          onClick={prev}
          disabled={index === 0}
          className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-surface-container-high text-primary font-bold text-sm disabled:opacity-30 hover:opacity-80 transition-opacity"
          aria-label="Previous card"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Prev
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5 overflow-x-auto max-w-[200px] py-1">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full flex-shrink-0 transition-all ${i === index ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-outline-variant'}`}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={index === total - 1}
          className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-surface-container-high text-primary font-bold text-sm disabled:opacity-30 hover:opacity-80 transition-opacity"
          aria-label="Next card"
        >
          Next
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>

      <p className="text-center text-[11px] text-on-surface-variant mt-3">
        ← → arrow keys to navigate · Space to flip
      </p>
    </div>
  );
}

/* ─── Quiz ───────────────────────────────────────────────── */
function QuizView({ quiz }: { quiz: { question: string; options: string[]; answer: number }[] }) {
  const [selected, setSelected] = useState<(number | null)[]>(Array(quiz.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const score = selected.filter((s, i) => s === quiz[i].answer).length;

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-secondary rounded-full" />
          <h2 className="text-2xl font-bold font-headline text-on-surface">Knowledge Check</h2>
        </div>
        {submitted && (
          <div className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-sm font-bold">
            Score: {score}/{quiz.length}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {quiz.map((q, i) => (
          <div key={i}>
            <p className="font-bold text-on-surface mb-4">{i + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, j) => {
                let cls = 'border-outline-variant hover:bg-surface-container-low text-on-surface';
                if (submitted) {
                  if (j === q.answer) cls = 'border-green-400 bg-green-50 text-green-800';
                  else if (j === selected[i] && selected[i] !== q.answer) cls = 'border-red-300 bg-red-50 text-red-700';
                  else cls = 'border-outline-variant text-on-surface-variant opacity-60';
                } else if (selected[i] === j) {
                  cls = 'border-primary bg-primary/10 text-primary';
                }
                return (
                  <button
                    key={j}
                    disabled={submitted}
                    onClick={() => {
                      const copy = [...selected];
                      copy[i] = j;
                      setSelected(copy);
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex gap-4 items-center ${cls}`}
                  >
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected[i] === j && !submitted ? 'border-primary bg-primary text-white' : 'border-outline-variant text-on-surface-variant'}`}>
                      {String.fromCharCode(65 + j)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={selected.some(s => s === null)}
          className="mt-8 w-full py-4 bg-gradient-to-br from-primary to-secondary text-white font-bold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          Submit Answers
        </button>
      ) : (
        <div className="mt-8 space-y-3">
          <div className={`p-4 rounded-xl text-center font-bold ${score === quiz.length ? 'bg-green-100 text-green-800' : score >= quiz.length / 2 ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-700'}`}>
            {score === quiz.length ? '🎉 Perfect score!' : score >= quiz.length / 2 ? `Good job! ${score}/${quiz.length} correct` : `Keep studying! ${score}/${quiz.length} correct`}
          </div>
          <button
            onClick={() => { setSelected(Array(quiz.length).fill(null)); setSubmitted(false); }}
            className="w-full py-3 bg-surface-container-high text-primary font-bold rounded-xl hover:opacity-80 transition-opacity"
          >
            Retry Quiz
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Summary Panel ──────────────────────────────────────── */
function SummaryPanel({ summary, onCopy }: { summary: string; onCopy: () => void }) {
  return (
    <section className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 shadow-sm border border-outline-variant">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-primary rounded-full" />
          <h2 className="text-2xl font-bold font-headline text-on-surface">Executive Summary</h2>
        </div>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
          aria-label="Copy summary to clipboard"
        >
          <span className="material-symbols-outlined text-sm">content_copy</span>
          Copy
        </button>
      </div>
      <p className="text-lg text-on-surface leading-relaxed">{summary}</p>
      <div className="bg-secondary-container/30 border-l-4 border-secondary p-6 rounded-xl mt-8">
        <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest mb-2">
          <span className="material-symbols-outlined text-sm">lightbulb</span>
          Study Tip
        </div>
        <p className="text-on-secondary-container text-sm italic leading-relaxed">
          Switching between summaries, flashcards, and quizzes improves long-term retention by up to 35%. Explore all tabs!
        </p>
      </div>
    </section>
  );
}

/* ─── Dashboard ──────────────────────────────────────────── */
export default function Dashboard({ data, onReset }: { data: StudyData; onReset: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('Summary');
  const [toast, setToast] = useState<string | null>(null);
  // Key trick: changing quizKey forces QuizView to remount and reset its state
  const [quizKey, setQuizKey] = useState(0);
  const prevTab = useRef<Tab>('Summary');

  const tabs: Tab[] = ['Summary', 'Flashcards', 'Quiz', 'Mind Map'];

  const handleTabChange = (tab: Tab) => {
    // Reset quiz state when navigating away and back
    if (prevTab.current === 'Quiz' && tab !== 'Quiz') setQuizKey(k => k + 1);
    prevTab.current = tab;
    setActiveTab(tab);
  };

  const handleCopySummary = useCallback(() => {
    navigator.clipboard.writeText(data.summary).then(() => {
      setToast('Summary copied to clipboard!');
    }).catch(() => {
      setToast('Copy failed — please select and copy manually.');
    });
  }, [data.summary]);

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-6 py-4 bg-[#f5eeff]/80 backdrop-blur-md shadow-[0_12px_40px_rgba(74,64,224,0.08)]">
        <button onClick={onReset} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
          <span className="text-xl font-extrabold tracking-widest text-[#4F46E5] uppercase headline-font">StudySpark</span>
        </button>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-slate-500" aria-label="Notifications">notifications</button>
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-lg">person</span>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-[10px] uppercase">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              AI Analysis Complete
            </div>
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface capitalize">{data.topic}</h1>
            <p className="text-on-surface-variant text-sm">
              {data.flashcards.length} flashcards · {data.quiz.length} quiz questions · {data.mindMapData.children?.length ?? 0} mind map branches
            </p>
          </div>
          <button
            onClick={onReset}
            className="bg-surface-container-high text-primary px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            New Study Session
          </button>
        </header>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-10 p-1 bg-surface-container-low/80 backdrop-blur-md rounded-full w-fit sticky top-[88px] z-40">
          {tabs.map(tab => (
            <button
              key={tab}
              id={`tab-${tab.replace(' ', '-').toLowerCase()}`}
              onClick={() => handleTabChange(tab)}
              className={`${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'} px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 space-y-8">
            {activeTab === 'Summary' && (
              <SummaryPanel summary={data.summary} onCopy={handleCopySummary} />
            )}
            {activeTab === 'Flashcards' && (
              <FlashcardsPanel flashcards={data.flashcards} />
            )}
            {activeTab === 'Quiz' && (
              <QuizView quiz={data.quiz} key={String(quizKey)} />
            )}
            {activeTab === 'Mind Map' && (
              <section className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-8 bg-primary rounded-full" />
                  <h2 className="text-2xl font-bold font-headline text-on-surface">Concept Mind Map</h2>
                </div>
                <div className="overflow-x-auto py-4 flex justify-center">
                  <MindMapNode node={data.mindMapData} />
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-4 space-y-6 sticky top-[160px] h-fit">
            <div className="bg-gradient-to-br from-inverse-surface to-[#22174d] rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4">Study Material Ready</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: 'article', label: 'Summary', detail: '1 page' },
                  { icon: 'style', label: 'Flashcards', detail: `${data.flashcards.length} cards` },
                  { icon: 'quiz', label: 'Quiz', detail: `${data.quiz.length} questions` },
                  { icon: 'hub', label: 'Mind Map', detail: `${data.mindMapData.children?.length ?? 0} branches` },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleTabChange(item.label as Tab)}
                    className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity text-left"
                  >
                    <span className="material-symbols-outlined text-primary-container">{item.icon}</span>
                    <span>{item.label} · <span className="opacity-70">{item.detail}</span></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface mb-4">Study Workflow</h3>
              <ul className="space-y-3 text-sm text-on-surface-variant">
                {['Start with the Summary', 'Practice with Flashcards', 'Test yourself with the Quiz', 'Review the Mind Map connections'].map((tip, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-secondary-container rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary">psychology</span>
                <h3 className="text-sm font-bold text-on-secondary-container">Active Recall</h3>
              </div>
              <p className="text-xs text-on-secondary-container/80 leading-relaxed">
                Try to recall the answer before flipping a flashcard. This active retrieval technique can improve retention by 2–3×.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-white/80 backdrop-blur-md z-50 rounded-t-2xl shadow-[0_-8px_30px_rgba(74,64,224,0.05)]">
        <button onClick={onReset} className="flex flex-col items-center text-slate-400 px-5 py-2">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center bg-[#4F46E5] text-white rounded-full px-5 py-2">
          <span className="material-symbols-outlined">library_books</span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Study</span>
        </button>
      </nav>
    </>
  );
}
