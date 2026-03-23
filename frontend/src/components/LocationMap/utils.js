export const getZoneCoordinates = (location) => {
    if (!location) return { lat: 40.7128, lng: -74.0060 };

    let hash = 0;
    for (let i = 0; i < location.length; i++) {
        hash = location.charCodeAt(i) + ((hash << 5) - hash);
    }

    // NYC base coordinates
    const baseLat = 40.7128;
    const baseLng = -74.0060;

    // Create a predictable scatter roughly within a 15-20 mile radius
    // 1 degree of lat/lng is roughly 69 miles. So 0.1 is ~7 miles.
    // Let's use modulus to keep offsets bounded between -0.15 and +0.15
    const latOffset = ((Math.abs(hash) % 300) - 150) / 1000;
    const lngOffset = ((Math.abs(hash * 7) % 300) - 150) / 1000;

    return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
};

export const processComplaintsIntoZones = (complaints) => {
    const zonesMap = {};

    complaints.forEach(c => {
        // Only map active cases
        if (c.status?.toLowerCase() === 'resolved') return;

        const loc = c.location || "Unknown Region";
        if (!zonesMap[loc]) {
            const coords = getZoneCoordinates(loc);
            // Determine deterministic random-looking values based on location name length 
            // so it doesn't flicker on every re-render
            const nameLen = loc.length;
            zonesMap[loc] = {
                name: loc,
                cases: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0,
                lat: coords.lat,
                lng: coords.lng,
                officers: (nameLen % 4) + 1, // 1-4 officers 
                avgResponse: (nameLen * 3 % 15) + 4 // 4-18 mins
            };
        }

        zonesMap[loc].cases += 1;
        const urgency = c.urgency?.toLowerCase();

        if (urgency === 'high') {
            zonesMap[loc].highCount += 1;
        } else if (urgency === 'medium') {
            zonesMap[loc].mediumCount += 1;
        } else {
            zonesMap[loc].lowCount += 1;
        }
    });

    return Object.values(zonesMap).map(zone => {
        let urgency = 'Low';
        // Priority assignment
        if (zone.highCount > 0) urgency = 'High';
        else if (zone.mediumCount > 0) urgency = 'Medium';

        return { ...zone, urgency };
    });
};
