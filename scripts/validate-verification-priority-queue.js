#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const errors = [];
const policy = yaml.load(fs.readFileSync('_data/verification-priority-policy.yml','utf8'));
const demand = yaml.load(fs.readFileSync('_data/verification-demand.yml','utf8'));
const report = JSON.parse(fs.readFileSync('reports/verification-priority-queue.json','utf8'));

if (policy.model !== 'verification-priority-v1') errors.push('Priority policy model must be verification-priority-v1');
if (Number(policy.schema_version) !== 1) errors.push('Priority policy schema_version must be 1');
if (Number(demand.schema_version) !== 1) errors.push('Demand schema_version must be 1');
if (!Array.isArray(report.procedures)) errors.push('Priority queue report procedures array missing');
if (report.totalProcedures !== 421) errors.push(`Priority queue expected 421 procedures; found ${report.totalProcedures}`);

const actionable = report.procedures.filter(x => !['verified','deprecated'].includes(x.governance_state));
let lastRank = 0;
let lastScore = Infinity;
for (const row of actionable) {
  if (!Number.isInteger(row.rank) || row.rank <= lastRank) errors.push(`Invalid queue rank for ${row.slug}`);
  lastRank = row.rank;
  if (row.priority_score > lastScore && row.promotion_ready !== true) {
    // Promotion-ready rows are intentionally sorted first even when lower-scored.
    errors.push(`Unexpected priority score ordering around ${row.slug}`);
  }
  if (!row.promotion_ready) lastScore = Math.min(lastScore, row.priority_score);
  if (row.priority_score < 0 || row.priority_score > 100) errors.push(`Score out of range for ${row.slug}`);
  if (!['immediate','next','planned','backlog'].includes(row.queue_band)) errors.push(`Invalid queue band for ${row.slug}`);
  if (row.search_demand_source === 'temporary_topic_proxy' && !row.temporary_proxy_match) {
    errors.push(`Temporary proxy source lacks match explanation for ${row.slug}`);
  }
}

const files = fs.readdirSync('_procedures').filter(x=>x.endsWith('.md'));
if (files.length !== 421) errors.push(`Procedure count changed: expected 421, found ${files.length}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Verification priority queue validation passed: ${report.totalProcedures} procedures, ${actionable.length} actionable.`);
console.log(`Queue bands: ${JSON.stringify(report.queueBandCounts)}.`);
