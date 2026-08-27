import test from "node:test";
import assert from "node:assert/strict";
import { indexingSummary, sitemapUrls } from "../lib/search-console-indexing.js";

test("sitemap URL parsing keeps only RentClock URLs and decodes entities", () => {
  const xml = `<urlset><url><loc>https://rentclock.com/</loc></url><url><loc>https://rentclock.com/guides?a=1&amp;b=2</loc></url><url><loc>https://example.com/nope</loc></url></urlset>`;
  assert.deepEqual(sitemapUrls(xml, "https://rentclock.com"), ["https://rentclock.com/", "https://rentclock.com/guides?a=1&b=2"]);
});

test("indexing summary distinguishes discovered and crawled exclusions", () => {
  assert.deepEqual(indexingSummary([
    { verdict: "PASS", coverage_state: "Submitted and indexed" },
    { verdict: "NEUTRAL", coverage_state: "Discovered - currently not indexed" },
    { verdict: "NEUTRAL", coverage_state: "Crawled - currently not indexed" },
    { verdict: "VERDICT_UNSPECIFIED", inspection_error: "quota" },
  ]), { total: 4, indexed: 1, notIndexed: 2, discovered: 1, crawled: 1, errors: 1 });
});
