import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "node_modules", "@document-kits", "viewer", "dist", "generic");
const targetDir = path.join(rootDir, "public", "document-viewer");

if (!fs.existsSync(sourceDir)) {
  console.warn("[document-viewer] Skipping asset sync: source assets not found.");
  process.exit(0);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`[document-viewer] Synced assets to ${targetDir}`);
