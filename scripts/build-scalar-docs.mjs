import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  readFileSync(
    join(root, "node_modules/@scalar/api-reference/package.json"),
    "utf8",
  ),
);
const source = join(
  root,
  "node_modules/@scalar/api-reference/dist/browser/standalone.js",
);
const target = join(
  root,
  "apps/api/internal/platform/docs/assets/scalar.js",
);

const bundle = readFileSync(source, "utf8").replace(
  /\n\/\/# sourceMappingURL=.*$/,
  "",
);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, bundle);
writeFileSync(join(dirname(target), "version.txt"), `${packageJson.version}\n`);
console.log(
  `Scalar API Reference ${packageJson.version} -> ${target}`,
);
