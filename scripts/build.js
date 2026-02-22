#!/usr/bin/env node
/**
 * Cross-platform build script: copies web assets to www/ for Capacitor
 * Works on Windows, macOS, and Linux without bash
 */
var fs = require('fs');
var path = require('path');

var PROJECT_DIR = path.resolve(__dirname, '..');
var WWW_DIR = path.join(PROJECT_DIR, 'www');

function rmdir(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function(entry) {
        var p = path.join(dir, entry);
        if (fs.statSync(p).isDirectory()) { rmdir(p); } else { fs.unlinkSync(p); }
    });
    fs.rmdirSync(dir);
}

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function(entry) {
        var s = path.join(src, entry);
        var d = path.join(dest, entry);
        if (fs.statSync(s).isDirectory()) { copyDir(s, d); } else { fs.copyFileSync(s, d); }
    });
}

console.log('Building web assets into ' + WWW_DIR + '...');

// Clean previous build
rmdir(WWW_DIR);
fs.mkdirSync(WWW_DIR, { recursive: true });

// Copy HTML files
fs.readdirSync(PROJECT_DIR).forEach(function(f) {
    if (f.endsWith('.html')) {
        fs.copyFileSync(path.join(PROJECT_DIR, f), path.join(WWW_DIR, f));
    }
});

// Copy directories
['js', 'api', 'images', 'assets', 'img', 'icons', 'fonts', 'css'].forEach(function(dir) {
    copyDir(path.join(PROJECT_DIR, dir), path.join(WWW_DIR, dir));
});

// Copy individual files
['manifest.json', 'sw.js', 'service-worker.js', 'favicon.ico', 'robots.txt'].forEach(function(f) {
    var src = path.join(PROJECT_DIR, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(WWW_DIR, f));
});

console.log('Build complete! Files copied to www/');
var files = fs.readdirSync(WWW_DIR);
console.log('  ' + files.length + ' items: ' + files.slice(0, 20).join(', '));
