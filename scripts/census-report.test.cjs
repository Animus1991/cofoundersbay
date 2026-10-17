const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

describe('census report', () => {
  it('tags the known card exceptions and names every other card over five styles', async () => {
    const mod = await import(pathToFileURL(join(__dirname, 'census-report.mjs')).href);
    const exceptions = JSON.parse(readFileSync(join(__dirname, 'census-exceptions.json'), 'utf8'));
    assert.ok(exceptions.cardType.some((row) => row.route === '/commitments/'));
    assert.ok(exceptions.clarity.some((row) => row.route === '/settings'));
    const report = mod.nameCardCensus([
      { route: '/commitments/need-1', detail: [{ card: 'div "Terms"', styles: 9 }, { card: 'div "Quiet"', styles: 4 }] },
      { route: '/mentor/sessions', detail: [{ card: 'div "Thursday"', styles: 7 }] },
    ]);
    assert.equal(report.known.length, 1);
    assert.equal(report.known[0].route, '/commitments/need-1');
    assert.match(report.known[0].reason, /offer changed/);
    assert.equal(report.unnamed.length, 1);
    assert.equal(report.unnamed[0].route, '/mentor/sessions');
    assert.equal(report.unnamed[0].styles, 7);
  });

  it('tags a clarity route that is already an exception', async () => {
    const mod = await import(pathToFileURL(join(__dirname, 'census-report.mjs')).href);
    const report = mod.nameClarityCensus([
      { route: '/settings', shadows: [], tints: ['danger'], frames: [], offAxis: [], centered: [], glyphs: [], dupes: [], echoes: [], landmark: true },
      { route: '/opportunities', shadows: [], tints: [], frames: [], offAxis: ['alert'], centered: [], glyphs: [], dupes: [], echoes: [], landmark: true },
    ]);
    assert.equal(report.known.length, 1);
    assert.equal(report.known[0].route, '/settings');
    assert.equal(report.unnamed.length, 1);
    assert.equal(report.unnamed[0].route, '/opportunities');
  });
});
