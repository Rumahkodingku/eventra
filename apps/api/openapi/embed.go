package openapi

import _ "embed"

// YAML is the OpenAPI contract served by the API docs handler.
//
//go:embed openapi.yaml
var YAML []byte
