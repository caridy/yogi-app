/*jslint node:true*/

'use strict';

var YOGI_PATH = process.env.YOGI_PATH,
    path = require('path'),
    util = require(path.join(YOGI_PATH, 'lib/util')),
    log = require(path.join(YOGI_PATH, 'lib/log')),
    lookup = require('../lookup'),
    timethat = require('timethat');

var mods = {
    scan: function () {
        var dir = process.cwd();
        mods = lookup.run(dir, this.options.parsed);

        if (!mods.length) {
            log.bail('Something went very wrong here, could not find meta data or yui modules to parse.');
        }

        log.info('found ' + mods.length + ' files to analyze.');
        log.info('parsing now...');

        this.data.mods = mods;
    },

    process: function () {
        var self = this;

        this.data.mods.forEach(function (mod) {
            var i;
            for (i in mod.builds) {
                if (mod.builds.hasOwnProperty(i)) {
                    self.parseData(i, mod.builds[i].config || {}, mod.buildfile);
                }
            }
        });

    },
    help: function () {
        return [
            'loader',
            'generate loader meta data for a mojito app',
            '--yes auto answer yes to all questions (default: false)',
            '--start <path> where to start scanning (default CWD)',
            '--json <path> where to write the JSON data (default CWD/loader/js/yui3.json)',
            '--js <path> where to write the JS data (default CWD/loader/js/yui3.js)',
            '--tests <path> where to write the Conditional Test data (default CWD/yui/js/load-tests.js)',
            '--mix  use mix to mix the module meta-data into an existing object (for gallery builds)',
            '--strict only parse meta files that also have a build.json (default: false, true for gallery)',
            '--expand Use Loader to pre-expand module meta data',
            '--name Wrap the YUI.add wrapper and name the module',
            '--group loader group name',
            '--include-dirs=<dir> a command separator string with the relative ',
            '                     path for folders that should be analyzed.',
            '--exclude-dirs=<dir> a command separator string with the relative ',
            '                     path for folders that should be skipped.',
            'Any other parameters will be passed down to shifter under the hood'
        ];
    }
};

util.mix(exports, mods);
