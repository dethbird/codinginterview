// safe-json-parse.js
'use strict';
const fs = require('fs');

function safeJsonParse(str) {
  // TODO
  let resp = {ok: true};
  try {
    resp.value = JSON.parse(str);
  } catch (e) {
    return ({ok: false, value: e.message})
  }
  return resp;
}
module.exports = { safeJsonParse };


const str = fs.readFileSync(0, 'utf8');
console.log(safeJsonParse(str));