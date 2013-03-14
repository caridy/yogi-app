#!/usr/bin/env node

if (!process.env.YOGI_PATH) {
    console.log('This should be executed from yogi');
    process.exit(1);
}

var YOGI_PATH = process.env.YOGI_PATH,
    path = require('path'),
    util = require(path.join(YOGI_PATH, 'lib/util')),
    log = require(path.join(YOGI_PATH, 'lib/log')),
    args = require(path.join(YOGI_PATH, 'lib/args')),
    yogiCommands = require(path.join(YOGI_PATH, 'lib/cmds')),
    appCommands = require('../lib/cmds'),
    options = args.parse(),
    cmd = options.main || 'help';

if (options.main && options.main !== 'version') {
    log.info('using yogi-app@' + appCommands.version.version + ' on node@' + process.versions.node);
}

yogiCommands[cmd] = yogiCommands[cmd] || {};

util.mix(yogiCommands[cmd], appCommands[cmd] || {});

if (yogiCommands[cmd] && yogiCommands[cmd].init) {
    yogiCommands[cmd].init(options);
} else {
    log.bail('Something went very wrong here, could not find any command for `yogi app`.');
}
