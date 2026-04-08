
const fetch = require('node-fetch');
(async () => {
    try {
        const urlGeo = 'https://geocoding-api.open-meteo.com/v1/search?name=Surat&count=1';
        const geoResp = await fetch(urlGeo);
        const geoData = await geoResp.json();
        const { latitude, longitude } = geoData.results[0];
        console.log('Got lat lon:', latitude, longitude);

        const sd = '2016-01-01', ed = '2025-12-31';
        const arcUrl = \https://archive-api.open-meteo.com/v1/archive?latitude=\&longitude=\&start_date=\&end_date=\&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto\;
        const arcResp = await fetch(arcUrl);
        const a = await arcResp.json();

        const extractedData = [];
        const times = a.daily.time;
        const maxTemps = a.daily.temperature_2m_max;
        const targetPattern = '-03-31';

        for(let i=0; i<times.length; i++) {
            if(times[i].endsWith(targetPattern)) {
                if(maxTemps[i] !== null) {
                    extractedData.push({ year: times[i], max: maxTemps[i] });
                }
            }
        }

        const N = extractedData.length;
        let sumMax = 0, sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        extractedData.forEach((d, i) => {
            sumMax += d.max;
            let x = i, y = d.max;
            sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
            console.log(d.year, 'Max:', d.max);
        });

        const avgMax = sumMax / N;
        const slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
        const yIntercept = (sumY - slope * sumX) / N;
        let predictedMax = slope * N + yIntercept;
        
        console.log({
            N, avgMax, slope, yIntercept, predictedMax 
        });

    } catch (e) {
        console.error(e);
    }
})();

