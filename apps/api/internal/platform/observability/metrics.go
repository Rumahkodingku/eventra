package observability

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type HTTPKey struct {
	Method string
	Path   string
	Status int
}

type httpMetric struct {
	Count  atomic.Int64
	Errors atomic.Int64
	Nanos  atomic.Int64
}

var (
	httpMu      sync.Mutex
	httpMetrics = map[HTTPKey]*httpMetric{}
	businessMu  sync.Mutex
	business    = map[string]*atomic.Int64{}
)

func RecordHTTP(method, path string, status int, latency time.Duration) {
	if path == "" {
		path = "unmatched"
	}
	key := HTTPKey{Method: method, Path: path, Status: status}
	httpMu.Lock()
	metric := httpMetrics[key]
	if metric == nil {
		metric = &httpMetric{}
		httpMetrics[key] = metric
	}
	httpMu.Unlock()
	metric.Count.Add(1)
	if status >= 500 {
		metric.Errors.Add(1)
	}
	metric.Nanos.Add(latency.Nanoseconds())
}

func Inc(name string) { Add(name, 1) }

func Add(name string, delta int64) {
	if name == "" {
		return
	}
	businessMu.Lock()
	counter := business[name]
	if counter == nil {
		counter = &atomic.Int64{}
		business[name] = counter
	}
	businessMu.Unlock()
	counter.Add(delta)
}

func Value(name string) int64 {
	businessMu.Lock()
	counter := business[name]
	businessMu.Unlock()
	if counter == nil {
		return 0
	}
	return counter.Load()
}

func Render() string {
	var builder strings.Builder
	builder.WriteString("# HELP eventra_http_requests_total HTTP requests by route and status.\n")
	builder.WriteString("# TYPE eventra_http_requests_total counter\n")
	httpMu.Lock()
	keys := make([]HTTPKey, 0, len(httpMetrics))
	for key := range httpMetrics {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].Path != keys[j].Path {
			return keys[i].Path < keys[j].Path
		}
		if keys[i].Method != keys[j].Method {
			return keys[i].Method < keys[j].Method
		}
		return keys[i].Status < keys[j].Status
	})
	for _, key := range keys {
		metric := httpMetrics[key]
		labels := fmt.Sprintf(`method=%q,path=%q,status="%d"`, key.Method, key.Path, key.Status)
		fmt.Fprintf(&builder, "eventra_http_requests_total{%s} %d\n", labels, metric.Count.Load())
		fmt.Fprintf(&builder, "eventra_http_request_errors_total{%s} %d\n", labels, metric.Errors.Load())
		fmt.Fprintf(&builder, "eventra_http_request_duration_seconds_sum{%s} %f\n", labels,
			float64(metric.Nanos.Load())/float64(time.Second))
	}
	httpMu.Unlock()
	builder.WriteString("# HELP eventra_business_total Domain event counters.\n")
	builder.WriteString("# TYPE eventra_business_total counter\n")
	businessMu.Lock()
	names := make([]string, 0, len(business))
	for name := range business {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		fmt.Fprintf(&builder, "eventra_business_total{name=%q} %d\n", name, business[name].Load())
	}
	businessMu.Unlock()
	return builder.String()
}
