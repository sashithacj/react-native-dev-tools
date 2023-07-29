const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const packagePath = path.join(__dirname, '../package.json');
const outputPath = path.join(__dirname, '../dist');

const packageJson = require(packagePath);

// Get all files in dist folder
const files = fs.readdirSync(outputPath).map(file => `./dist/${file}`);

// Update the extraResources field in package.json
packageJson.config.forge.packagerConfig.extraResources = files;

// Find the main entry point
const mainEntry = glob.sync(path.join(__dirname, '../dist/main*.js'))[0];

// Update the main field in package.json
if (mainEntry) {
  // eslint-disable-next-line n/no-path-concat
  packageJson.main = './' + path.relative(__dirname + '/..', mainEntry);
}
// Add the application's icon
packageJson.config.forge.packagerConfig.icon = './dist/assets/phone.icns';

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
