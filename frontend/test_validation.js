async function testValidation() {
    const locations = [
        { name: "Paris", lat: 48.8566, lon: 2.3522 }, // Valid
        { name: "Invalid Spot", lat: 0, lon: 0 },   // Might be valid (Ocean) but let's see
        { name: "North Pole", lat: 90, lon: 0 }      // Often unsupported by some providers
    ];

    console.log("Testing /api/validate-cities...");
    try {
        const resp = await fetch("http://localhost:5000/api/validate-cities", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locations: locations.map(l => ({ lat: l.lat, lon: l.lon })) })
        });

        console.log(`Status: ${resp.status}`);
        const data = await resp.json();
        console.log("Validations:", data.validations);
        
        locations.forEach((l, i) => {
            console.log(`${l.name}: ${data.validations[i] ? "✅ Valid" : "❌ No Data"}`);
        });

    } catch (err) {
        console.log("Test failed:", err.message);
    }
}

testValidation();
