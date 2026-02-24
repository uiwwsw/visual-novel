# API Error Guide v1

## Response Shape

All error responses must follow:

```json
{
  "code": "PLAN_LIMIT_EXCEEDED",
  "message": "This feature requires a Pro plan.",
  "details": {},
  "correlationId": "corr_abc123"
}
```

## Required Codes

- `AUTH_REQUIRED` -> `401`
- `FORBIDDEN_ROLE` -> `403`
- `INVALID_REQUEST` -> `400`
- `PLAN_LIMIT_EXCEEDED` -> `402`
- `SCENARIO_VALIDATION_FAILED` -> `422`
- `VERSION_CONFLICT` -> `409`
- `CONFIG_MISSING` -> `500`
- `INTEGRATION_FAILED` -> `500`
- `BUILD_FAILED` -> `500`
- `DEPLOY_FAILED` -> `500`

## Policy

- SEO build/deploy on free tier must return `402 PLAN_LIMIT_EXCEEDED`.
- Role mismatch must return `403 FORBIDDEN_ROLE`.
- Scenario optimistic lock mismatch must return `409 VERSION_CONFLICT`.
- Scenario validator endpoint must return `422 SCENARIO_VALIDATION_FAILED` with issue details.
