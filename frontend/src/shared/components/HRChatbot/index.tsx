import React, { useState, useRef, useEffect } from "react";
import { BotMessageSquare, X, Send } from "lucide-react";

interface MessageItem {
  id: number;
  type: "bot" | "user";
  text: string;
  time: string;
  quickReplies?: string[];
}

const botReplies: Record<string, string> = {
  leave:
    "Your Leave Balance:\n✅ Annual Leave: 12 days\n✅ Sick Leave: 6 days\n✅ Casual Leave: 4 days\nVisit the Settings tab for policy details.",
  payroll:
    "Your salary for this month has been processed. Detail is available under your Employee portal.",
  attendance:
    "Your attendance for this month is 22/23 days. Last absent: Jan 28.",
  default:
    "Thank you! I am processing your request. An HR representative will assist you if needed. Anything else I can help with?",
};

function getBotReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("leave")) return botReplies.leave;
  if (t.includes("payroll") || t.includes("salary")) return botReplies.payroll;
  if (t.includes("attendance")) return botReplies.attendance;
  return botReplies.default;
}

function getTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const HRChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 1,
      type: "bot",
      text: "Hello! 👋 I am your AGENTRA HR Assistant. How can I help you today?",
      time: getTime(),
      quickReplies: ["Leave Balance", "Payroll", "Attendance"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    const userMsg: MessageItem = {
      id: Date.now(),
      type: "user",
      text: msgText,
      time: getTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          text: getBotReply(msgText),
          time: getTime(),
        },
      ]);
    }, 1200);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[430px] flex flex-col rounded-2xl border border-[#05DC7F]/30 bg-[#111] shadow-[0_0_30px_rgba(5,220,127,0.12)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#05DC7F]/20 bg-[#111] flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#05DC7F]/10 border border-[#05DC7F]/35 flex items-center justify-center">
              <BotMessageSquare size={18} className="text-[#05DC7F]" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">HR Assistant</p>
              <p className="text-white/40 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#05DC7F] inline-block" />
                Online · Always here to help
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition text-lg leading-none"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.type === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ${
                    msg.type === "user"
                      ? "bg-[#05DC7F] text-black font-medium"
                      : "bg-[#05DC7F]/10 border border-[#05DC7F]/20 text-white/85"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-white/25 mt-1 px-1">{msg.time}</span>

                {msg.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => sendMessage(qr)}
                        className="text-[11px] px-3 py-1 rounded-full border border-[#05DC7F]/35 text-[#05DC7F] hover:bg-[#05DC7F]/10 transition"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="self-start flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-[#05DC7F]/10 border border-[#05DC7F]/20">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#05DC7F] inline-block animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#05DC7F]/20 bg-[#111] flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message HR Assistant..."
              className="flex-1 bg-white/5 border border-[#05DC7F]/20 rounded-full text-white text-[13px] px-4 py-2 outline-none placeholder:text-white/25 focus:border-[#05DC7F]/50 transition"
            />
            <button
              onClick={() => sendMessage()}
              className="w-8 h-8 rounded-full bg-[#05DC7F] flex items-center justify-center flex-shrink-0 hover:scale-105 transition"
            >
              <Send size={14} className="text-black" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-[#05DC7F] flex items-center justify-center shadow-[0_0_20px_rgba(5,220,127,0.4)] hover:scale-110 active:scale-95 transition-transform"
      >
        <BotMessageSquare size={26} className="text-black" />
      </button>
    </>
  );
};
