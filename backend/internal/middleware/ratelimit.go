package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type ipLimiter struct {
	mu          sync.Mutex
	counts      map[string]int
	windowStart map[string]time.Time
	limit       int
	window      time.Duration
}

// NewIPRateLimiter returns a middleware that allows at most `limit` requests
// per `window` for each client IP, using a fixed-window counter kept in memory.
func NewIPRateLimiter(limit int, window time.Duration) gin.HandlerFunc {
	l := &ipLimiter{
		counts:      make(map[string]int),
		windowStart: make(map[string]time.Time),
		limit:       limit,
		window:      window,
	}

	return func(c *gin.Context) {
		ip := c.ClientIP()

		l.mu.Lock()
		now := time.Now()
		start, ok := l.windowStart[ip]
		if !ok || now.Sub(start) > l.window {
			l.windowStart[ip] = now
			l.counts[ip] = 0
		}
		l.counts[ip]++
		count := l.counts[ip]
		l.mu.Unlock()

		if count > l.limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, please try again later"})
			return
		}

		c.Next()
	}
}
