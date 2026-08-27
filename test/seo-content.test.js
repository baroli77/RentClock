import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GUIDES } from "../lib/guides.js";
import { MARKETING_PAGES } from "../lib/marketing-pages.js";
import { TOOLS } from "../lib/tools.js";

function wordCount(page) {
  return [page.title, page.lead, ...page.points.flat(), ...page.sections.flat(2), ...page.workflow, ...page.faqs.flat()]
    .join(" ").trim().split(/\s+/).length;
}

test("commercial pages stay substantial and carry FAQ content", () => {
  assert.equal(Object.keys(MARKETING_PAGES).length, 4);
  for (const [slug, page] of Object.entries(MARKETING_PAGES)) {
    assert.ok(wordCount(page) >= 700, `${slug} dropped below 700 words`);
    assert.ok(page.sections.length >= 6, `${slug} needs six distinct sections`);
    assert.ok(page.faqs.length >= 5, `${slug} needs five FAQs`);
  }
});

test("homepage and shared footer link every commercial page", async () => {
  const [home, chrome] = await Promise.all([
    readFile(new URL("../app/page.js", import.meta.url), "utf8"),
    readFile(new URL("../components/PublicChrome.jsx", import.meta.url), "utf8"),
  ]);
  for (const slug of Object.keys(MARKETING_PAGES)) {
    assert.match(home, new RegExp(`href=["']/${slug}["']`));
    assert.match(chrome, new RegExp(`href=["']/${slug}["']`));
  }
});

test("guide cluster has unique slugs and valid internal routes", () => {
  assert.ok(GUIDES.length >= 16, "guide cluster has shrunk below 16 static guides");
  const slugs = GUIDES.map((guide) => guide.slug);
  assert.equal(new Set(slugs).size, slugs.length, "guide slugs must be unique");
  const publicRoutes = new Set([
    "/", "/pricing", "/login", "/about", "/guides", "/tools",
    ...Object.keys(MARKETING_PAGES).map((slug) => `/${slug}`),
    ...Object.keys(TOOLS).map((slug) => `/tools/${slug}`),
    ...slugs.map((slug) => `/guides/${slug}`),
  ]);
  for (const guide of GUIDES) {
    assert.ok(guide.sources?.length, `${guide.slug} has no official sources`);
    for (const link of guide.internalLinks || []) {
      assert.ok(publicRoutes.has(link.url), `${guide.slug} links to missing route ${link.url}`);
    }
  }
});
