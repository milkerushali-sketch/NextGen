import { useState } from "react";
import { FaRobot } from "react-icons/fa";

const starterMessages = [
  {
    sender: "bot",
    text: "Hi! I checked your purchase history and can suggest products that fit your style.",
  },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { sender: "user", text: trimmed },
      {
        sender: "bot",
        text: `Based on your shopping preferences, I recommend checking out premium audio gear and productivity essentials that match your recent purchases and current interest in ${trimmed.toLowerCase()}.`,
      },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[360px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg">
            <FaRobot />
          </div>
          <div>
            <div className="font-bold">Nova AI</div>
            <div className="text-xs text-violet-100">Smart shopping guide</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="text-lg text-violet-100"
        >
          {isOpen ? "✕" : "▢"}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="chat-scrollbar max-h-72 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950/60">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  message.sender === "bot"
                    ? "bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
                    : "ml-auto bg-violet-600 text-white"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask for product suggestions..."
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <button
              type="submit"
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
