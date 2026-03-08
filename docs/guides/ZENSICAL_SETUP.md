# Zensical search — setup guide

This document describes how to configure and validate the Zensical search integration used by the documentation site (landing). It covers:

- the client request/response contract;
- how to configure `NEXT_PUBLIC_ZENSICAL_API_URL` for the landing site;
- an example server-side proxy for protecting API keys;
- validation and troubleshooting steps.

## Overview

- The client UI component is at `landing/app/components/DocSearch.tsx`. It reads `NEXT_PUBLIC_ZENSICAL_API_URL` at runtime and issues GET requests to the `/search` endpoint.
- Do not expose secret API keys to browsers. If your Zensical instance requires authentication, host a server-side proxy that injects the secret and forwards results to the client.

## Client configuration

1. Configure the client base URL.

Add or update `NEXT_PUBLIC_ZENSICAL_API_URL` in `landing/.env.local` or your deployment environment:

```
NEXT_PUBLIC_ZENSICAL_API_URL=https://zensical.example.com
```

1. Request pattern

The client issues HTTP GET requests using the following pattern:

```
GET ${NEXT_PUBLIC_ZENSICAL_API_URL}/search?q=<url-encoded-query>
```

1. Expected response shape

The `DocSearch` client component expects the search endpoint to return JSON matching this shape:

```json
{
  "results": [
    { "title": "string", "url": "string", "excerpt": "string" }
  ]
}
```

If your search API uses a different shape, update `landing/app/components/DocSearch.tsx` to map the response to the above shape before calling `setResults(...)`.

## Server-side proxy (recommended when API key required)

If Zensical requires authentication, host a small proxy that:

- accepts browser requests at `/search?q=...`;
- appends required authentication headers (for example `Authorization: Bearer <KEY>`);
- forwards the request to the Zensical API and returns the JSON response unchanged.

Example Node/Express proxy (save as a short script and run in a secure environment):

```javascript
const express = require('express')
const fetch = require('node-fetch')
require('dotenv').config()

const app = express()
const BASE = process.env.ZENSICAL_BASE_URL
const KEY = process.env.ZENSICAL_API_KEY

app.get('/search', async (req, res) => {
  const q = req.query.q || ''
  const url = `${BASE.replace(/\/$/, '')}/search?q=${encodeURIComponent(q)}`
  const headers = { 'Accept': 'application/json' }
  if (KEY) headers['Authorization'] = `Bearer ${KEY}`
  const r = await fetch(url, { headers })
  const body = await r.text()
  res.status(r.status).type('application/json').send(body)
})

const port = process.env.PORT || 4003
app.listen(port, () => console.log(`Zensical proxy listening on ${port}`))
```

Usage notes:

1. Create a `.env` for the proxy process with the following variables:

```
ZENSICAL_BASE_URL=https://zensical.example.com
ZENSICAL_API_KEY=<your-secret>
PORT=4003
```

1. Install dependencies and run the proxy (from project root or a subfolder):

```bash
npm install express node-fetch dotenv
node path/to/proxy.js
```

1. Point the landing site to the proxy by setting `NEXT_PUBLIC_ZENSICAL_API_URL` to the proxy base URL:

```
NEXT_PUBLIC_ZENSICAL_API_URL=http://localhost:4003
```

The proxy preserves the response payload and avoids leaking secret keys to the browser.

## Validation and troubleshooting

1. Validate connectivity with `curl` from the machine that can reach the proxy or Zensical:

```bash
curl "${NEXT_PUBLIC_ZENSICAL_API_URL}/search?q=install"
```

1. Expected result: HTTP 200 with JSON matching the expected `results` array. Verify `title`, `url`, and `excerpt` fields are present.

2. If you receive HTTP 401/403 from Zensical, confirm the proxy is attaching the correct `Authorization` header and that the secret is correct.

3. If results are empty, verify the Zensical index contains the documentation content and that the query parameter is forwarded unchanged.

## Further adaptations

If your Zensical instance requires a different request pattern or returns a different JSON shape, provide the exact request and response examples and update `landing/app/components/DocSearch.tsx` to map the API response to the expected client shape.

If desired, add a CI step to build Zensical and publish the generated static site to the `landing/public/docs` directory. See `.github/workflows/zensical-pages.yml` for an example workflow used in this repository.
