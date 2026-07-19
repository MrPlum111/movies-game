# MoviesGame

Film-graph speedrun: go from one title to another via cast, directors, writers, and producers.

## Local setup

```bash
npm install
cp .env.example .env.local
# Add your TMDB Read Access Token to .env.local
npm run dev
```

## Environment

| Variable | Description |
|----------|-------------|
| `TMDB_ACCESS_TOKEN` | TMDB API Read Access Token (server-side only) |

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Set `TMDB_ACCESS_TOKEN` in Project → Settings → Environment Variables.
4. Deploy.

This product uses the TMDB API but is not endorsed or certified by TMDB.
