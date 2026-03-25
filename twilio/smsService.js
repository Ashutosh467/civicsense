const axios = require("axios");

const formatIndianNumber = (number) => {
  const cleaned = number.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned.slice(2);
  if (cleaned.length === 10) return cleaned;
  return cleaned;
};

const sendSMS = async (toNumber, message) => {
  const number = formatIndianNumber(toNumber);
  try {
    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        message: message,
        language: "english",
        route: "q",
        numbers: number,
      },
    });
    return response.data;
  } catch (axiosError) {
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Fast2SMS API Error Response:", axiosError.response.data);
      throw new Error(axiosError.response.data.message || JSON.stringify(axiosError.response.data));
    } else {
      console.error("Fast2SMS Request Error:", axiosError.message);
      throw axiosError;
    }
  }
};

const getShortId = (id) => String(id).slice(-6).toUpperCase();

const sendComplaintReceivedSMS = async (toNumber, complaintId) => {
  try {
    const message = `CivicSense: Your complaint has been received. Tracking ID: #CS${getShortId(complaintId)}. We will resolve it within 24 hours. Thank you.`;
    const result = await sendSMS(toNumber, message);
    console.log("✅ Received SMS sent to", toNumber, result);
    return { success: true };
  } catch (err) {
    console.error("❌ Received SMS failed:", err.message);
    return { success: false, error: err.message };
  }
};

const sendComplaintResolvedSMS = async (toNumber, complaintId) => {
  try {
    const message = `CivicSense: Your complaint #CS${getShortId(complaintId)} has been resolved by our field officer. Was your issue fixed? Reply YES to confirm or NO to reopen.`;
    const result = await sendSMS(toNumber, message);
    console.log("✅ Resolved SMS sent to", toNumber, result);
    return { success: true };
  } catch (err) {
    console.error("❌ Resolved SMS failed:", err.message);
    return { success: false, error: err.message };
  }
};

const sendOfficerAssignedSMS = async (officerPhone, officerName, issueType, location, officerId) => {
  try {
    const dashboardLink = `${process.env.MAIN_BACKEND_URL}/officer/${officerId}`;
    const message = `CivicSense Alert: Hi ${officerName}, new complaint assigned. Issue: ${issueType} at ${location}. Open: ${dashboardLink}`;
    const result = await sendSMS(officerPhone, message);
    console.log("✅ Officer SMS sent to", officerPhone, result);
    return { success: true };
  } catch (err) {
    console.error("❌ Officer SMS failed:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendComplaintReceivedSMS,
  sendComplaintResolvedSMS,
  sendOfficerAssignedSMS,
};
