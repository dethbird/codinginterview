# 9) Error Model and Observability

Clients want typed errors; SRE needs traceability; PII must be scrubbed.

---

## Error Taxonomy and Shape

Codes: UNAUTHENTICATED, FORBIDDEN, BAD_USER_INPUT, RESOURCE_NOT_FOUND, VERSION_CONFLICT, RATE_LIMITED, DOWNSTREAM_TIMEOUT, CIRCUIT_OPEN, INTERNAL_SERVER_ERROR.

Each error entry includes message, path, and extensions:
```json
{
  "extensions": {
    "code": "DOWNSTREAM_TIMEOUT",
    "service": "inventory",
    "httpStatus": 504,
    "requestId": "abc-123",
    "retryable": true
  }
}
```

Partial data: keep successful fields; null failing paths with errors array entries.

---

## Logging, Tracing, and Metrics

- Correlate with requestId and pass to downstreams.  
- Use OpenTelemetry: root span per operation; resolver spans and outbound HTTP/DB spans.  
- Redact PII: only whitelist fields. Mask emails and never log tokens/passwords.  
- Sampling: 100 percent for errors, 1-10 percent success.

Metrics to watch:
- Error rates by extensions.code and by operation.  
- p50/p95 latency per operation and hot fields.  
- Cache hit ratios, breaker opens, retry counts.

---

## Testing and SLOs

- Unit tests for resolver exceptions to ensure correct codes.  
- Integration chaos tests simulating timeouts and 5xx.  
- Persisted operation snapshots to prevent error regressions.  
- SLOs per operation with burn-rate alerts.
