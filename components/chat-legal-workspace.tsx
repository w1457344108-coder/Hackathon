"use client";

import { FormEvent, SVGProps, useMemo, useRef, useState } from "react";
import {
  ChatAnalysisPanels,
  type ChatAnalysisResult
} from "@/components/chat-analysis-panels";
import { formatEvidenceSnippetForDisplay } from "@/lib/evidence-display";
import {
  detectUnsupportedJurisdictions,
  supportedCountries
} from "@/lib/jurisdiction-inference";

type CoreModeId = "regulation" | "case" | "advisory";
type SupportedCountry = "China" | "Singapore" | "Japan" | "European Union" | "United States";
type CountrySelection = {
  countryA: SupportedCountry;
  countryB: SupportedCountry | null;
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: CoreModeId;
  status?: "loading" | "complete";
  analysis?: ChatAnalysisResult;
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

const MAX_UPLOAD_FILES = 3;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const countryOptions = supportedCountries as SupportedCountry[];

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [countryA, setCountryA] = useState<SupportedCountry>("China");
  const [countryB, setCountryB] = useState<SupportedCountry | null>("Singapore");
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
    const selectedFiles = uploadedFiles;
    const selectedCountries = {
      countryA,
      countryB: countryB && countryB !== countryA ? countryB : null
    };
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    if (!isLegalScopedQuestion(trimmed, selectedFiles)) {
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
          content: buildOutOfScopeGuidance(selectedMode),
          status: "complete"
        }
      ]);
      setInputValue("");
      return;
    }

    const unsupportedJurisdictions = detectUnsupportedJurisdictions(trimmed);

    if (unsupportedJurisdictions.length > 0) {
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
          content: buildUnsupportedJurisdictionGuidance(unsupportedJurisdictions),
          status: "complete"
        }
      ]);
      setInputValue("");
      return;
    }

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
        content: "Running the multi-agent legal analysis...",
        status: "loading"
      }
    ]);
    setInputValue("");
    setUploadedFiles([]);
    setIsSubmitting(true);

    try {
      const result = await runBackendAnalysis(trimmed, selectedMode, selectedFiles, selectedCountries);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                analysis: result,
                content: formatBackendAnswer(result, selectedMode),
                status: "complete"
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
                    : "The backend analysis could not complete.",
                status: "complete"
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
          setUploadedFiles([]);
          setCountryA("China");
          setCountryB("Singapore");
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
                    uploadedFiles={uploadedFiles}
                    onUploadedFilesChange={setUploadedFiles}
                    countryA={countryA}
                    countryB={countryB}
                    onCountryAChange={(nextCountry) => {
                      setCountryA(nextCountry);
                      if (countryB === nextCountry) {
                        setCountryB(null);
                      }
                    }}
                    onCountryBChange={setCountryB}
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
                  uploadedFiles={uploadedFiles}
                  onUploadedFilesChange={setUploadedFiles}
                  countryA={countryA}
                  countryB={countryB}
                  onCountryAChange={(nextCountry) => {
                    setCountryA(nextCountry);
                    if (countryB === nextCountry) {
                      setCountryB(null);
                    }
                  }}
                  onCountryBChange={setCountryB}
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
  uploadedFiles,
  onUploadedFilesChange,
  countryA,
  countryB,
  onCountryAChange,
  onCountryBChange,
  onSubmit
}: {
  activeMode: CoreModeId;
  inputValue: string;
  modePrompt: string;
  surface: "hero" | "chat";
  isSubmitting: boolean;
  onModeChange: (mode: CoreModeId) => void;
  onInputChange: (value: string) => void;
  uploadedFiles: File[];
  onUploadedFilesChange: (files: File[]) => void;
  countryA: SupportedCountry;
  countryB: SupportedCountry | null;
  onCountryAChange: (country: SupportedCountry) => void;
  onCountryBChange: (country: SupportedCountry | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isHero = surface === "hero";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
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
    return ["pdf", "docx"].includes(extension ?? "");
  }

  function handleSelectedFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    if (uploadedFiles.length + files.length > MAX_UPLOAD_FILES) {
      setFileError(`Upload at most ${MAX_UPLOAD_FILES} files at once.`);
      return;
    }

    const invalidDoc = files.find((file) => file.name.split(".").pop()?.toLowerCase() === "doc");
    if (invalidDoc) {
      setFileError(`${invalidDoc.name} is an old Word DOC file. Please upload a DOCX file.`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversizedFile) {
      setFileError(`${oversizedFile.name} is larger than the 20MB upload limit.`);
      return;
    }

    const unsupportedFile = files.find((file) => !isSupportedFile(file));
    if (unsupportedFile) {
      setFileError(`${unsupportedFile.name} is not supported. Upload PDF or DOCX files.`);
      return;
    }

    const nextFiles = [...uploadedFiles, ...files].slice(0, MAX_UPLOAD_FILES);
    onUploadedFilesChange(nextFiles);
    setFileError(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleSelectedFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
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
    handleSelectedFiles(Array.from(event.dataTransfer.files ?? []));
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
      const suggestion = await runQueryBuilderSuggestion(trimmed, activeMode, {
        countryA,
        countryB: countryB && countryB !== countryA ? countryB : null
      });
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
          <span>Powered by DeepSeek</span>
        </div>
      </div>

      <div className="mb-2 grid gap-2 sm:grid-cols-2">
        <CountryPicker
          label="Country A"
          value={countryA}
          options={countryOptions}
          onChange={(nextCountry) => {
            if (nextCountry) {
              onCountryAChange(nextCountry);
            }
          }}
          isHero={isHero}
        />
        <CountryPicker
          label="Country B"
          value={countryB}
          options={countryOptions.filter((country) => country !== countryA)}
          onChange={onCountryBChange}
          isHero={isHero}
          allowEmpty
        />
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
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
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
          multiple
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
            {uploadedFiles.map((file) => (
              <span
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-md bg-black/5 px-2 py-1 font-schibsted text-[12px] font-medium text-black/60"
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  className="text-black/45 hover:text-black"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    onUploadedFilesChange(
                      uploadedFiles.filter((item) => item !== file)
                    )
                  }
                >
                  x
                </button>
              </span>
            ))}
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

function CountryPicker({
  label,
  value,
  options,
  onChange,
  isHero,
  allowEmpty = false
}: {
  label: string;
  value: SupportedCountry | null;
  options: SupportedCountry[];
  onChange: (country: SupportedCountry | null) => void;
  isHero: boolean;
  allowEmpty?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2 font-schibsted text-[12px] font-semibold shadow-sm ${
        isHero
          ? "border-white/20 bg-white/12 text-white backdrop-blur-md"
          : "border-black/10 bg-[#f8f8f8] text-black"
      }`}
    >
      <span className={isHero ? "text-white/72" : "text-black/50"}>{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value ? (event.target.value as SupportedCountry) : null)
        }
        className={`min-w-0 flex-1 appearance-none bg-transparent text-right outline-none ${
          isHero ? "text-white" : "text-black"
        }`}
        aria-label={label}
      >
        {allowEmpty ? <option value="">No second country</option> : null}
        {options.map((country) => (
          <option key={`${label}-${country}`} value={country} className="text-black">
            {country}
          </option>
        ))}
      </select>
    </label>
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
                <FormattedMessageContent content={message.content} />
              </div>
            </article>
          );
        }

        if (message.status === "loading") {
          return <AnalysisLoadingMessage key={message.id} modeLabel={modeLabel} />;
        }

        return (
          <article key={message.id} className="max-w-[760px]">
            {modeLabel ? (
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/40">
                {modeLabel}
              </p>
            ) : null}
            <div className="rounded-[18px] border border-black/10 bg-white px-5 py-4 text-[15px] leading-7 text-black shadow-[0_12px_34px_rgba(0,0,0,0.05)]">
              <FormattedMessageContent content={message.content} />
            </div>
            {message.analysis ? (
              <ChatAnalysisPanels result={message.analysis} modeLabel={modeLabel} />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function FormattedMessageContent({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function AnalysisLoadingMessage({ modeLabel }: { modeLabel: string | null | undefined }) {
  return (
    <article className="max-w-[760px]">
      {modeLabel ? (
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/40">
          {modeLabel}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-[18px] border border-black/10 bg-white px-5 py-4 text-[15px] leading-7 text-black shadow-[0_12px_34px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <AISparkleIcon className="h-4 w-4 animate-pulse" />
            <span className="absolute inset-0 rounded-full border border-black/20 animate-ping" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold tracking-[-0.2px]">Multi-agent legal workflow is running</p>
            <p className="text-[13px] leading-5 text-black/55">
              The backend is preparing evidence retrieval, legal reasoning, and compliance synthesis.
            </p>
          </div>
          <div className="flex items-center gap-1" aria-hidden="true">
            <span className="h-2 w-2 animate-bounce rounded-full bg-black [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-black [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-black" />
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/5">
          <div className="h-full w-full animate-pulse rounded-full bg-black/70" />
        </div>
      </div>
    </article>
  );
}

interface BackendWorkflowResult extends ChatAnalysisResult {
  report?: {
    finalNarrative?: string;
    overallRisk?: string;
  };
  mainlineAgentResults?: {
    legalReasoner?: {
      data?: {
        legalFindings?: Array<{
          conclusion?: string;
          legalEffect?: string;
          evidenceIds?: string[];
          jurisdiction?: string;
        }>;
      } | null;
    };
  };
  supportingAgentResults?: ChatAnalysisResult["supportingAgentResults"] & {
    queryBuilder?: {
      data?: QueryBuilderData | null;
    };
    legalReviewExport?: {
      data?: {
        exportReadiness?: string;
        exportJson?: Record<string, unknown>;
        exportCsvRows?: Array<Record<string, string | number>>;
        exportMarkdown?: string;
        judgeSummary?: string;
      } | null;
    };
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

const legalScopeKeywords = [
  "law",
  "legal",
  "regulation",
  "regulatory",
  "compliance",
  "policy",
  "privacy",
  "data",
  "cross-border",
  "transfer",
  "jurisdiction",
  "risk",
  "pillar",
  "rdtii",
  "gdpr",
  "china",
  "singapore",
  "japan",
  "european union",
  "eu",
  "united states",
  "contract",
  "localization",
  "security assessment",
  "\u6cd5\u5f8b",
  "\u6cd5\u89c4",
  "\u5408\u89c4",
  "\u653f\u7b56",
  "\u9690\u79c1",
  "\u6570\u636e",
  "\u8de8\u5883",
  "\u4f20\u8f93",
  "\u76d1\u7ba1",
  "\u98ce\u9669",
  "\u6761\u6587",
  "\u6848\u4f8b",
  "\u54a8\u8be2"
];

function getScenarioLabel(mode: CoreModeId) {
  if (mode === "regulation") {
    return "regulation interpretation";
  }

  if (mode === "case") {
    return "case analysis";
  }

  return "forward-looking advisory";
}

function isLegalScopedQuestion(question: string, files: File[]) {
  if (files.length) {
    return true;
  }

  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.length < 6) {
    return false;
  }

  return legalScopeKeywords.some((keyword) =>
    normalizedQuestion.includes(keyword.toLowerCase())
  );
}

function buildOutOfScopeGuidance(mode: CoreModeId) {
  const modeName = coreModes.find((item) => item.id === mode)?.english ?? "legal analysis";

  return [
    `This workspace is focused on ${modeName} for cross-border data law and Pillar 6/7 compliance.`,
    "Please ask a legal or compliance question, such as which rule applies to a data transfer, what risks a business scenario creates, or what barriers a planned market entry may face."
  ].join("\n\n");
}

function buildUnsupportedJurisdictionGuidance(jurisdictions: string[]) {
  return [
    `This prototype cannot yet analyze ${jurisdictions.join(", ")} with real competition-designated evidence.`,
    `Current supported jurisdictions are ${supportedCountries.join(", ")}.`,
    "Please ask about one of the supported jurisdictions, or expand the source registry and row-level legal pipeline before using this workspace for additional countries."
  ].join("\n\n");
}

async function runBackendAnalysis(
  question: string,
  mode: CoreModeId,
  files: File[] = [],
  countries: CountrySelection = { countryA: "China", countryB: "Singapore" }
) {
  const requestInit: RequestInit = files.length
    ? {
        method: "POST",
        body: (() => {
          const formData = new FormData();
          formData.set("countryA", countries.countryA);

          if (countries.countryB) {
            formData.set("countryB", countries.countryB);
          }

          formData.set("businessScenario", getScenarioLabel(mode));
          formData.set("userQuery", question);
          files.forEach((file) => formData.append("files", file));
          return formData;
        })()
      }
    : {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...countries,
          businessScenario: getScenarioLabel(mode),
          userQuery: question
        })
      };

  const response = await fetch("/api/analyze", requestInit);

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

async function runQueryBuilderSuggestion(
  question: string,
  mode: CoreModeId,
  countries: CountrySelection = { countryA: "China", countryB: "Singapore" }
) {
  const result = await runBackendAnalysis(question, mode, [], countries);
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
  const uploadedDocuments = result.input?.uploadedDocuments ?? [];
  const citations = (result.evidenceRecords ?? [])
    .slice(0, 3)
    .map((record) => record.citation || record.lawTitle || record.sourceUrl)
    .filter(Boolean);
  const sourceBasis = result.research?.sourceBasis?.slice(0, 2) ?? [];
  const legalFindings = result.mainlineAgentResults?.legalReasoner?.data?.legalFindings ?? [];
  const findingHighlights = legalFindings.slice(0, 2).map((finding, index) => {
    return [
      `- Finding ${index + 1}: ${finding.conclusion ?? "No conclusion returned."}`,
      finding.legalEffect ? `  Effect: ${finding.legalEffect}` : null
    ]
      .filter(Boolean)
      .join("\n");
  });
  const evidenceHighlights = (result.evidenceRecords ?? []).slice(0, 2).map((record, index) => {
    return [
      `- Evidence ${index + 1}: ${record.lawTitle}`,
      record.sourceLocator ? `  Locator: ${record.sourceLocator}` : null,
      record.verbatimSnippet
        ? `  Excerpt:\n${formatEvidenceSnippetForDisplay(record)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`
        : null,
      record.sourceUrl ? `  Source: ${record.sourceUrl}` : null
    ]
      .filter(Boolean)
      .join("\n");
  });
  const lacksClauseLevelEvidence =
    (result.evidenceRecords ?? []).length > 0 &&
    (result.evidenceRecords ?? []).every((record) =>
      ["Regulatory Database", "Guide", "Economy Profile"].some((label) =>
        record.lawTitle.includes(label)
      )
    );
  const coverageDetail = Array.from(
    new Map(
      (result.evidenceRecords ?? []).map((record) => [
        record.country,
        {
          country: record.country,
          strengths: new Set<string>(),
          locators: new Set<string>()
        }
      ])
    ).values()
  )
    .map((entry) => {
      (result.evidenceRecords ?? [])
        .filter((record) => record.country === entry.country)
        .forEach((record) => {
          if (record.sourceStrength) {
            entry.strengths.add(record.sourceStrength);
          }

          if (record.sourceLocator) {
            entry.locators.add(record.sourceLocator);
          }
        });

      return [
        `- ${entry.country}: ${[...entry.strengths].join(", ") || "unspecified"}`,
        entry.locators.size
          ? `  Locators: ${[...entry.locators].slice(0, 2).join(" | ")}`
          : null
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
  const traceabilityLimitation = lacksClauseLevelEvidence
    ? "Current retrieval did not yet pinpoint row-level statutes or article-level clauses; this run is grounded in competition-designated database, profile, and methodology files and still needs human drill-down."
    : null;

  const summaryBlock = [
    `${coreModes.find((item) => item.id === mode)?.english ?? "Legal analysis"} result`,
    narrative,
    risk,
    provider,
    evidenceMode,
    exportReadiness ? `Export readiness: ${exportReadiness}.` : null,
    result.analysisRunId ? `Review run ID: ${result.analysisRunId}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const citationBlock = citations.length
    ? ["Key citations", ...citations.map((citation) => `- ${citation}`)].join("\n")
    : null;

  const findingsBlock = findingHighlights.length
    ? ["Legal findings", ...findingHighlights].join("\n")
    : null;

  const evidenceBlock = evidenceHighlights.length
    ? ["Evidence highlights", ...evidenceHighlights].join("\n")
    : null;

  const coverageBlock = coverageDetail ? ["Coverage detail", coverageDetail].join("\n") : null;

  const sourceBasisBlock = sourceBasis.length
    ? ["Source basis", ...sourceBasis.map((item) => `- ${item}`)].join("\n")
    : null;

  const uploadsBlock = uploadedDocuments.length
    ? [
        "Uploaded documents used",
        ...uploadedDocuments.map(
          (file) => `- ${file.fileName} (${file.characterCount.toLocaleString()} chars)`
        )
      ].join("\n")
    : null;

  return [
    summaryBlock,
    citationBlock,
    findingsBlock,
    evidenceBlock,
    coverageBlock,
    traceabilityLimitation,
    sourceBasisBlock,
    uploadsBlock,
    "Open the panels below to inspect evidence records, audit review, and JSON/CSV/Markdown export."
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
