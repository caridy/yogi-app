var YOGI_PATH = process.env.YOGI_PATH,
    path = require('path'),
    fs = require('fs'),
    util = require(path.join(YOGI_PATH, 'lib/util')),
    log = require(path.join(YOGI_PATH, 'lib/log')),
    timethat = require('timethat'),
    vm = require('vm'),
    contextForRunInContext = vm.createContext({
        require: require,
        module: require('module'),
        console: {
            log: function () {}
        },
        window: {},
        document: {},
        YUI: null
    });

var mods = {
    base: '', // TODO/HACK: issue with yogi in node 0.10.0
    checkYUIModule: function (path) {
        var file,
            module;

        file = fs.readFileSync(path, 'utf8');
        contextForRunInContext.YUI = {
            add: function (name, fn, version, config) {
                module = {
                    name: name,
                    path: path,
                    version: version,
                    config: config || {}
                };
            }
        };
        try {
            vm.runInContext(file, contextForRunInContext, path);
        } catch (e) {
            // skipping in silence
            // log.info('skipping ' + path + ', it is not a YUI module.');
        }
        return module;
    },
    checkDirectory: function (workingdir) {
        var self = this,
            dirs = fs.readdirSync(workingdir),
            entries = [];
        dirs.forEach(function (mod) {
            var p = path.join(workingdir, mod), stat, entry;
            if (util.exists(p)) {
                stat = fs.statSync(p);
                if (stat.isDirectory()) {
                    entries = entries.concat(self.checkDirectory(p));
                } else if (path.extname(p) === '.js') {
                    entry = self.checkYUIModule(p);
                    if (entry) {
                        entries.push(entry);
                    }
                }
            }
        });
        return entries;
    },
    processYUIModules: function () {
        var self = this;

        this.data.yuimodules.forEach(function (mod) {
            self.parseData(mod.name, mod.config, mod.path);
        });

    },
    scan: function () {
        var self = this,
            dirs = fs.readdirSync(this.start),
            metaFiles = [],
            yuiModules = [];

        dirs.forEach(function (d) {
            if (self.strict) {
                if (!util.exists(path.join(self.base, d, 'build.json'))) {
                    return; //No build.json file, exclude this automatically
                }
            }
            var p = path.join(self.base, d, 'meta'),
                files;
            if (util.exists(p)) {
                files = fs.readdirSync(p);
                files.forEach(function (f) {
                    if (path.extname(f) === '.json') {
                        metaFiles.push(path.join(p, f));
                    }
                });
            }
        });

        yuiModules = this.checkDirectory(this.start);

        if (!metaFiles.length && !yuiModules.length) {
            log.bail('Something went very wrong here, could not find meta data or yui modules to parse.');
        }

        log.info('found ' + metaFiles.length + ' .json files to parse.');
        log.info('found ' + yuiModules.length + ' yui modules to parse.');
        log.info('parsing now...');

        this.data.files = metaFiles;
        this.data.yuimodules = yuiModules;

    },
    begin: function () {
        var start = new Date();
        this.scan();
        this.process();
        this.processYUIModules();
        this.reduce();
        this.writeJSON();
        this.conditionals();
        this.writeJS();
        this.writeConds();

        log.info('done generating meta data in ' + timethat.calc(start, new Date()));

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
            '--group loader group name'
        ];
    }
};

util.mix(exports, mods);
