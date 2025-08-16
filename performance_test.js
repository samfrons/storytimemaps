const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Enable performance tracking
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = {
      start: Date.now(),
      events: []
    };
  });
  
  // Track console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('ERROR:', msg.text());
    }
  });
  
  // Track page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  console.log('Loading page...');
  const startTime = Date.now();
  
  // Navigate to page
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });
  
  const loadTime = Date.now() - startTime;
  
  // Check for map loading
  const mapLoaded = await page.evaluate(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mapElement = document.querySelector('.mapboxgl-map');
        const hasCanvas = document.querySelector('.mapboxgl-canvas');
        resolve({
          mapExists: !!mapElement,
          canvasExists: !!hasCanvas,
          mapStyle: mapElement ? window.getComputedStyle(mapElement).visibility : 'not found'
        });
      }, 2000); // Wait 2 seconds for map to initialize
    });
  });
  
  // Get performance metrics
  const metrics = await page.metrics();
  
  console.log('\n=== Performance Results ===');
  console.log(`Page Load Time: ${(loadTime / 1000).toFixed(2)}s`);
  console.log(`Map Loaded: ${mapLoaded.mapExists ? 'Yes' : 'No'}`);
  console.log(`Canvas Rendered: ${mapLoaded.canvasExists ? 'Yes' : 'No'}`);
  console.log(`JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`DOM Nodes: ${metrics.Nodes}`);
  console.log(`Layout Duration: ${metrics.LayoutDuration?.toFixed(3)}s`);
  console.log(`Script Duration: ${metrics.ScriptDuration?.toFixed(3)}s`);
  
  await browser.close();
})().catch(console.error);