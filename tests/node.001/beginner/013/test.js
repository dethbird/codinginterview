// config.js
'use strict';

function getConfig(env = process.env) {
    // TODO:
    // - port: integer (default 3000, valid 1..65535)
    // - nodeEnv: 'development'|'test'|'production' (default 'development')
    // - debug: boolean from 'true'/'1'/'yes' etc (default false)
    let port, nodeEnv;
    let debug = false;
    if (!env.port) {
        port = 3000;
    } else {
        port = Number(env.port);
        if (!Number(port).isInteger() || port < 1 || port > 65535) {
            throw new Error('Invalid port number');
        }
    }
    if (!env.nodeEnv) { 
        nodeEnv = 'development';
    } else if (['development', 'test', 'production'].includes(env.nodeEnv)) {
        nodeEnv = env.nodeEnv;
    } else {
        throw new Error('Invalid nodeEnv value');
    }
    if (!env.debug) {
        debug = false;
    } else {
        const truthyValues = ['true', '1', 'yes', 'on'];
        debug = truthyValues.includes(env.debug.toLowerCase());
    }
    return { port, nodeEnv, debug } ;
}

module.exports = { getConfig };