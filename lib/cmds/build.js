/*jslint node:true*/

'use strict';

var YOGI_PATH = process.env.YOGI_PATH,
    path = require('path'),
    util = require(path.join(YOGI_PATH, 'lib/util')),
    log = require(path.join(YOGI_PATH, 'lib/log')),
    spawn = require(path.join(YOGI_PATH, 'node_modules/win-spawn')),
    lookup = require('../lookup');

util.mix(exports, {

    init: function (options) {
        var module = util.getPackage(true),
            mod;

        this.loud = options.parsed.loud;
        this.quiet = options.parsed.quiet;
        this.ant = options.parsed.ant;
        this.options = options;
        this.module = module;

        this.dir = options.parsed.start || process.cwd();

        this.build();
    },

    shifterBuild: function (callback) {
        log.info('running with shifter');
        var shifter = path.join(YOGI_PATH, 'node_modules/shifter/bin/shifter'),
            self = this,
            args = this.options.parsed.argv.original,
            mods,
            stack = new util.Stack();

        if (this.options.parsed.coverage === false) {
            args.push('--no-coverage');
        }

        log.debug(shifter + ' ' + args.join(' '));

        args.unshift(shifter);

        mods = lookup.run(this.dir, this.options.parsed);

        mods.forEach(function (mod) {
            var child,
                a = [].concat(args);

            a = a.concat('--config', mod.buildfile);
            log.info('shifting ' + mod.buildfile);
            log.debug(a.join(' '));

            child = spawn(process.argv[0], a, {
                cwd: path.dirname(mod.buildfile),
                stdio: 'inherit'
            });
            child.on('exit', stack.add(function (code) {
                log.debug('shifter finished with [' + mod.buildfile + ']');
                if (code) {
                    log.error('yogi detected an error, exiting code ' + code + ' while executing: \n' +
                        shifter + ' ' + a.join(' '));
                    process.exit(1);
                }
            }));
        });
        stack.done(function () {
            log.debug('shifter finished, clean up');
            self.clean();
            if (self.complete) {
                self.complete();
            }
            if (callback) {
                callback();
            }
        });
    },

    help: function () {
        return [
            'build',
            'builds your module, duh!',
            '--loud for more info',
            '--ant to use ant instead of shifter',
            '--test execute tests after the build is complete',
            '--include-dirs=<dir> a command separator string with the relative ',
            '                     path for folders that should be analyzed.',
            '--exclude-dirs=<dir> a command separator string with the relative ',
            '                     path for folders that should be skipped.',
            'Any other parameters will be passed down to shifter under the hood'
        ];
    }

});
