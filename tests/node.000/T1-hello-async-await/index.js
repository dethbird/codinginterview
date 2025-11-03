'use strict';

function sleep(ms) {
  return new Promise((resolve, reject) => {
    if (ms < 0) {
      reject(new Error('Negative timeout not allowed'));
    } else {
      setTimeout(resolve, ms);
    }
  });
}

(async () => {
  // TODO: for (let i=1;i<=5;i++){ await sleep(200); console.log('tick', i); }
  for (let i = 1; i <= 5; i++) {
    await sleep(200);
    // await sleep(-60); // negative not allowed
    console.log('tick', i);
  }
})();
