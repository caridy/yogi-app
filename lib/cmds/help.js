var YOGI_PATH = process.env.YOGI_PATH,
    path = require('path'),
    log = require(path.join(YOGI_PATH, 'lib/log')),
    util = require(path.join(YOGI_PATH, 'lib/util')),
    version = require(path.join(__dirname, 'version')).version,
    cmds = require('../cmds'),
    mods = {
        init: function(options) {
            var scope, help = [], self = this,
                len = 0, commands = [],
                spacer = '  ', items = {},
                detailed = options.parsed.detailed,
                extra,
                pad = function(str) {
                    var pad = '', o;
                    for (o = str.length; o < len; o++) {
                        pad += ' ';
                    }
                    return pad + str;
                };

            this.yui = util.isYUI();

            if (options.parsed.argv.remain.length) {
                scope = options.parsed.argv.remain[0];
                detailed = true;
            }
            log.info('yogi-app@' + version);

            Object.keys(cmds).forEach(function(name) {
                var valid = true,
                    warn;
                if (cmds[name].help) {
                    if (cmds[name].gallery && self.yui) {
                        warn = 'this command is only valid in the gallery repo';
                        valid = false;
                    }
                    if (cmds[name].yui && !self.yui) {
                        warn = 'this command is only valid in the main YUI repo';
                        valid = false;
                    }

                    if (!scope || scope === name) {
                        if (!valid && scope) {
                            log.warn(warn);
                        }
                        help.push(cmds[name].help());
                    }
                }
            });

            help.forEach(function(i, key) {
                var cmd = help[key].shift();
                items[cmd] = help[key];
                len = (cmd.length > len) ? cmd.length : len;
                commands.push(cmd);
            });
            commands.sort();
            commands.forEach(function(c, k) {
                commands[k] = pad(c);
            });

            log.log('');
            log.log('command line options:');
            if (!detailed) {
                log.log('   (--detailed for more)');
            }
            log.log('');
            commands.forEach(function(cmd) {
                var info = items[cmd.trim()],
                    first = info.shift(),
                    p = (info.length && !detailed) ? '*' : ' ';

                cmd += p;
                log.log(spacer + cmd + spacer + first);
                if (info.length) {
                    extra = true;
                    if (detailed) {
                        info.forEach(function(line) {
                            log.log(spacer + pad('') + spacer + spacer + line);
                        });
                    }
                }
            });
            if (extra && !scope && !detailed) {
                log.log('\n*help topic contains more options. --detailed for more info.');
            }

            log.log('\n');

        },
        shell_complete: [],
        help: function() {
            return [
                '-h, --help, help',
                'show this stuff',
                'yogi app help [command] to limit or',
                'yogi app [command] --help to limit'
            ];
        }
    };

    Object.keys(cmds).forEach(function(c) {
        if (cmds[c].help) {
            mods.shell_complete.push(c);
        }
    });

util.mix(exports, mods);
