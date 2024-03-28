const ejs = require('ejs');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Read the configuration file
const global = yaml.load(fs.readFileSync(path.join(__dirname, 'configs/global.yaml'), 'utf8'));
const schedules = yaml.load(fs.readFileSync(path.join(__dirname, 'configs/schedules.yaml'), 'utf8'));

// Render global.upcoming
latest = schedules[0];
global.upcoming = `${latest.presenter} will present a/an ${latest.conf} paper on ${latest.time}, ${latest.date} at ${latest.location}.`;

// Render index.ejs
const index = ejs.render(fs.readFileSync(path.join(__dirname, 'index.ejs'), 'utf8'), { global, schedules });

// Write the rendered HTML to index.html
fs.writeFileSync(path.join(__dirname, 'index.html'), index);