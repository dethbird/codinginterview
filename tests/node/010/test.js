// count-url.js
'use strict';
const https = require('https');

const url = process.argv[2];
if (!url) {
  console.error('Usage: node count-url.js <url>');
  process.exit(1);
}

// TODO: https.get(url, res => { accumulate Buffer lengths; on 'end' print count })
// TODO: handle non-200 status codes

https.get(url, res => { 
    // Handle redirects
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Redirect ${res.statusCode} to: ${res.headers.location}`);
        // Follow the redirect
        https.get(res.headers.location, redirectRes => {
            let length = 0;
            redirectRes.on('data', (chunk) => {
                length += chunk.length;
            });
            redirectRes.on('end', () => {
                console.log(length);
            });
        });
        return;
    }
    
    // Handle non-200 status codes
    if (res.statusCode !== 200) {
        console.error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
        process.exit(1);
    }

    let length = 0;
    res.on('data', (chunk) => {
      // console.dir(chunk, { showHidden: true, depth: null });
      // console.log('Type:', typeof chunk);
      // console.log('Length:', chunk.length);
      length += chunk.length;
    });
    res.on('end', () => {
      console.log(length);
    })
});