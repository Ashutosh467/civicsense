import axios from "axios";

export async function geocodeArea(areaText) {
  try {
    const query = encodeURIComponent(areaText + ", Bihar, India");
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: { "User-Agent": "CivicCall/1.0" },
        timeout: 8000,
      }
    );
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      console.log(`📍 Geocoded "${areaText}" → ${lat}, ${lon}`);
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    }
    console.log(`⚠️ Could not geocode: ${areaText}`);
    return null;
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return null;
  }
}
