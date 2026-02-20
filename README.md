# code-react-krizzal-khowpo-quiz
quick application related to khowpa questions of krizzal

## Configuration

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUBMIT_SCORE_URL` | No | URL of the Supabase Edge Function that records quiz scores. If unset, score submission is silently skipped. |
| `VITE_BASE_URL` | No | Base path for the app (default `/`). Set to `/<repo-name>/` when hosting on GitHub Pages without a custom domain. |

Copy `.env.example` to `.env.local` and fill in the values for local development:

```sh
cp .env.example .env.local
```

### GitHub Actions / Pages

Add `VITE_SUBMIT_SCORE_URL` as a repository secret (**Settings → Secrets and variables → Actions**), then pass it to the build step in `.github/workflows/deploy.yml`:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_BASE_URL: "/"
    VITE_SUBMIT_SCORE_URL: ${{ secrets.VITE_SUBMIT_SCORE_URL }}
```

