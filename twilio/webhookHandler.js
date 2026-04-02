const axios = require("axios");
const twilio = require("twilio");

async function handleSMSReply(req, res) {
  try {
    const reply = req.body.Body?.trim().toUpperCase();
    const citizenNumber = req.body.From;
    
    let complaint;
    try {
      const response = await axios.get(`${process.env.MAIN_BACKEND_URL}/api/complaint/by-phone/${encodeURIComponent(citizenNumber)}`);
      complaint = response.data;
    } catch (error) {
      // Assuming 404 means no complaint found
      res.type("text/xml");
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("We could not find your complaint. Please call our helpline.");
      return res.send(twiml.toString());
    }

    const complaintId = complaint._id;

    if (reply === "YES") {
      await axios.patch(`${process.env.MAIN_BACKEND_URL}/api/complaint/${complaintId}/confirm`, {
        citizenConfirmed: true
      });
      res.type("text/xml");
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Thank you for confirming! Your complaint is now\nofficially closed. CivicCall.");
      return res.send(twiml.toString());
    } else if (reply === "NO") {
      await axios.patch(`${process.env.MAIN_BACKEND_URL}/api/complaint/${complaintId}/confirm`, {
        citizenConfirmed: false
      });
      res.type("text/xml");
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("We're sorry the issue wasn't resolved. Your complaint\nhas been reopened and reassigned. CivicCall.");
      return res.send(twiml.toString());
    } else {
      res.type("text/xml");
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Please reply YES to confirm resolution or\nNO to reopen your complaint.");
      return res.send(twiml.toString());
    }
  } catch (error) {
    console.error("Webhook handler error:", error.message);
    res.type("text/xml");
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("An error occurred. Please try again later.");
    return res.send(twiml.toString());
  }
}

module.exports = { handleSMSReply };
