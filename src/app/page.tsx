'use client';

import { useState } from 'react';
import Dashboard from './Dashboard';

type StudyData = {
  topic: string;
  summary: string;
  flashcards: { front: string; back: string }[];
  quiz: { question: string; options: string[]; answer: number }[];
  mindMapData: { name: string; children?: unknown[] };
};

export default function Home() {
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StudyData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic && !file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (topic) formData.append('topic', topic);
      if (file) formData.append('file', file);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study materials');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return <Dashboard data={result} onReset={() => setResult(null)} />;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f5eeff]/80 dark:bg-slate-900/80 backdrop-blur-md shadow-[0_12px_40px_rgba(74,64,224,0.08)]">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-widest text-[#4F46E5] uppercase headline-font">StudySpark</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="/" className="text-[#4F46E5] font-manrope font-bold tracking-tight text-sm hover:opacity-80 transition-opacity">Home</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-[#4F46E5]">notifications</button>
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden">
               <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32">
        <section className="relative px-6 max-w-7xl mx-auto py-16 md:py-32 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-bold tracking-widest uppercase mb-6">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                The Future of Learning
              </div>
              <h1 className="headline-font text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1] mb-8">
                Learn Faster, <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">Not Harder</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant mb-10 max-w-xl leading-relaxed">
                Transform your dense textbooks and lecture notes into interactive flashcards, concise summaries, and adaptive quizzes with StudySpark AI.
              </p>

              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xl border border-surface-container border-opacity-50">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Enter a Study Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Photosynthesis, World War 2"
                      className="w-full px-4 py-3 rounded-lg bg-surface-container-low border border-surface-container focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    />
                  </div>

                  <div className="text-center font-bold text-on-surface-variant text-sm">OR</div>

                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Upload a Document (PDF)</label>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary hover:file:text-white transition-colors"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  {/* Inline Error Banner */}
                  {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                      <span className="material-symbols-outlined text-red-500 text-base mt-0.5 flex-shrink-0">error</span>
                      <div>
                        <p className="font-bold mb-0.5">Generation Failed</p>
                        <p className="leading-relaxed">{error}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0"
                        aria-label="Dismiss error"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || (!topic && !file)}
                    className="mt-2 px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-[0_12px_40px_rgba(74,64,224,0.2)] hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Analysing &amp; Generating…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">bolt</span>
                        Generate Study Materials
                      </>
                    )}
                  </button>

                  {loading && (
                    <p className="text-center text-xs text-on-surface-variant animate-pulse">
                      This may take 10–20 seconds. Hang tight!
                    </p>
                  )}
                </form>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full"></div>
              <div className="relative bg-surface-container-lowest p-4 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-[400px] bg-gradient-to-br from-surface-container to-surface-container-highest rounded-2xl flex items-center justify-center">
                   <span className="material-symbols-outlined text-[120px] text-primary/40">school</span>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#32294f]">AI Processing Complete</p>
                    <p className="text-xs text-[#5f557f]">42 Flashcards generated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
