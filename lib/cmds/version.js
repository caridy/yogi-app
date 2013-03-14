var YOGI_PATH = process.env.YOGI_PATH,
    path = require('path'),
    log = require(path.join(YOGI_PATH, 'lib/log')),
    util = require(path.join(YOGI_PATH, 'lib/util')),
    http = require('http'),
    request,
    latest,
    fs = require('fs'),
    pack = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')),
    version = pack.version,
    mods = {
        init: function() {
            request = http.get('http://registry.npmjs.org/yogi-app/latest', function (res) {
                var c = '';
                res.on('data', function (chunk) {
                    c += chunk;
                });
                res.on('end', function () {
                    var json = JSON.parse(c);
                    latest = json.version;
                    if (version < latest) {
                        console.log(log.color('!!!WARNING!!!', 'red'));
                        console.log(log.color('your version ' + version + ' is out of date, the latest available version is ' + latest, 'red'));
                        console.log(log.color('update with: npm -g install yogi-app', 'blue'));
                        process.exit(1);
                    }
                });
            }).on('error', function () {
                console.log(version);
                process.exit(0);
            });
            setTimeout(function () {
                request.abort();
                console.log(version);
                process.exit(0);
            }, 500);
        },
        pack: pack,
        version: version,
        help: function() {
            return ['-v, --version', 'show yogi-app version'];
        }
    };

util.mix(exports, mods);
