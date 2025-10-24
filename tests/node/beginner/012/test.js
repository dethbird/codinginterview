// sleep-demo.js
'use strict';

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

(async () => {
  for (let i = 1; i <= 5; i++) {
    await sleep(200);
  }
})();