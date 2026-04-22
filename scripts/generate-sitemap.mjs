#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE_URL = process.env.SITE_URL || 'https://cite.review';
const ROOT = process.cwd();
const OUTPUT = join(ROOT, 'sitemap.xml');

const CHANGEFREQ_BY_PAGE = {
  'index.html': 'weekly',
  'faq.html': 'monthly',
  'api-setup.html': 'monthly',
};

const PRIORITY_BY_PAGE = {
  'index.html': '1.0',
  'faq.html': '0.8',
  'api-setup.html': '0.8',
};

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getHtmlFiles() {
  return readdirSync(ROOT)
    .filter((name) => name.endsWith('.html'))
    .filter((name) => !name.startsWith('.'))
    .sort((a, b) => {
      if (a === 'index.html') return -1;
      if (b === 'index.html') return 1;
      return a.localeCompare(b);
    });
}

function toLoc(fileName) {
  if (fileName === 'index.html') return `${SITE_URL}/`;
  return `${SITE_URL}/${fileName}`;
}

function buildUrlEntry(fileName) {
  const fullPath = join(ROOT, fileName);
  const lastmod = toIsoDate(statSync(fullPath).mtime);
  const changefreq = CHANGEFREQ_BY_PAGE[fileName] || 'monthly';
  const priority = PRIORITY_BY_PAGE[fileName] || '0.7';

  return [
    '  <url>',
    `    <loc>${escapeXml(toLoc(fileName))}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

function buildSitemapXml(files) {
  const header = '<?xml version="1.0" encoding="UTF-8"?>';
  const open = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const close = '</urlset>';
  const body = files.map(buildUrlEntry).join('\n');
  return `${header}\n${open}\n${body}\n${close}\n`;
}

function fileChanged(path, content) {
  try {
    return readFileSync(path, 'utf8') !== content;
  } catch {
    return true;
  }
}

const htmlFiles = getHtmlFiles();
if (htmlFiles.length === 0) {
  console.error('No HTML files found in repository root.');
  process.exit(1);
}

const xml = buildSitemapXml(htmlFiles);
if (fileChanged(OUTPUT, xml)) {
  writeFileSync(OUTPUT, xml, 'utf8');
  console.log(`Updated sitemap.xml (${htmlFiles.length} URLs).`);
} else {
  console.log(`sitemap.xml is already up to date (${htmlFiles.length} URLs).`);
}