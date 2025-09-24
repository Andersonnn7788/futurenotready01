"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp?: number;
};

const GREETING = `Hi! I'm your Onboarding Assistant.

Feel free to ask me about onboarding or company policies!`;

const sanitizeBotText = (text: string) => text.replace(/\*\*/g, "");

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "g1",
      sender: "bot",
      text: GREETING,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

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
      const botText = sanitizeBotText(data?.reply || "");
      
      // Simulate a brief delay to show typing indicator
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (botText) {
        const reply: Message = { 
          id: `b-${Date.now()}`, 
          sender: "bot", 
          text: botText,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, reply]);
      }
    } catch {
      const reply: Message = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: sanitizeBotText("Sorry, I couldn't reach the assistant. Please try again."),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [input, isLoading, guidelines]);

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex items-start gap-3 animate-in slide-in-from-left-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm max-w-[85%]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/60 backdrop-blur-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Onboarding Assistant</div>
                    <div className="text-sm text-white/80">Here to help you get started</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                  aria-label="Close chatbot"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={listRef} className="h-80 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-1 duration-300`}>
                  {m.sender === "bot" && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap shadow-sm max-w-[85%] leading-relaxed">
                        {sanitizeBotText(m.text)}
                      </div>
                    </div>
                  )}
                  {m.sender === "user" && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-md px-4 py-3 text-sm whitespace-pre-wrap shadow-md max-w-[85%] leading-relaxed">
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && <TypingIndicator />}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 bg-white p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
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
                    disabled={isLoading}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 font-medium text-sm shadow-md hover:shadow-lg disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${isOpen ? 'scale-95 opacity-90' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        <div className="relative">
          <svg 
            className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <svg 
            className={`absolute inset-0 w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-0 scale-100' : '-rotate-180 scale-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span className="font-medium hidden sm:block">Chat</span>
        
        {/* Notification Dot (example for unread messages) */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
        
        {/* Ripple Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      </button>
    </div>
  );
}


