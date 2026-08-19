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

The game uses compact season JSON generated from NBA.com through the open-source `nba_api` client. It includes every regular season from 1980–81 forward and all 22 supported categories. This keeps the deployed game fast and avoids making fragile NBA.com requests from players' browsers.

To refresh the data:

```bash
python3 -m venv .venv
.venv/bin/pip install nba_api pandas
.venv/bin/python scripts/generate_data.py
```

Commit the updated `data/stats.json` file to publish it.

This is an independent fan project and is not affiliated with the NBA.
