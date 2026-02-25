"use client";

import { useState } from "react";
import {
  Loader2,
  Newspaper,
  ArrowLeft,
  Send,
  Search,
  PenTool,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AgentStep = "idle" | "searching" | "writing" | "editing" | "done";

const stepConfig: Record<
  Exclude<AgentStep, "idle" | "done">,
  { icon: typeof Search; label: string; description: string }
> = {
  searching: {
    icon: Search,
    label: "Researching",
    description: "Searching the web for relevant sources...",
  },
  writing: {
    icon: PenTool,
    label: "Writing",
    description: "Drafting a structured article from research...",
  },
  editing: {
    icon: Sparkles,
    label: "Editing",
    description: "Polishing to professional journalism standards...",
  },
};

export default function DashboardPage() {
  const [topic, setTopic] = useState("");
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agentStep, setAgentStep] = useState<AgentStep>("idle");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;

    setLoading(true);
    setError("");
    setArticle("");
    setCopied(false);

    setAgentStep("searching");
    const timer1 = setTimeout(() => setAgentStep("writing"), 8000);
    const timer2 = setTimeout(() => setAgentStep("editing"), 20000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      setArticle(data.article);
      setAgentStep("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setAgentStep("idle");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/80">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                PressPilot
              </h1>
              <p className="text-[11px] text-gray-500 leading-tight">
                Dashboard
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Panel — Input & Status */}
          <div className="space-y-5">
            {/* Input Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                New Article
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Enter a topic and let the AI agent research, write, and edit.
              </p>
              <label htmlFor="topic" className="sr-only">
                Article Topic
              </label>
              <textarea
                id="topic"
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="e.g. The impact of AI on modern journalism"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none"
                disabled={loading}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Article
                  </>
                )}
              </button>
            </div>

            {/* Agent Pipeline Status */}
            {(loading || agentStep === "done") && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Agent Pipeline
                </h3>
                <div className="space-y-4">
                  {(
                    Object.keys(stepConfig) as Exclude<
                      AgentStep,
                      "idle" | "done"
                    >[]
                  ).map((step) => {
                    const config = stepConfig[step];
                    const Icon = config.icon;
                    const steps: AgentStep[] = [
                      "searching",
                      "writing",
                      "editing",
                    ];
                    const currentIdx = steps.indexOf(agentStep);
                    const stepIdx = steps.indexOf(step);
                    const isActive = agentStep === step;
                    const isComplete =
                      agentStep === "done" || currentIdx > stepIdx;

                    return (
                      <div key={step} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                            isComplete
                              ? "bg-green-100 text-green-600"
                              : isActive
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isActive && loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isComplete ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium transition-colors ${
                              isComplete
                                ? "text-green-700"
                                : isActive
                                ? "text-blue-700"
                                : "text-gray-400"
                            }`}
                          >
                            {config.label}
                          </p>
                          <p
                            className={`text-xs transition-colors ${
                              isActive
                                ? "text-blue-500"
                                : isComplete
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          >
                            {isComplete ? "Complete" : config.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Generation Failed
                  </p>
                  <p className="mt-1 text-xs text-red-600 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel — Article Output */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[500px]">
            {/* Article Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">
                {article ? "Generated Article" : "Article Preview"}
              </h2>
              {article && !loading && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Article Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {loading && !article && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    AI Agent is working...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    This typically takes 30–60 seconds.
                  </p>
                </div>
              )}

              {!article && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Newspaper className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">
                    No article yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter a topic and click Generate to get started.
                  </p>
                </div>
              )}

              {article && !loading && (
                <article className="prose prose-gray prose-headings:text-gray-900 prose-h1:text-2xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-semibold prose-h3:text-lg prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-gray-900 prose-blockquote:border-blue-300 prose-blockquote:text-gray-600 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
