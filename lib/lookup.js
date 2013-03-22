/*jslint node:true*/

'use strict';

var YOGI_PATH = process.env.YOGI_PATH,
    fs = require('fs'),
    path = require('path'),
    vm = require('vm'),
    log = require(path.join(YOGI_PATH, 'lib/log')),
    existsSync = fs.existsSync || path.existsSync,
    has = function (opt, name) {
        return opt.some(function (v) {
            return (v === name);
        });
    },
    contextForRunInContext = vm.createContext({
        require: require,
        module: require('module'),
        console: {
            log: function () {}
        },
        window: {},
        document: {}
    });

exports.run = function (cwd, options) {
    log.info('racing the directories');
    var mods = [],
        args = [],
        dirs = options.dirs ? options.dirs.split(',') : ['.'];

    if (args.length) {
        log.info('using ' + args.join(' '));
    }

    function checkBuildFile(file) {
        var mod,
            entry,
            metas = path.join(path.dirname(file) + 'meta'),
            files,
            i;

        try {
            mod = require(file);
        } catch (e) {
            log.error('Failed to parse build file: ' + file);
            console.error(e);
            process.exit(1);
            return;
        }

        mod.buildfile = file;

        if (existsSync(metas)) {
            files = fs.readdirSync(metas);
            files.forEach(function (f) {
                var i;
                if (path.extname(f) === '.json') {
                    try {
                        entry = require(f);
                    } catch (e) {
                        log.error('Failed to parse meta file: ' + f);
                        console.error(e);
                        process.exit(1);
                        return;
                    }
                    for (i in entry) {
                        if (entry.hasOwnProperty(i)) {
                            mod.builds[i] = mod.builds[i] || {};
                            mod.builds[i].config = entry[i];
                        }
                    }
                }
            });
        }

        return mod;
    }

    function checkYUIModule(file) {
        var mod,
            entry;

        contextForRunInContext.YUI = {
            add: function (name, fn, version, config) {
                if (mod) {
                    log.debug('file `' + file + '` is a rollup.');
                } else {
                    mod = {
                        name: name,
                        buildfile: file,
                        builds: {}
                    };
                }
                mod.builds[name] = {
                    name: name,
                    fn: fn,
                    version: version,
                    config: config || {}
                };
            }
        };
        try {
            vm.runInContext(fs.readFileSync(file, 'utf8'), contextForRunInContext, file);
        } catch (e) {
            log.debug('skipping ' + file + ', it is not a YUI module.');
            return;
        }
        return mod;
    }

    function checkDirectory(startdir, workingdir) {
        var mod;

        // checking if the folder is actually a build folder
        if (existsSync(path.join(workingdir, 'build.json'))) {
            mod = checkBuildFile(path.join(workingdir, 'build.json'));
            if (mod) {
                mods.push(mod);
            }
        }
        // checking subfolders and individual .js files
        fs.readdirSync(workingdir).forEach(function (name) {
            var mod,
                relative,
                stat,
                buildconfig,
                p = path.join(workingdir, name);

            if (existsSync(path.join(p, 'build.json'))) {
                mod = checkBuildFile(path.join(p, 'build.json'));
                if (mod) {
                    mods.push(mod);
                }
            } else {
                stat = fs.statSync(p);
                if (stat.isDirectory()) {
                    checkDirectory(startdir, p);
                } else if ('.js' === path.extname(p)) {
                    mod = checkYUIModule(p);
                    if (mod) {
                        mods.push(mod);
                    }
                }
            }
        });
    }

    dirs.forEach(function (relative) {
        log.info('module lookup at `' + path.join(cwd, relative) + '`');
        checkDirectory(cwd, path.join(cwd, relative));
    });

    return mods;
};
