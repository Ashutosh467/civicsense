import Groq from "groq-sdk";
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const processComplaint = async (issueType, location, callerNo) => {
  try {
    const prompt = `You are an AI for CivicCall, a civic complaint system in India.
Analyze this complaint and return department and translation.

Issue: ${issueType}
Location: ${location}

Return ONLY a JSON object, no markdown, no explanation:
{
  "detectedLanguage": "Hindi or English or Punjabi or Tamil etc",
  "isEnglish": false,
  "translatedIssue": "English Roman script translation of issue type only",
  "translatedLocation": "English Roman script translation of location only",
  "summary": "One sentence summary in English max 15 words",
  "department": "Choose ONLY from these 7 exact values: Fire Department, Law & Order, Roads & Infrastructure, Water & Sanitation, Electricity, Health, Municipal Services",
  "urgencyOverride": null
}

Department mapping rules (use EXACT names above):
- Building fire, vehicle fire, gas leak, explosion, rescue, forest fire → Fire Department
- Theft, robbery, murder, harassment, riot, missing person, traffic accident, noise → Law & Order
- Pothole, road damage, bridge repair, footpath broken, road blocked → Roads & Infrastructure
- No water supply, dirty water, pipeline burst, hand pump, sewage overflow, drain blocked → Water & Sanitation
- Power cut, transformer blast, street light not working, low voltage, electric wire fallen → Electricity
- No doctor, no medicine, ambulance not coming, dirty hospital, food poisoning → Health
- Garbage not collected, stray animals, encroachment, park maintenance, public toilet → Municipal Services

CRITICAL: translatedIssue and translatedLocation MUST be in English Roman script ONLY.
CRITICAL: department MUST be exactly one of the 7 values listed above.`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    });

    const text = response.choices[0].message.content.trim();
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(clean);

    if (typeof result.isEnglish === "string") {
      result.isEnglish = result.isEnglish.toLowerCase() === "true";
    }

    // Validate department — if invalid, map to closest
    const validDepts = [
      "Fire Department", "Law & Order", "Roads & Infrastructure",
      "Water & Sanitation", "Electricity", "Health", "Municipal Services"
    ];
    if (!validDepts.includes(result.department)) {
      console.log(`⚠️ Invalid dept "${result.department}" — defaulting to Municipal Services`);
      result.department = "Municipal Services";
    }

    console.log("✅ Groq AI Result:", result);
    return result;
  } catch (error) {
    console.error("Groq AI failed:", error.message);
    return {
      detectedLanguage: "English",
      isEnglish: true,
      translatedIssue: issueType,
      translatedLocation: location,
      summary: issueType,
      department: "Municipal Services",
      urgencyOverride: null,
    };
  }
};
