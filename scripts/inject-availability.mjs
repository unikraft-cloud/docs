#!/usr/bin/env node
/* Zudoku's markdown export copies the raw page body, so the availability
   block that `src/remarkAvailability.ts` inserts never reaches the exported
   `.md` files or `llms-full.txt`. This script runs after `zudoku build` and
   writes the same facts as a blockquote under the title of each exported
   page, so an agent that reads the markdown sees them too. */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const PAGES_DIR = path.join(ROOT, "pages");
const DIST_DIR = path.join(ROOT, "dist", "docs");
const SITE_URL = "https://unikraft.com/docs";
const HOSTING_URL = `${SITE_URL}/platform/hosting-options`;
const MARKER = "**Availability**";
const MARKER_LINE = `> ${MARKER}`;

const HOSTING = { cloud: "Unikraft Cloud", dedicated: "dedicated hosts", byoc: "BYOC", "on-prem": "on-prem" };
const INTERFACES = { api: "the API", cli: "the CLI", sdk: "the SDKs" };
const TARGETS = { ...HOSTING, dedicated: "Dedicated", "on-prem": "On-prem", api: "API", cli: "CLI", sdk: "SDKs" };
const STATUS = { preview: "Preview", "coming-soon": "Coming soon" };

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.mdx?$/.test(entry.name) ? [full] : [];
    }),
  );
  return files.flat();
};

const readFrontmatter = (text) => {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  return match ? parse(match[1]) : undefined;
};

const joinNames = (names) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

const absoluteUrl = (link, pageUrl) => {
  if (link.startsWith("#")) return pageUrl + link;
  if (link.startsWith("/")) return SITE_URL + link;
  return link;
};

const describeMarks = (marks, labels, { on, soon, off, decorate = (key, label) => label }) => {
  const groups = { on: [], soon: [], off: [] };
  for (const [key, label] of Object.entries(labels)) {
    const mark = marks[key] ?? true;
    if (mark === "soon") groups.soon.push(label);
    else if (mark === false) groups.off.push(label);
    else groups.on.push(decorate(key, label, mark));
  }
  const parts = [];
  if (groups.on.length) parts.push(on(joinNames(groups.on)));
  if (groups.soon.length) parts.push(soon(joinNames(groups.soon)));
  if (groups.off.length) parts.push(off(joinNames(groups.off)));
  return parts.join(" ");
};

const describe = (availability, pageUrl) => {
  const paragraphs = [];

  if (availability.hosting) {
    const hosting = describeMarks(availability.hosting, HOSTING, {
      on: (names) => `Available on ${names}.`,
      soon: (names) => `Coming soon on ${names}.`,
      off: (names) => `Not available on ${names}.`,
      decorate: (key, label, mark) => {
        let name = label;
        if (key === "cloud" && availability.plan === "enterprise") name += " (enterprise plan)";
        if (mark === "differs") name += " (with differences, see the notes)";
        return name;
      },
    });
    const status = STATUS[availability.status];
    paragraphs.push(status ? `${hosting} Status: ${status}.` : hosting);
  }

  if (availability.interfaces) {
    paragraphs.push(
      describeMarks(availability.interfaces, INTERFACES, {
        on: (names) => `Exposed by ${names}.`,
        soon: (names) => `Coming soon in ${names}.`,
        off: (names) => `Not exposed by ${names} yet.`,
      }),
    );
  }

  const notes = (availability.notes ?? []).map((note) => {
    const target = note.target ? `${TARGETS[note.target] ?? note.target}: ` : "";
    const link = note.link ? ` [${note.linkText ?? "Learn more"}](${absoluteUrl(note.link, pageUrl)})` : "";
    return `- ${target}${note.text}${link}`;
  });
  if (notes.length) paragraphs.push(notes.join("\n"));

  paragraphs.push(`See [Hosting options](${HOSTING_URL}).`);

  const body = paragraphs.join("\n\n");
  return [MARKER, "", ...body.split("\n")].map((line) => (line ? `> ${line}` : ">")).join("\n");
};

const injectAfterTitle = (text, block) => {
  if (text.includes(MARKER_LINE)) return text;
  const match = /^# [^\n]*\n/.exec(text);
  if (!match) return undefined;
  return `${match[0]}\n${block}\n${text.slice(match[0].length)}`;
};

const main = async () => {
  const llmsFullPath = path.join(DIST_DIR, "llms-full.txt");
  let llmsFull = await readFile(llmsFullPath, "utf8").catch(() => undefined);
  let count = 0;

  for (const file of await walk(PAGES_DIR)) {
    const availability = readFrontmatter(await readFile(file, "utf8"))?.availability;
    if (!availability) continue;

    const route = `/${path.relative(PAGES_DIR, file).replace(/\.mdx?$/, "")}`;
    const block = describe(availability, SITE_URL + route);

    const mdPath = path.join(DIST_DIR, `${route}.md`);
    const md = await readFile(mdPath, "utf8").catch(() => undefined);
    if (md === undefined) {
      console.warn(`availability: no markdown export for ${route}, skipped`);
      continue;
    }
    const injected = injectAfterTitle(md, block);
    if (injected === undefined) {
      console.warn(`availability: ${route}.md has no title line, skipped`);
      continue;
    }
    await writeFile(mdPath, injected, "utf8");
    count++;

    if (llmsFull !== undefined) {
      /* Each document in llms-full.txt starts with a URL line, one or more
         blank lines, then the same title line as its .md file. */
      const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const section = new RegExp(`(^URL: \\S*${escaped}\\n\\n+)(# [^\\n]*\\n)`, "m");
      llmsFull = llmsFull.replace(section, (_, head, title) => `${head}${title}\n${block}\n`);
    }
  }

  if (llmsFull !== undefined) await writeFile(llmsFullPath, llmsFull, "utf8");
  console.log(`availability: injected into ${count} markdown exports`);
};

await main();
