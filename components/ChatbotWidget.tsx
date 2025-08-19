"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
};

const GREETING = `Hi! I’m the Onboarding Assistant.

Ask me about onboarding policies.`;

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "g1",
      sender: "bot",
      text: GREETING,
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const [guidelines, setGuidelines] = useState<string>("");

  // Load guidelines from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem("onboarding_guidelines_v1");
      if (stored) setGuidelines(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Always fetch the latest guidelines from localStorage at send time
      let liveGuidelines = guidelines;
      try {
        const stored = localStorage.getItem("onboarding_guidelines_v1");
        if (stored !== null) {
          liveGuidelines = stored;
          if (stored !== guidelines) setGuidelines(stored);
        }
      } catch {}

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, guidelines: liveGuidelines }),
      });
      const data = await res.json();
      const text = data?.reply || "";
      if (text) {
        const reply: Message = { id: `b-${Date.now()}`, sender: "bot", text };
        setMessages((prev) => [...prev, reply]);
      }
    } catch (e) {
      const reply: Message = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: "Sorry, I couldn’t reach the assistant. Please try again.",
      };
      setMessages((prev) => [...prev, reply]);
    }
  }, [input]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="mb-3 w-80 sm:w-96 rounded-lg border bg-white shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="text-sm font-medium text-gray-900">Help Chatbot</div>
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center rounded px-2 py-1 text-xs border hover:bg-gray-50"
              aria-label="Close chatbot"
            >
              Close
            </button>
          </div>
          <div ref={listRef} className="h-80 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50">
            {messages.map((m) => (
              <div key={m.id} className={m.sender === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.sender === "user" ? "bg-blue-600 text-white" : "bg-white border"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-2 border-t">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask: What is the policy of remote work?"
              className="flex-1 rounded border px-2 py-1 text-sm"
            />
            <button
              onClick={handleSend}
              className="inline-flex items-center rounded bg-blue-600 text-white text-sm px-3 py-1 hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-2 shadow-lg hover:bg-blue-700"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open chatbot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M2 12.75C2 7.365 6.365 3 11.75 3S21.5 7.365 21.5 12.75 17.135 22.5 11.75 22.5a9.7 9.7 0 0 1-3.773-.76L3 22l.86-4.8A9.7 9.7 0 0 1 2 12.75Z"/>
        </svg>
        Chat
      </button>
    </div>
  );
}


