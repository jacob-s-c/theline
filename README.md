# The 50 Line

An NBA stats ranking game: given a season and category, pick the player who finished closest to rank 50 without going over.

## Scoring

- Ranks 1–50 score their rank.
- Rank 50 is a perfect 50 points.
- Rank 51 or lower scores 0 points.
- A run contains five rounds with one player pick per round.

## Run locally

No dependencies or build step are required. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 4173
```

Then visit <http://localhost:4173>.

## Data

The MVP uses a small bundled historical dataset in `app.js`. A production version should replace it with a larger verified dataset or backend stats integration.

This is an independent fan project and is not affiliated with the NBA.
