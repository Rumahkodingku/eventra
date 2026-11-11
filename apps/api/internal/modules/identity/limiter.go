package identity

import (
	"sync"
	"time"
)

type attemptLimiter struct {
	mu       sync.Mutex
	attempts map[string][]time.Time
	limit    int
	window   time.Duration
}

func newAttemptLimiter(limit int, window time.Duration) *attemptLimiter {
	return &attemptLimiter{
		attempts: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (l *attemptLimiter) allow(key string) bool {
	now := time.Now()
	cutoff := now.Add(-l.window)

	l.mu.Lock()
	defer l.mu.Unlock()

	recent := l.attempts[key][:0]
	for _, attempt := range l.attempts[key] {
		if attempt.After(cutoff) {
			recent = append(recent, attempt)
		}
	}
	if len(recent) >= l.limit {
		l.attempts[key] = recent
		return false
	}
	l.attempts[key] = append(recent, now)
	return true
}
