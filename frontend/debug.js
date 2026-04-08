async function debug() {
    const geo = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=Surat&count=1').then(r=>r.json());
    console.log('City:', geo.results[0].name, 'Pop:', geo.results[0].population, 'Lat:', geo.results[0].latitude);

    const sd='2016-01-01', ed='2025-12-31';
    let url = `https://archive-api.open-meteo.com/v1/archive?latitude=${geo.results[0].latitude}&longitude=${geo.results[0].longitude}&start_date=${sd}&end_date=${ed}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const arc = await fetch(url).then(r=>r.json());
    
    let ext = [];
    for(let i=0; i<arc.daily.time.length; i++) {
        if(arc.daily.time[i].endsWith('-03-31')) {
            ext.push({year:arc.daily.time[i], max:arc.daily.temperature_2m_max[i]});
        }
    }
    console.log('Extracted Max Temps for Mar 31:', ext);

    const N = ext.length;
    let sumX=0,sumY=0,sumXY=0,sumX2=0, sumMax=0;
    ext.forEach((d,i)=>{
        const x = i, y = d.max;
        sumMax+=y; sumX+=x; sumY+=y; sumXY+=x*y; sumX2+=x*x;
    });
    
    const avgMax = sumMax/N;
    const slope = (N*sumXY - sumX*sumY)/(N*sumX2 - sumX*sumX);
    const yIntercept = (sumY - slope*sumX)/N;
    let predictedMax = slope*N + yIntercept;
    
    console.log('Math logic:', { N, avgMax, slope, yIntercept, predictedMax });
    
    const maxDev = 2.0;
    let finalMax = predictedMax;
    if (finalMax > avgMax + maxDev) finalMax = avgMax + maxDev;
    if (finalMax < avgMax - maxDev) finalMax = avgMax - maxDev;
    console.log('Final Capped Max:', finalMax);
}
debug();
