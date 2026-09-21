/*
 * Build of the vis-2 (React) widget set.
 *
 * Careful with the `widgets/` folder: unlike a pure vis-2 widget set it is NOT generated here. It also holds the
 * vis-1 widget set (`widgets/metro.html` and `widgets/metro/**`), which is maintained by hand and still shipped
 * for vis. Only the sub folder of the React build is deleted and rebuilt.
 */
const { deleteFoldersRecursive, buildReact, npmInstall, copyFiles } = require('@iobroker/build-tools');
const fs = require('node:fs');

/** Where the built React widget set ends up. Must match `common.visWidgets.*.url` in io-package.json. */
const TARGET = 'widgets/vis-2-widgets-metro';

function copyAllFiles() {
    copyFiles(['src-widgets/build/**/*', '!src-widgets/build/index.html'], `${TARGET}/`);
}

/**
 * Keeps the version in the vis-1 widget set in sync with package.json.
 *
 * Only `widgets/metro.html` carries the version of this adapter - in the header comment and in
 * `vis.binds.metro`. `widgets/metro/js/metro.js` is a vendored copy of the Metro UI jQuery plugins and the
 * `version:` fields in it (`metro.inputControl` 1.0.0, `metro.metroSlider` 1.0.2, ...) belong to that library,
 * so it must NOT be rewritten here.
 */
function syncLegacyVersion() {
    const pack = require('./package.json');

    const file = 'widgets/metro.html';
    const content = fs.readFileSync(`${__dirname}/${file}`, 'utf8');
    const updated = content.replace(/version: "\d+\.\d+\.\d+"/g, `version: "${pack.version}"`);
    if (content !== updated) {
        fs.writeFileSync(`${__dirname}/${file}`, updated);
        console.log(`${file} updated`);
    }
}

if (process.argv.includes('--copy-files')) {
    copyAllFiles();
} else if (process.argv.includes('--build')) {
    buildReact(`${__dirname}/src-widgets`, { rootDir: __dirname, vite: true }).catch(e => {
        console.error(`Error by build: ${e}`);
        process.exit(1);
    });
} else if (process.argv.includes('--version')) {
    syncLegacyVersion();
} else {
    syncLegacyVersion();
    deleteFoldersRecursive(`${__dirname}/src-widgets/build`);
    deleteFoldersRecursive(`${__dirname}/${TARGET}`);
    npmInstall('src-widgets')
        .then(() => buildReact(`${__dirname}/src-widgets`, { rootDir: __dirname, vite: true }))
        .then(() => copyAllFiles())
        .catch(e => {
            console.error(`Error by build: ${e}`);
            process.exit(1);
        });
}
