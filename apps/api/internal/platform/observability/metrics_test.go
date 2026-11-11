package observability

import (
	"strings"
	"testing"
	"time"
)

func TestRenderHTTPAndBusinessMetrics(t *testing.T) {
	RecordHTTP("GET", "/api/v1/events", 200, 10*time.Millisecond)
	RecordHTTP("POST", "/api/v1/checkout/orders", 500, 20*time.Millisecond)
	Inc("checkout_orders_total")
	output := Render()
	for _, expected := range []string{
		`eventra_http_requests_total{method="GET",path="/api/v1/events",status="200"} 1`,
		`eventra_http_request_errors_total{method="POST",path="/api/v1/checkout/orders",status="500"} 1`,
		`eventra_business_total{name="checkout_orders_total"} 1`,
	} {
		if !strings.Contains(output, expected) {
			t.Fatalf("Render() missing %q:\n%s", expected, output)
		}
	}
}
