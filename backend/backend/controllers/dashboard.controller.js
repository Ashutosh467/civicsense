import db from "../config/db.js";

/*
====================================
 DASHBOARD SUMMARY
====================================
*/
export const getDashboardSummary = async (req, res) => {
  try {
    const snapshot = await db.collection("complaints").get();

    let totalToday = 0;
    let pending = 0;
    let inProgress = 0;
    let resolvedToday = 0;
    let urgentCount = 0;

    const today = new Date().toDateString();

    snapshot.forEach((doc) => {
      const data = doc.data();

      // total today
      if (new Date(data.time).toDateString() === today) {
        totalToday++;
      }

      // status counts
      if (data.status === "pending") pending++;
      if (data.status === "in_progress") inProgress++;
      if (data.status === "resolved") {
        if (new Date(data.time).toDateString() === today) {
          resolvedToday++;
        }
      }

      // urgency
      if (data.urgency === "high") urgentCount++;
    });

    res.json({
      totalToday,
      pending,
      inProgress,
      resolvedToday,
      urgentCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Dashboard summary failed",
    });
  }
};

/*
====================================
 LOCATION INSIGHTS
====================================
*/
export const getLocationInsights = async (req, res) => {
  try {
    const snapshot = await db.collection("complaints").get();

    const locationMap = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const location = data.location || "Unknown";

      if (!locationMap[location]) {
        locationMap[location] = {
          location,
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
      }

      locationMap[location].total++;

      if (data.urgency === "high") locationMap[location].high++;
      if (data.urgency === "medium") locationMap[location].medium++;
      if (data.urgency === "low") locationMap[location].low++;
    });

    // calculate stress score
    const insights = Object.values(locationMap).map((loc) => {
      const stress =
        (loc.high * 3 + loc.medium * 2 + loc.low * 1) / (loc.total * 3);

      return {
        location: loc.location,
        totalCalls: loc.total,
        stressScore: Math.round(stress * 100),
      };
    });

    res.json(insights);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Location insights failed",
    });
  }
};
