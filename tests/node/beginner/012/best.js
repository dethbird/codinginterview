// sleep-demo.js
'use strict';

/**
 * Sleep for the given milliseconds.
 * Negative or zero values resolve immediately.
 */
const sleep = (ms) =>
  new Promise((resolve) =>
    ms > 0 ? setTimeout(resolve, ms) : resolve()
  );

(async () => {
  for (let i = 1; i <= 5; i++) {
    await sleep(200);
    console.log(`tick ${i}`);
  }
})();
