const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const cwd = process.cwd();

// Find the file by its unique import signature
let result;
try {
  result = execSync(
    `grep -rl 'breedsData from "@/data/breeds.json"' --include="*.ts" --include="*.tsx" .`,
    { encoding: "utf8", cwd }
  ).trim();
} catch {
  console.log("No matching file found — skipping");
  process.exit(0);
}

const files = result.split("\n").filter(Boolean);

for (const rawFile of files) {
  // Safety check: ensure the resolved path stays within the working directory
  const resolved = path.resolve(cwd, rawFile);
  if (!resolved.startsWith(cwd + path.sep)) {
    console.warn(`Skipping out-of-bounds path: ${rawFile}`);
    continue;
  }

  let src = fs.readFileSync(resolved, "utf8");

  // 1. Remove the JSON import
  src = src.replace(/^import breedsData from "@\/data\/breeds\.json";\n/m, "");

  // 2. Uncomment the real API block
  src = src.replace(
    /\/\/ Real API integration \(commented out[^\n]*\n((?:\/\/[^\n]*\n)+)/,
    (_, block) => block.replace(/^\/\/ ?/gm, "")
  );

  // 3. Remove the mock implementations
  src = src.replace(
    /\nexport async function fetchBreeds[^}]+\}\n\nexport async function fetchBreedById[^}]+\}/s,
    ""
  );

  fs.writeFileSync(resolved, src.trimEnd() + "\n");
  console.log(`Transformed: ${rawFile}`);
}
