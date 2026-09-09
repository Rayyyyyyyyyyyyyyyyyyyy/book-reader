import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../..");
const manuscriptDir = join(projectRoot, "book-reader/book");
const isPublicBuild = process.argv.includes("--public");
const outputDir = isPublicBuild
  ? join(projectRoot, "site/public/manuscript")
  : join(projectRoot, "site/.offline-reader");
const outputFile = join(outputDir, "index.html");
const serviceWorkerFile = join(outputDir, "sw.js");
const templateFile = join(scriptDir, "manuscript-reader-template.html");
const port = Number.parseInt(process.env.READER_PORT ?? "4178", 10);
const host = process.argv.includes("--phone") ? "0.0.0.0" : "127.0.0.1";

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const titleOf = (markdown) => markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "未命名章節";

function lineNumberAt(markdown, index) {
  return markdown.slice(0, index).split("\n").length;
}

function blockLineRanges(markdown, firstLine = 1, lastLine = Number.POSITIVE_INFINITY) {
  const lines = markdown.split("\n");
  const ranges = [];
  let start = null;

  const finish = (end) => {
    if (start === null) return;
    const first = lines[start - 1]?.trim() ?? "";
    if (!first.startsWith("# ")) ranges.push({ start, end });
    start = null;
  };

  for (let line = firstLine; line <= Math.min(lastLine, lines.length); line += 1) {
    const value = lines[line - 1];
    if (!value.trim()) {
      finish(line - 1);
      continue;
    }
    if (start === null) start = line;
  }
  finish(Math.min(lastLine, lines.length));
  return ranges;
}

function splitPart(markdown, prefix) {
  const sourceTitle = titleOf(markdown);
  const partTitle = sourceTitle.replace(/（引言・練習・小結）$/, "");
  const introStart = markdown.indexOf("## 部引言");
  const practiceStart = markdown.indexOf("## 練習");
  if (introStart < 0 || practiceStart < 0) {
    throw new Error(`${prefix} 缺少「部引言」或「練習」標題`);
  }
  const introLine = lineNumberAt(markdown, introStart);
  const practiceLine = lineNumberAt(markdown, practiceStart);

  return [
    {
      key: `${prefix.toLowerCase()}-intro`,
      title: partTitle,
      markdown: `# ${partTitle}\n\n${markdown.slice(introStart, practiceStart).trim()}\n`,
      blockLines: blockLineRanges(markdown, introLine, practiceLine - 1),
    },
    {
      key: `${prefix.toLowerCase()}-practice`,
      title: `${partTitle}｜練習與小結`,
      markdown: `# ${partTitle}｜練習與小結\n\n${markdown.slice(practiceStart).trim()}\n`,
      blockLines: blockLineRanges(markdown, practiceLine),
    },
  ];
}

async function buildReader() {
  const names = (await readdir(manuscriptDir)).filter((name) => name.endsWith(".md"));
  const fileByPrefix = new Map(names.map((name) => [name.split("-")[0], name]));
  const source = new Map();

  for (const [prefix, name] of fileByPrefix) {
    source.set(prefix, {
      name,
      markdown: await readFile(join(manuscriptDir, name), "utf8"),
    });
  }

  const required = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "P1", "P2", "P3", "P4"];
  const missing = required.filter((prefix) => !source.has(prefix));
  if (missing.length > 0) throw new Error(`缺少稿件：${missing.join(", ")}`);

  const sectionsByKey = new Map();
  for (const prefix of required) {
    const item = source.get(prefix);
    if (prefix.startsWith("P")) {
      for (const section of splitPart(item.markdown, prefix)) {
        sectionsByKey.set(section.key, { ...section, sourceFile: item.name });
      }
    } else {
      sectionsByKey.set(prefix, {
        key: prefix,
        title: titleOf(item.markdown),
        markdown: item.markdown,
        blockLines: blockLineRanges(item.markdown),
        sourceFile: item.name,
      });
    }
  }

  const readingOrder = [
    "00",
    "p1-intro", "01", "02", "03", "p1-practice",
    "p2-intro", "04", "05", "06", "p2-practice",
    "p3-intro", "07", "08", "09", "p3-practice",
    "p4-intro", "10", "11", "12", "p4-practice",
    "13",
  ];
  const processor = await createMarkdownProcessor({ syntaxHighlight: false });
  const sections = [];

  for (const key of readingOrder) {
    const item = sectionsByKey.get(key);
    if (!item) throw new Error(`無法建立閱讀區段：${key}`);
    const rendered = await processor.render(item.markdown);
    sections.push({ ...item, html: rendered.code });
  }

  const toc = sections
    .map(
      (section, index) =>
        `<button type="button" class="toc-item" data-target="section-${escapeHtml(section.key)}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(section.title)}</button>`,
    )
    .join("\n");
  const options = sections
    .map((section) => `<option value="section-${escapeHtml(section.key)}">${escapeHtml(section.title)}</option>`)
    .join("\n");
  const content = sections
    .map(
      (section, index) => `
        <section
          class="manuscript-section"
          id="section-${escapeHtml(section.key)}"
          data-section-key="${escapeHtml(section.key)}"
          data-source-file="${escapeHtml(section.sourceFile)}"
          data-section-title="${escapeHtml(section.title)}"
          data-block-lines="${escapeHtml(JSON.stringify(section.blockLines))}"
        >
          <div class="section-index">${String(index + 1).padStart(2, "0")} / ${sections.length}</div>
          <div class="chapter-body">${section.html}</div>
        </section>`,
    )
    .join("\n");

  const template = await readFile(templateFile, "utf8");
  const page = template
    .replace("<!-- READER_TOC -->", toc)
    .replace("<!-- READER_OPTIONS -->", options)
    .replace("<!-- READER_CONTENT -->", content)
    .replaceAll("{{SECTION_COUNT}}", String(sections.length));

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputFile, page, "utf8");
  const version = createHash("sha256").update(page).digest("hex").slice(0, 12);
  const serviceWorker = `const CACHE = "rui-xuan-manuscript-${version}";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new URL("./", self.registration.scope).href)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("rui-xuan-manuscript-") && key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(new URL("./", self.registration.scope).href, copy));
    return response;
  }).catch(() => caches.match(new URL("./", self.registration.scope).href)));
});
`;
  await writeFile(serviceWorkerFile, serviceWorker, "utf8");
  return { outputFile, sourceCount: required.length, sectionCount: sections.length };
}

const result = await buildReader();
console.log(`閱讀器已產生：${result.sourceCount} 份來源稿件，${result.sectionCount} 個閱讀區段`);

if (process.argv.includes("--serve")) {
  const html = await readFile(outputFile);
  const serviceWorker = await readFile(serviceWorkerFile);
  const server = createServer((request, response) => {
    if (request.url === "/sw.js") {
      response.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Service-Worker-Allowed": "/",
        "Cache-Control": "no-store",
      });
      response.end(serviceWorker);
      return;
    }
    if (request.url !== "/" && request.url !== "/index.html") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(html);
  });

  server.listen(port, host, () => {
    console.log(`離線閱讀器：http://127.0.0.1:${port}/`);
    if (host === "0.0.0.0") {
      const addresses = Object.values(networkInterfaces())
        .flat()
        .filter((address) => address?.family === "IPv4" && !address.internal)
        .map((address) => address.address);
      addresses.forEach((address) => console.log(`手機同 Wi-Fi 開啟：http://${address}:${port}/`));
    }
  });
}
