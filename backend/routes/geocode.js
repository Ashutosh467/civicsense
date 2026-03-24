import express from 'express';

const router = express.Router();

// Server-side cache
const geocodeCache = {};
let lastRequestTime = 0;

router.get('/', async (req, res) => {
    const location = req.query.location;
    if (!location) {
        return res.json({ lat: null, lon: null });
    }

    if (geocodeCache[location]) {
        return res.json(geocodeCache[location]);
    }

    // Keep 500ms delay between actual requests
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < 500) {
        await new Promise(r => setTimeout(r, 500 - timeSinceLast));
    }
    lastRequestTime = Date.now();

    try {
        const query = encodeURIComponent(`${location} India`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

        // Using native fetch (built-in for Node 18+)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CivicSense/1.0 (civic-complaint-system)'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
            geocodeCache[location] = result;
            res.json(result);
        } else {
            geocodeCache[location] = { lat: null, lon: null };
            res.json({ lat: null, lon: null });
        }
    } catch (error) {
        console.error('Nominatim Geocoding Error:', error.message);
        res.json({ lat: null, lon: null });
    }
});

export default router;
