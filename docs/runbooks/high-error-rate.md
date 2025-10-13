# Runbook: High Error Rate

**Alert:** `HighErrorRate` — more than 5% of requests returning 5xx over 5 minutes

## Diagnosis

```bash
# Check recent backend errors
docker compose logs --tail=200 backend | grep -E '"level":"ERROR"|"level":"CRITICAL"'

# Check which endpoints are failing (from Grafana or nginx logs)
docker compose logs nginx | grep '" [5-9][0-9][0-9] '

# Check DB and Redis health
curl https://api.your-domain.com/api/v1/health/detailed
```

## Common causes and fixes

### Database connection exhaustion
- Symptom: errors containing `QueuePool limit`, `too many connections`
- Fix: Increase `DB_POOL_SIZE` in `.env`, restart backend
- Immediate: `docker compose restart backend` to clear stale connections

### LLM provider failures
- Symptom: errors from OpenAI/Anthropic/Google API calls
- Check: look for `openai`, `anthropic`, or `google` in error logs
- Fix: verify API keys are valid and have quota remaining; switch `DEFAULT_LLM_PROVIDER` if one provider is down

### OOM / memory pressure
- Symptom: container exits with code 137
- Fix: check `docker stats`, increase container memory limits or reduce pool sizes

### Bad deploy
- Symptom: errors started immediately after a deploy
- Fix: roll back (see [deploy-rollback.md](deploy-rollback.md))

## Recovery verification

After fixing, confirm the error rate drops on the Grafana dashboard and the readiness probe returns `"status": "ready"`:

```bash
watch -n5 'curl -s https://api.your-domain.com/api/v1/health/ready | python3 -m json.tool'
```
