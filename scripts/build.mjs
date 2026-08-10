import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "dist/server");

const html = await readFile(resolve(projectRoot, "index.html"), "utf8");

/* Runtime assets are local so the page works from a GitHub Pages subpath, from
   the filesystem, and from the worker. The worker has no static bucket, so the
   same files are embedded here and served from /vendor/*. Text assets stay text
   (they gzip well); binary fonts are base64 and decoded once at module scope. */
const MIME = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".wav": "audio/wav"
};

const vendorDirectory = resolve(projectRoot, "vendor");
const vendorNames = (await readdir(vendorDirectory))
  .filter((name) => !name.startsWith("._") && MIME[extname(name)])
  .sort();

const textAssets = {};
const binaryAssets = {};
const publicAssets = {};

for (const name of vendorNames) {
  const extension = extname(name);
  const bytes = await readFile(resolve(vendorDirectory, name));
  if (extension === ".woff2") binaryAssets[name] = bytes.toString("base64");
  else textAssets[name] = bytes.toString("utf8");
}

const publicDirectory = resolve(projectRoot, "public");
const publicNames = (await readdir(publicDirectory))
  .filter((name) => !name.startsWith("._") && MIME[extname(name)])
  .sort();
for (const name of publicNames) {
  const bytes = await readFile(resolve(publicDirectory, name));
  publicAssets[name] = bytes.toString("base64");
}

const worker = `const html = ${JSON.stringify(html)};

const MIME = ${JSON.stringify(MIME)};
const TEXT_ASSETS = ${JSON.stringify(textAssets)};
const BASE64_ASSETS = ${JSON.stringify(binaryAssets)};
const PUBLIC_ASSETS = ${JSON.stringify(publicAssets)};

const IMMUTABLE = "public, max-age=31536000, immutable";
const REVALIDATE = "public, max-age=0, must-revalidate";

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const decodedBinary = new Map();

function securityHeaders(contentType, cacheControl) {
  return {
    "content-type": contentType,
    "cache-control": cacheControl,
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()"
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const head = request.method === "HEAD";

    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    if (url.pathname.startsWith("/vendor/")) {
      const name = url.pathname.slice("/vendor/".length);
      const extension = name.slice(name.lastIndexOf("."));
      const contentType = MIME[extension];

      if (contentType && Object.hasOwn(TEXT_ASSETS, name)) {
        return new Response(head ? null : TEXT_ASSETS[name], {
          status: 200,
          headers: securityHeaders(contentType, IMMUTABLE)
        });
      }

      if (contentType && Object.hasOwn(BASE64_ASSETS, name)) {
        if (!decodedBinary.has(name)) decodedBinary.set(name, decodeBase64(BASE64_ASSETS[name]));
        return new Response(head ? null : decodedBinary.get(name), {
          status: 200,
          headers: securityHeaders(contentType, IMMUTABLE)
        });
      }

      return new Response(head ? null : "Not found", {
        status: 404,
        headers: securityHeaders("text/plain; charset=utf-8", REVALIDATE)
      });
    }

    const publicName = url.pathname.startsWith("/public/")
      ? url.pathname.slice("/public/".length)
      : url.pathname.slice(1);
    if (url.pathname.startsWith("/") && Object.hasOwn(PUBLIC_ASSETS, publicName)) {
      const name = publicName;
      if (!decodedBinary.has(name)) decodedBinary.set(name, decodeBase64(PUBLIC_ASSETS[name]));
      return new Response(head ? null : decodedBinary.get(name), {
        status: 200,
        headers: securityHeaders(MIME[name.slice(name.lastIndexOf("."))] || "application/octet-stream", IMMUTABLE)
      });
    }

    return new Response(head ? null : html, {
      status: 200,
      headers: securityHeaders("text/html; charset=utf-8", REVALIDATE)
    });
  }
};
`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "index.js"), worker);

const kb = (value) => `${(value / 1024).toFixed(1)} KB`;
console.log(`index.html        ${kb(Buffer.byteLength(html))}`);
for (const name of vendorNames) {
  const asset = textAssets[name] ?? binaryAssets[name];
  console.log(`vendor/${name.padEnd(28)} ${kb(Buffer.byteLength(asset))}`);
}
for (const name of publicNames) console.log(`public/${name.padEnd(28)} ${kb(Buffer.byteLength(publicAssets[name]))}`);
console.log(`dist/server/index.js  ${kb(Buffer.byteLength(worker))}`);
