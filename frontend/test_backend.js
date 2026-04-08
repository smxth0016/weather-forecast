async function test() {
    const urls = [
        "http://localhost:5000/api/weather?city=Paris%2C%20Texas%2C%20United%20States&lat=33.66094&lon=-95.55551",
        "http://localhost:5000/api/weather?city=Paris"
    ];

    for (const url of urls) {
        console.log(`\nTesting: ${url}`);
        try {
            const resp = await fetch(url);
            console.log(`Status: ${resp.status}`);
            const data = await resp.json();
            if (resp.ok) {
                console.log(`Success! City: ${data.city}, Temp: ${data.temperature}`);
            } else {
                console.log(`Error: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            console.log(`Connection failed: ${e.message}`);
        }
    }
}

test();
