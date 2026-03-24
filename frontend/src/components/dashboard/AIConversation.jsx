import { useState, useEffect } from "react";

export default function AIConversation({ complaint }) {
  const steps = complaint ? [
    "📞 Incoming call from " + (complaint.callerNo || 'Unknown'),
    "🌐 Language detected: " + (complaint.detectedLanguage || 'English'),
    complaint.isEnglish === false ? "🔄 Translated to English automatically" : "✅ Already in English",
    "🎙 Voice converted to text",
    "🧠 Intent: " + (complaint.translatedIssue || complaint.issueType || 'Unknown'),
    "😊 Emotion detected: " + (complaint.emotion || 'Neutral'),
    "⚡ Urgency classified: " + (complaint.urgency?.toUpperCase() || 'NORMAL'),
    "🏛 Routed to: " + (complaint.department || 'Municipal Corporation'),
    "📝 Summary: " + (complaint.summary || 'Processing...'),
    complaint.isDuplicate ? "🚨 CLUSTER ALERT! " + complaint.clusterSize + " similar complaints in 24hrs — escalated to HIGH" : "✅ No duplicates detected",
    "💾 Saved to database successfully",
  ] : ["⏳ Waiting for incoming calls..."];

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
  }, [complaint]); // eslint-disable-line react-hooks/exhaustive-deps

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