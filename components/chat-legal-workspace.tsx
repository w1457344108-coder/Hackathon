"use client";

import { FormEvent, SVGProps, useMemo, useRef, useState } from "react";

type CoreModeId = "regulation" | "case" | "advisory";
type SupportedCountry = "China" | "Singapore" | "Japan" | "European Union" | "United States";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: CoreModeId;
}

interface ConversationItem {
  id: string;
  title: string;
  meta: string;
}

interface PromptPanelState {
  status: "loading" | "ready" | "error";
  suggestion?: string;
  error?: string;
}

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4";

const coreModes: Array<{
  id: CoreModeId;
  english: string;
  prompt: string;
}> = [
  {
    id: "regulation",
    english: "Regulation Interpretation",
    prompt: "Locate the relevant Pillar 6/7 legal text and explain what the rule means."
  },
  {
    id: "case",
    english: "Case Analysis",
    prompt: "Map an existing business scenario to legal evidence and compliance risks."
  },
  {
    id: "advisory",
    english: "Forward-looking Advisory",
    prompt: "Identify legal barriers, risk points, and compliance advice for a planned business."
  }
];

const historyItems: ConversationItem[] = [
  {
    id: "current",
    title: "Current Chat",
    meta: "In progress"
  },
  {
    id: "china-singapore",
    title: "China to Singapore Data Flow",
    meta: "Pillar 6 conditional flow"
  },
  {
    id: "eu-cloud",
    title: "EU Cloud Compliance Question",
    meta: "Regulation interpretation"
  },
  {
    id: "japan-market-entry",
    title: "Japan Market Entry Advisory",
    meta: "Forward-looking advisory"
  }
];

const starterMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Choose one of the three legal task types below, then enter your question. I will structure the answer around evidence, legal reasoning, and compliance impact."
  }
];

export function ChatLegalWorkspace() {
  const [activeMode, setActiveMode] = useState<CoreModeId>("regulation");
  const activeModeRef = useRef<CoreModeId>("regulation");
  const [activeConversation, setActiveConversation] = useState("current");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasConversation = messages.length > 1;

  const mode = useMemo(
    () => coreModes.find((item) => item.id === activeMode) ?? coreModes[0],
    [activeMode]
  );

  function handleModeChange(nextMode: CoreModeId) {
    activeModeRef.current = nextMode;
    setActiveMode(nextMode);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = inputValue.trim();

    if (!trimmed || isSubmitting) {
      return;
    }

    const selectedMode = activeModeRef.current;
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        content: trimmed,
        mode: selectedMode
      },
      {
        id: assistantMessageId,
        role: "assistant",
        mode: selectedMode,
        content: "Running the multi-agent legal analysis..."
      }
    ]);
    setInputValue("");
    setIsSubmitting(true);

    try {
      const result = await runBackendAnalysis(trimmed, selectedMode);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: formatBackendAnswer(result, selectedMode)
              }
            : message
        )
      );
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? `The backend analysis could not complete: ${error.message}`
                    : "The backend analysis could not complete."
              }
            : message
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen overflow-hidden bg-white text-black">
      <ConversationSidebar
        activeConversation={activeConversation}
        onConversationChange={setActiveConversation}
        onNewChat={() => {
          setMessages(starterMessages);
          setActiveConversation("current");
          setInputValue("");
          handleModeChange("regulation");
        }}
      />

      <section className={`relative min-w-0 flex-1 overflow-hidden ${hasConversation ? "bg-white" : "bg-[#f8f8f8]"}`}>
        {!hasConversation ? (
          <>
            <VideoBackground />
            <div className="absolute inset-0 bg-white/48" aria-hidden="true" />
          </>
        ) : null}

        <div
          className={`relative z-10 flex min-h-screen flex-col ${
            hasConversation ? "bg-white px-6 py-4 lg:px-[72px]" : "px-6 py-4 lg:px-[120px]"
          }`}
        >
          <Navigation />

          {hasConversation ? (
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="mx-auto min-h-0 w-full max-w-[860px] flex-1 overflow-y-auto py-8">
                <ConversationMessages messages={messages.slice(1)} />
              </div>

              <div className="border-t border-black/10 bg-white py-4">
                <div className="mx-auto w-full max-w-[860px]">
                  <SearchComposer
                    activeMode={activeMode}
                    inputValue={inputValue}
                    modePrompt={mode.prompt}
                    surface="chat"
                    onModeChange={handleModeChange}
                    onInputChange={setInputValue}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                  />
                </div>
              </div>
            </section>
          ) : (
            <section className="-mt-[50px] flex flex-1 flex-col items-center justify-center pt-[60px] text-center">
              <div className="flex flex-col items-center">
                <h1 className="max-w-[980px] text-center font-fustat text-5xl font-bold leading-none tracking-[-2.6px] text-black md:text-[80px] md:tracking-[-4.8px]">
                  What kind of cross-border data law question should we analyze today?
                </h1>
              </div>

              <div className="mt-[44px] w-full max-w-[728px]">
                <SearchComposer
                  activeMode={activeMode}
                  inputValue={inputValue}
                  modePrompt={mode.prompt}
                  surface="hero"
                  onModeChange={handleModeChange}
                  onInputChange={setInputValue}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                />
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function ConversationSidebar({
  activeConversation,
  onConversationChange,
  onNewChat
}: {
  activeConversation: string;
  onConversationChange: (conversationId: string) => void;
  onNewChat: () => void;
}) {
  return (
    <aside className="flex w-[108px] shrink-0 flex-col border-r border-[#242424] bg-[#171717] font-schibsted text-white sm:w-[250px] lg:w-[292px]">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-2 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Legal</p>
          <p className="hidden truncate text-xs text-white/55 sm:block">Pillar 6/7 Workspace</p>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lg leading-none text-white/80 hover:bg-white/10"
          aria-label="Create chat"
          onClick={onNewChat}
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-3">
        <p className="px-2 text-xs font-medium text-white/45">Chats</p>
        <nav className="mt-2 space-y-1">
          {historyItems.map((item) => {
            const isActive = item.id === activeConversation;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onConversationChange(item.id)}
                className={`w-full rounded-lg px-2 py-2 text-left transition sm:px-3 ${
                  isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <span className="block truncate text-xs sm:text-sm">{item.title}</span>
                <span className="mt-0.5 hidden truncate text-xs text-white/40 sm:block">
                  {item.meta}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-2 sm:p-3">
        <button
          type="button"
          className="w-full rounded-lg px-2 py-2 text-left text-xs text-white/70 hover:bg-white/10 sm:px-3 sm:text-sm"
        >
          Settings
        </button>
      </div>
    </aside>
  );
}

function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  function cancelFade() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function fadeTo(targetOpacity: number, duration = 250) {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    cancelFade();

    const startOpacity = Number.parseFloat(video.style.opacity || "0");
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const nextOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
      video.style.opacity = String(nextOpacity);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }

  function handleLoadedData() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.style.opacity = "0";
    fadingOutRef.current = false;
    fadeTo(1);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;

    if (!video || !Number.isFinite(video.duration)) {
      return;
    }

    const remaining = video.duration - video.currentTime;

    if (remaining <= 0.55 && !fadingOutRef.current) {
      fadingOutRef.current = true;
      fadeTo(0);
    }
  }

  function handleEnded() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    cancelFade();
    video.style.opacity = "0";

    window.setTimeout(() => {
      video.currentTime = 0;
      fadingOutRef.current = false;
      void video.play();
      fadeTo(1);
    }, 100);
  }

  return (
    <video
      ref={videoRef}
      className="absolute left-1/2 top-0 h-[115%] w-[115%] -translate-x-1/2 object-cover object-top opacity-0"
      src={VIDEO_URL}
      muted
      playsInline
      autoPlay
      preload="auto"
      onLoadedData={handleLoadedData}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      aria-hidden="true"
    />
  );
}

function Navigation() {
  return (
    <nav className="flex items-center justify-between py-4 font-schibsted">
      <a href="#" className="text-[24px] font-semibold tracking-[-1.44px] text-black">
        Cross-Border Data Policy Assistant
      </a>

      <div aria-hidden="true" className="h-11 w-[101px]" />
    </nav>
  );
}

function SearchComposer({
  activeMode,
  inputValue,
  modePrompt,
  surface,
  isSubmitting,
  onModeChange,
  onInputChange,
  onSubmit
}: {
  activeMode: CoreModeId;
  inputValue: string;
  modePrompt: string;
  surface: "hero" | "chat";
  isSubmitting: boolean;
  onModeChange: (mode: CoreModeId) => void;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isHero = surface === "hero";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [attachFeedback, setAttachFeedback] = useState(false);
  const [promptFeedback, setPromptFeedback] = useState(false);
  const [promptPanel, setPromptPanel] = useState<PromptPanelState | null>(null);

  function triggerAttachFeedback() {
    setAttachFeedback(true);
    window.setTimeout(() => setAttachFeedback(false), 420);
  }

  function triggerPromptFeedback() {
    setPromptFeedback(true);
    window.setTimeout(() => setPromptFeedback(false), 420);
  }

  function isSupportedFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return ["pdf", "doc", "docx"].includes(extension ?? "");
  }

  function handleSelectedFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!isSupportedFile(file)) {
      setSelectedFileName(null);
      setFileError("Only PDF and Word files are supported.");
      return;
    }

    setSelectedFileName(file.name);
    setFileError(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleSelectedFile(event.target.files?.[0] ?? null);
    triggerAttachFeedback();
  }

  function handleAttachClick() {
    triggerAttachFeedback();
    fileInputRef.current?.click();
  }

  function handleDragEnter(event: React.DragEvent<HTMLFormElement>) {
    event.preventDefault();
    if (event.dataTransfer.types.includes("Files")) {
      dragDepthRef.current += 1;
      setIsDraggingFile(true);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleDragLeave(event: React.DragEvent<HTMLFormElement>) {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingFile(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLFormElement>) {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFile(false);
    handleSelectedFile(event.dataTransfer.files?.[0] ?? null);
    triggerAttachFeedback();
  }

  async function handlePromptClick() {
    const trimmed = inputValue.trim();

    if (!trimmed || promptPanel?.status === "loading") {
      return;
    }

    triggerPromptFeedback();
    setPromptPanel({ status: "loading" });

    try {
      const suggestion = await runQueryBuilderSuggestion(trimmed, activeMode);
      setPromptPanel({ status: "ready", suggestion });
    } catch (error) {
      setPromptPanel({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Query Builder could not optimize this prompt."
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative min-h-[200px] rounded-[18px] p-3 text-left ${
        isHero
          ? "bg-black/25 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl"
          : "border border-black/10 bg-white shadow-[0_14px_42px_rgba(0,0,0,0.08)]"
      } ${isDraggingFile ? "ring-2 ring-black/65 ring-offset-2 ring-offset-white" : ""}`}
    >
      {isDraggingFile ? (
        <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-[14px] border border-dashed border-black/40 bg-white/88 font-schibsted text-[14px] font-semibold text-black shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-md">
          Drop PDF or Word file here
        </div>
      ) : null}

      <div
        className={`flex items-center justify-end px-1 pb-2 font-schibsted text-[12px] font-medium ${
          isHero ? "text-white" : "text-black"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <AISparkleIcon className="h-4 w-4" />
          <span>Powered by GPT-4o</span>
        </div>
      </div>

      <div className="rounded-[12px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
        <label htmlFor="legal-chat-input" className="sr-only">
          Type question
        </label>
        <div className="flex min-h-[92px] items-start gap-3 px-4 py-4">
          <textarea
            id="legal-chat-input"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Type question..."
            rows={3}
            maxLength={3000}
            className="min-h-[58px] flex-1 resize-none border-0 bg-transparent font-schibsted text-[16px] font-medium leading-6 text-black outline-none placeholder:text-black/60"
          />
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white disabled:bg-black/25"
            disabled={!inputValue.trim() || isSubmitting}
            aria-label="Submit question"
          >
            <UpArrowIcon className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col gap-3 border-t border-black/10 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <UtilityButton
              icon={<PaperclipIcon className="h-4 w-4" />}
              label="Attach"
              onClick={handleAttachClick}
              isFeedbackActive={attachFeedback}
            />
            <UtilityButton
              icon={<SearchIcon className="h-4 w-4" />}
              label={promptPanel?.status === "loading" ? "Building..." : "Prompts"}
              onClick={handlePromptClick}
              disabled={!inputValue.trim() || promptPanel?.status === "loading"}
              isFeedbackActive={promptFeedback || promptPanel?.status === "loading"}
            />
            {selectedFileName ? (
              <span className="truncate rounded-md bg-black/5 px-2 py-1 font-schibsted text-[12px] font-medium text-black/60">
                {selectedFileName}
              </span>
            ) : null}
            {fileError ? (
              <span className="truncate rounded-md bg-red-50 px-2 py-1 font-schibsted text-[12px] font-medium text-red-700">
                {fileError}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {promptPanel ? (
        <PromptOptimizerPanel
          panel={promptPanel}
          onClose={() => setPromptPanel(null)}
          onUseSuggestion={(suggestion) => {
            onInputChange(suggestion);
            setPromptPanel(null);
          }}
        />
      ) : null}

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {coreModes.map((item) => {
          const isActive = item.id === activeMode;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              className={`rounded-md px-3 py-2 text-left font-schibsted text-[14px] font-semibold transition ${
                isActive ? "bg-black text-white" : "bg-[#f8f8f8] text-black"
              }`}
              title={item.prompt}
            >
              {item.english}
            </button>
          );
        })}
      </div>

      <p
        className={`mt-2 truncate px-1 font-schibsted text-[12px] font-medium ${
          isHero ? "text-white/85" : "text-black/55"
        }`}
      >
        {modePrompt}
      </p>
    </form>
  );
}

function PromptOptimizerPanel({
  panel,
  onClose,
  onUseSuggestion
}: {
  panel: PromptPanelState;
  onClose: () => void;
  onUseSuggestion: (suggestion: string) => void;
}) {
  return (
    <aside className="fixed right-5 top-28 z-50 w-[320px] rounded-2xl border border-black/10 bg-white p-4 text-left font-schibsted shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-black/45">
            Query Builder
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.3px] text-black">
            Optimize this input?
          </h2>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-[18px] leading-none text-black/60 hover:bg-black/10"
          aria-label="Close prompt optimizer"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="mt-4 max-h-[260px] overflow-y-auto rounded-xl bg-[#f8f8f8] p-3 text-[13px] leading-6 text-black/72">
        {panel.status === "loading" ? (
          "Query Builder is refining the prompt..."
        ) : panel.status === "error" ? (
          panel.error
        ) : (
          <pre className="whitespace-pre-wrap font-schibsted">{panel.suggestion}</pre>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-full px-4 py-2 text-[13px] font-medium text-black/60 hover:bg-black/5"
          onClick={onClose}
        >
          Keep original
        </button>
        <button
          type="button"
          className="rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white disabled:bg-black/25"
          disabled={panel.status !== "ready" || !panel.suggestion}
          onClick={() => {
            if (panel.suggestion) {
              onUseSuggestion(panel.suggestion);
            }
          }}
        >
          Use suggestion
        </button>
      </div>
    </aside>
  );
}

function UtilityButton({
  icon,
  label,
  onClick,
  disabled,
  isFeedbackActive = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  isFeedbackActive?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#f8f8f8] px-3 py-2 font-schibsted text-[12px] font-medium text-black shadow-none transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:text-black/35 ${
        isFeedbackActive
          ? "scale-[0.97] bg-black text-white shadow-[0_0_0_4px_rgba(0,0,0,0.12)]"
          : "hover:bg-white hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function ConversationMessages({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-6 font-schibsted">
      {messages.map((message) => {
        const modeLabel = message.mode
          ? coreModes.find((item) => item.id === message.mode)?.english
          : null;

        if (message.role === "user") {
          return (
            <article key={message.id} className="flex justify-end">
              <div className="max-w-[78%] rounded-[18px] bg-[#f2f2f2] px-5 py-3 text-[15px] leading-7 text-black">
                {message.content}
              </div>
            </article>
          );
        }

        return (
          <article key={message.id} className="max-w-[760px]">
            {modeLabel ? (
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/40">
                {modeLabel}
              </p>
            ) : null}
            <div className="rounded-[18px] border border-black/10 bg-white px-5 py-4 text-[15px] leading-7 text-black shadow-[0_12px_34px_rgba(0,0,0,0.05)]">
              {message.content}
            </div>
          </article>
        );
      })}
    </div>
  );
}

interface BackendWorkflowResult {
  analysisRunId?: string | null;
  providerId?: string;
  providerModel?: string | null;
  evidenceSourceMode?: "real" | "mock" | "hybrid";
  report?: {
    finalNarrative?: string;
    overallRisk?: string;
  };
  evidenceRecords?: Array<{
    citation?: string;
    lawTitle?: string;
    sourceUrl?: string;
  }>;
  supportingAgentResults?: {
    queryBuilder?: {
      data?: QueryBuilderData | null;
    };
    legalReviewExport?: {
      data?: {
        exportReadiness?: string;
      } | null;
    };
  };
  research?: {
    sourceBasis?: string[];
  };
}

interface QueryBuilderData {
  originalQuestion?: string;
  normalizedIntent?: string;
  reformulatedQuestion?: string;
  optimizedPrompt?: string;
  lawStudentTerms?: string;
  aiGeneratedTerms?: string[];
  targetIndicators?: string[];
  sourcePriorityOrder?: string[];
  searchQueries?: string[];
  queryPlan?: Array<{
    query?: string;
    queryText?: string;
    searchQuery?: string;
    indicatorLabel?: string;
    targetIndicator?: string;
    indicatorCode?: string;
    targetSourceType?: string;
    sourceType?: string;
  }>;
}

const supportedCountries: SupportedCountry[] = [
  "China",
  "Singapore",
  "Japan",
  "European Union",
  "United States"
];

function inferCountries(question: string): {
  countryA: SupportedCountry;
  countryB: SupportedCountry | null;
} {
  const lowerQuestion = question.toLowerCase();
  const matchedCountries = supportedCountries.filter((country) =>
    lowerQuestion.includes(country.toLowerCase())
  );

  return {
    countryA: matchedCountries[0] ?? "China",
    countryB: matchedCountries[1] ?? null
  };
}

function getScenarioLabel(mode: CoreModeId) {
  if (mode === "regulation") {
    return "regulation interpretation";
  }

  if (mode === "case") {
    return "case analysis";
  }

  return "forward-looking advisory";
}

async function runBackendAnalysis(question: string, mode: CoreModeId) {
  const countries = inferCountries(question);
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...countries,
      businessScenario: getScenarioLabel(mode),
      userQuery: question
    })
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}.`);
  }

  const streamText = await response.text();
  const doneMatch = streamText.match(/event: done\ndata: (.+)\n/);
  const errorMatch = streamText.match(/event: error\ndata: (.+)\n/);

  if (errorMatch) {
    const payload = JSON.parse(errorMatch[1]) as { message?: string };
    throw new Error(payload.message ?? "The analysis API returned an error.");
  }

  if (!doneMatch) {
    throw new Error("The analysis API returned no completed workflow payload.");
  }

  return JSON.parse(doneMatch[1]) as BackendWorkflowResult;
}

async function runQueryBuilderSuggestion(question: string, mode: CoreModeId) {
  const result = await runBackendAnalysis(question, mode);
  return formatQueryBuilderSuggestion(result, question, mode);
}

function formatQueryBuilderSuggestion(
  result: BackendWorkflowResult,
  question: string,
  mode: CoreModeId
) {
  const queryBuilder = result.supportingAgentResults?.queryBuilder?.data;
  const planLines =
    queryBuilder?.queryPlan
      ?.map((item) => {
        const query = item.query ?? item.queryText ?? item.searchQuery;
        const target =
          item.indicatorLabel ??
          item.targetIndicator ??
          item.indicatorCode ??
          item.targetSourceType ??
          item.sourceType;
        return [query, target ? `target: ${target}` : null].filter(Boolean).join(" | ");
      })
      .filter(Boolean) ?? [];

  const sourceTerms = [
    queryBuilder?.optimizedPrompt,
    queryBuilder?.normalizedIntent,
    queryBuilder?.reformulatedQuestion,
    queryBuilder?.lawStudentTerms,
    ...(queryBuilder?.aiGeneratedTerms ?? []),
    ...(queryBuilder?.targetIndicators ?? []),
    ...(queryBuilder?.sourcePriorityOrder ?? []),
    ...(queryBuilder?.searchQueries ?? []),
    ...planLines
  ].filter(Boolean);

  if (sourceTerms.length) {
    return [
      queryBuilder?.optimizedPrompt ?? queryBuilder?.reformulatedQuestion ?? question,
      "",
      "Query Builder focus:",
      ...sourceTerms
        .filter((term, index, terms) => terms.indexOf(term) === index)
        .slice(0, 8)
        .map((term) => `- ${term}`)
    ].join("\n");
  }

  return [
    `Please handle this as a ${getScenarioLabel(mode)} task under Pillar 6/7:`,
    question,
    "",
    "Query Builder focus:",
    "- Identify the jurisdiction, data-flow direction, actors, data category, and business purpose.",
    "- Search for authoritative legal evidence and cite the source basis.",
    "- Translate the evidence into compliance risks, legal reasoning, and practical next steps."
  ].join("\n");
}

function formatBackendAnswer(result: BackendWorkflowResult, mode: CoreModeId) {
  const narrative =
    result.report?.finalNarrative ??
    "The workflow completed, but no final narrative was returned.";
  const risk = result.report?.overallRisk ? `Overall risk: ${result.report.overallRisk}.` : null;
  const provider = result.providerId
    ? `Provider: ${result.providerId}${result.providerModel ? ` (${result.providerModel})` : ""}.`
    : null;
  const evidenceMode = result.evidenceSourceMode
    ? `Evidence mode: ${result.evidenceSourceMode}.`
    : null;
  const exportReadiness =
    result.supportingAgentResults?.legalReviewExport?.data?.exportReadiness ?? null;
  const citations = (result.evidenceRecords ?? [])
    .slice(0, 3)
    .map((record) => record.citation || record.lawTitle || record.sourceUrl)
    .filter(Boolean);
  const sourceBasis = result.research?.sourceBasis?.slice(0, 2) ?? [];

  return [
    `${coreModes.find((item) => item.id === mode)?.english ?? "Legal analysis"} result:`,
    narrative,
    risk,
    provider,
    evidenceMode,
    exportReadiness ? `Export readiness: ${exportReadiness}.` : null,
    citations.length ? `Key citations: ${citations.join(" | ")}` : null,
    sourceBasis.length ? `Source basis: ${sourceBasis.join(" | ")}` : null,
    result.analysisRunId ? `Review run ID: ${result.analysisRunId}` : null
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPlaceholderAnswer(mode: CoreModeId) {
  if (mode === "regulation") {
    return "Regulation Interpretation mode is selected. The next step will locate relevant Pillar 6/7 legal text, extract citations, and explain the rule in plain legal reasoning.";
  }

  if (mode === "case") {
    return "Case Analysis mode is selected. The next step will break the business facts into data type, flow, actor, and purpose, then match them to legal evidence and compliance risks.";
  }

  return "Forward-looking Advisory mode is selected. The next step will identify target-country barriers, likely data-flow risks, and practical compliance actions for the planned business.";
}

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M4 6.25L8 10.25L12 6.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UpArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 12.5V3.5M8 3.5L4.5 7M8 3.5L11.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 1.75L9.67 6.12L14.25 8L9.67 9.88L8 14.25L6.33 9.88L1.75 8L6.33 6.12L8 1.75Z" fill="currentColor" />
    </svg>
  );
}

function AISparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <path d="M8.7 1.5L10.1 6.25L14.8 7.65L10.1 9.05L8.7 13.8L7.3 9.05L2.6 7.65L7.3 6.25L8.7 1.5Z" fill="currentColor" />
      <path d="M14.1 11.35L14.72 13.05L16.5 13.65L14.72 14.25L14.1 15.95L13.5 14.25L11.75 13.65L13.5 13.05L14.1 11.35Z" fill="currentColor" />
    </svg>
  );
}

function PaperclipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M6.1 8.8L9.9 5C10.75 4.15 12.1 4.15 12.95 5C13.8 5.85 13.8 7.2 12.95 8.05L7.7 13.3C6.35 14.65 4.15 14.65 2.8 13.3C1.45 11.95 1.45 9.75 2.8 8.4L8.2 3C9.95 1.25 12.8 1.25 14.55 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M7.2 12.4C10.07 12.4 12.4 10.07 12.4 7.2C12.4 4.33 10.07 2 7.2 2C4.33 2 2 4.33 2 7.2C2 10.07 4.33 12.4 7.2 12.4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.1 11.1L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
