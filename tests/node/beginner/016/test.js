// parse-args.js
'use strict';

function parseArgs(argv = process.argv.slice(2)) {
    let resp = {};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i]) {
            if (argv[i].startsWith('--')) {
                const [key, value] = argv[i].split('=');
                if (value) {
                    resp[key.slice(2)] = Number(value) || value;
                } else {
                    resp[key.slice(2)] = Number(argv[i + 1]) || argv[i + 1];
                    i++;
                }
            } else if (argv[i].startsWith('-')) {
                resp[argv[i].slice(1)] = true;
            }
        };
    }
    return resp;
}

const args = parseArgs();
console.log(args)
