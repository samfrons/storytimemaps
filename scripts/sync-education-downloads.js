#!/usr/bin/env node
/**
 * Copies the teaching documents from docs/education into public/downloads.
 *
 * docs/education is the single source of truth: /education/workbook and
 * /education/activities render those files at request time. But a teacher
 * clicking "download" gets a static asset, which must live under public/ —
 * so the file exists twice. It was previously copied by hand, which is a
 * silent drift waiting to happen: the page would show an edited worksheet
 * while the download handed out the old one.
 *
 * Runs in prebuild. Safe to run at any time; it only writes when the
 * destination differs.
 *
 * Usage: node scripts/sync-education-downloads.js
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '../docs/education')
const DEST = path.join(__dirname, '../public/downloads')

const DOCUMENTS = ['neighborhood-walk-workbook.md', 'classroom-activities.md']

fs.mkdirSync(DEST, { recursive: true })

let changed = 0
for (const name of DOCUMENTS) {
  const from = path.join(SRC, name)
  const to = path.join(DEST, name)

  if (!fs.existsSync(from)) {
    console.error(`missing  ${path.relative(process.cwd(), from)}`)
    process.exitCode = 1
    continue
  }

  const source = fs.readFileSync(from, 'utf8')
  const current = fs.existsSync(to) ? fs.readFileSync(to, 'utf8') : null

  if (current === source) {
    console.log(`ok       ${name}`)
    continue
  }

  fs.writeFileSync(to, source)
  changed += 1
  console.log(`updated  ${name}`)
}

console.log(`\n${DOCUMENTS.length} documents, ${changed} updated`)
