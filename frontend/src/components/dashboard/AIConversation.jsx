import { useState, useEffect } from "react";

export default function AIConversation() {

  const steps = [
    "📞 Incoming Call from +91-9876543210",
    "🎙 Voice converted to text",
    "🧠 Intent detected: Road Complaint",
    "😊 Emotion detected: Frustrated",
    "⚡ Urgency classified: HIGH",
    "📝 Summary generated",
    "💾 Complaint saved to database"
  ];

  const [visibleSteps, setVisibleSteps] = useState([]);

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setVisibleSteps((prev) => [...prev, steps[index]]);
      index++;

      if (index === steps.length) {
        clearInterval(interval);
      }
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#111827] rounded-xl p-6 border border-white/10 shadow-md">

      <h2 className="text-lg font-semibold text-cyan-400 mb-4">
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