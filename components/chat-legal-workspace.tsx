"use client";

import { FormEvent, SVGProps, useMemo, useRef, useState } from "react";

type CoreModeId = "regulation" | "case" | "advisory";

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
  const hasConversation = messages.length > 1;

  const mode = useMemo(
    () => coreModes.find((item) => item.id === activeMode) ?? coreModes[0],
    [activeMode]
  );

  function handleModeChange(nextMode: CoreModeId) {
    activeModeRef.current = nextMode;
    setActiveMode(nextMode);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = inputValue.trim();

    if (!trimmed) {
      return;
    }

    const selectedMode = activeModeRef.current;

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        mode: selectedMode
      },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        mode: selectedMode,
        content: buildPlaceholderAnswer(selectedMode)
      }
    ]);
    setInputValue("");
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
  const menuItems = ["Platform", "Features", "Projects", "Community", "Contact"];

  return (
    <nav className="flex items-center justify-between py-4 font-schibsted">
      <a href="#" className="text-[24px] font-semibold tracking-[-1.44px] text-black">
        Cross-Border Data Policy Assistant
      </a>

      <div className="hidden items-center gap-8 xl:flex">
        {menuItems.map((item) => (
          <a
            key={item}
            href="#"
            className="flex items-center gap-1.5 text-[16px] font-medium tracking-[-0.2px] text-black"
          >
            {item}
            {item === "Features" ? <ChevronDownIcon className="h-4 w-4" /> : null}
          </a>
        ))}
      </div>

      <div aria-hidden="true" className="h-11 w-[101px]" />
    </nav>
  );
}

function SearchComposer({
  activeMode,
  inputValue,
  modePrompt,
  surface,
  onModeChange,
  onInputChange,
  onSubmit
}: {
  activeMode: CoreModeId;
  inputValue: string;
  modePrompt: string;
  surface: "hero" | "chat";
  onModeChange: (mode: CoreModeId) => void;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isHero = surface === "hero";

  return (
    <form
      onSubmit={onSubmit}
      className={`min-h-[200px] rounded-[18px] p-3 text-left ${
        isHero
          ? "bg-black/25 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl"
          : "border border-black/10 bg-white shadow-[0_14px_42px_rgba(0,0,0,0.08)]"
      }`}
    >
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
            disabled={!inputValue.trim()}
            aria-label="Submit question"
          >
            <UpArrowIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <UtilityButton icon={<PaperclipIcon className="h-4 w-4" />} label="Attach" />
            <UtilityButton icon={<MicrophoneIcon className="h-4 w-4" />} label="Voice" />
            <UtilityButton icon={<SearchIcon className="h-4 w-4" />} label="Prompts" />
          </div>
          <span className="font-schibsted text-[12px] font-medium text-[#737373]">
            {inputValue.length.toLocaleString()}/3,000
          </span>
        </div>
      </div>

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

function UtilityButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-md bg-[#f8f8f8] px-3 py-2 font-schibsted text-[12px] font-medium text-black"
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

function MicrophoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 10.25C6.75 10.25 5.75 9.25 5.75 8V4.25C5.75 3 6.75 2 8 2C9.25 2 10.25 3 10.25 4.25V8C10.25 9.25 9.25 10.25 8 10.25Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.75 7.5V8C3.75 10.35 5.65 12.25 8 12.25M12.25 7.5V8C12.25 10.35 10.35 12.25 8 12.25M8 12.25V14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
