import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import YAML from "yaml";

const spec = YAML.parse(readFileSync("apps/api/openapi/openapi.yaml", "utf8"));
const generated = readFileSync(
  "packages/api-client/src/generated/schema.ts",
  "utf8",
);

assert.equal(spec.openapi, "3.1.0");
assert.ok(spec.info?.title);
assert.ok(spec.info?.version);
assert.ok(spec.components?.schemas?.ErrorEnvelope);
assert.ok(spec.components?.schemas?.Error);

const requiredErrorFields = spec.components.schemas.Error.required ?? [];
assert.ok(requiredErrorFields.includes("code"));
assert.ok(requiredErrorFields.includes("message"));

const operationIds = new Set();
const paths = Object.entries(spec.paths ?? {});
assert.ok(paths.length >= 20, "expected a meaningful endpoint inventory");

for (const [path, item] of paths) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const operation = item[method];
    if (!operation) continue;
    assert.ok(operation.operationId, `${method.toUpperCase()} ${path} missing operationId`);
    assert.ok(!operationIds.has(operation.operationId), `duplicate operationId ${operation.operationId}`);
    operationIds.add(operation.operationId);
  }
}

const refs = JSON.stringify(spec).match(/"\$ref":"#\/components\/[^"]+"/g) ?? [];
for (const ref of refs) {
  const pointer = JSON.parse(`{${ref}}`).$ref.replace("#/", "").split("/");
  let node = spec;
  for (const part of pointer) {
    node = node?.[part];
  }
  assert.ok(node, `unresolved $ref ${ref}`);
}

assert.match(generated, /"\/health\/live"/);
assert.match(generated, /ErrorEnvelope/);

function isErrorEnvelope(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      value.error &&
      typeof value.error.code === "string" &&
      typeof value.error.message === "string",
  );
}

assert.equal(
  isErrorEnvelope({ error: { code: "VALIDATION_FAILED", message: "Invalid" } }),
  true,
);
assert.equal(isErrorEnvelope({ error: { message: "Invalid" } }), false);

console.log(
  `OpenAPI contract OK: ${operationIds.size} operations across ${paths.length} paths.`,
);
