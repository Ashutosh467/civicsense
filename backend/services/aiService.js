import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const processComplaint = async (issueType, location, callerNo) => {
  try {
    const prompt = `You are an AI for a civic complaint system in India. Analyze this complaint.

Issue: ${issueType}
Location: ${location}

Return ONLY a JSON object, no markdown, no explanation:
{
  "detectedLanguage": "Hindi or English or Punjabi etc",
  "isEnglish": false,
  "translatedIssue": "English translation of issue",
  "translatedLocation": "English translation of location",
  "summary": "One sentence summary in English max 15 words",
  "department": "PWD or Fire Department or Police or Municipal Corporation or Water Board or Electricity Board or Health Department or Traffic Police",
  "urgencyOverride": null
}

Department rules:
- Road damage, pothole, fallen tree → PWD
- Fire, gas leak → Fire Department  
- Crime, theft → Police
- Garbage, stray animals, waterlogging, streetlight → Municipal Corporation
- Water supply, pipeline → Water Board
- Power cut, electrical fault → Electricity Board
- Disease, sanitation → Health Department
- Traffic, accident → Traffic Police`;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const text = response.choices[0].message.content.trim();
    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const result = JSON.parse(clean);

    if (typeof result.isEnglish === "string") {
      result.isEnglish = result.isEnglish.toLowerCase() === "true";
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
      department: "Municipal Corporation",
      urgencyOverride: null,
    };
  }
};
