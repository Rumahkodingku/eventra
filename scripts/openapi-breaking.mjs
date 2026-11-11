import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const current = "apps/api/openapi/openapi.yaml";
const baseRef = process.env.OPENAPI_BASE_REF ?? "origin/main";
const baseFile = process.env.OPENAPI_BASE_FILE;
const oasdiff = process.env.OASDIFF_BIN ?? "oasdiff";
const tempDir = mkdtempSync(join(tmpdir(), "eventra-openapi-"));

try {
  let basePath;
  if (baseFile) {
    basePath = baseFile;
  } else {
    try {
      const content = execFileSync(
        "git",
        ["show", `${baseRef}:${current}`],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      basePath = join(tempDir, "base.yaml");
      writeFileSync(basePath, content);
    } catch {
      console.log(
        `Skipping OpenAPI breaking check: no baseline at ${baseRef}:${current}.`,
      );
      process.exit(0);
    }
  }

  const currentContent = readFileSync(current, "utf8");
  if (basePath !== baseFile) {
    const baseContent = readFileSync(basePath, "utf8");
    if (baseContent === currentContent) {
      console.log("OpenAPI breaking check: no changes.");
      process.exit(0);
    }
  }

  try {
    execFileSync(
      oasdiff,
      ["breaking", basePath, current, "--fail-on", "ERR", "--format", "text"],
      { stdio: "inherit" },
    );
  } catch (error) {
    console.error("OpenAPI breaking changes detected.");
    process.exit(typeof error.status === "number" ? error.status : 1);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
