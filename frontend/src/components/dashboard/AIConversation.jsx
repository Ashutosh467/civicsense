import { useState, useEffect } from "react";

export default function AIConversation({ complaint }) {
  const steps = complaint
    ? [
      `📞 Incoming Call from ${complaint.callerNo || "Unknown"}`,
      "🎙 Voice converted to text",
      `🧠 Intent detected: ${complaint.issueType || "Unknown Issue"}`,
      `😊 Emotion detected: ${complaint.emotion || "Neutral"}`,
      `⚡ Urgency classified: ${complaint.urgency?.toUpperCase() || "NORMAL"}`,
      "📝 Summary generated",
      "💾 Complaint saved to database",
    ]
    : ["⏳ Waiting for incoming calls..."];

  const [visibleSteps, setVisibleSteps] = useState([]);

  useEffect(() => {
    setVisibleSteps([]); // Reset steps when complaint changes
    let index = 0;

    if (!complaint) {
      setVisibleSteps(steps);
      return;
    }

    const interval = setInterval(() => {
      setVisibleSteps((prev) => {
        if (!steps[index]) return prev;
        return [...prev, steps[index]];
      });
      index++;

      if (index >= steps.length) {
        clearInterval(interval);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [complaint]);

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-white/10 shadow-md h-[300px] flex flex-col overflow-hidden">

      <h2 className="text-lg font-semibold text-cyan-400 mb-4 shrink-0">
        🤖 AI Processing Pipeline
      </h2>

      <div className="space-y-3 text-sm text-gray-300">
        {visibleSteps.map((step, i) => (
          <div
            key={i}
            className="animate-fadeIn"
          >
            {step}
          </div>
        ))}
      </div>

    </div>
  );
}