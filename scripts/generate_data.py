"""Generate compact season files consumed by The 50 Line."""

import json
import time
from datetime import date
from pathlib import Path

from nba_api.stats.endpoints import leaguedashplayerstats

FIRST_SEASON = 1979
LAST_SEASON = date.today().year if date.today().month >= 10 else date.today().year - 1
OUTPUT = Path(__file__).resolve().parents[1] / "data"
SOURCE_COLUMNS = [
    "MIN", "FGM", "FGA", "FG_PCT", "FG3M", "FG3A", "FG3_PCT",
    "FTM", "FTA", "FT_PCT", "OREB", "DREB", "REB", "AST", "STL",
    "BLK", "TOV", "PTS", "PF",
]


def season_id(start: int) -> str:
    return f"{start}-{str(start + 1)[-2:]}"


def number(value):
    if value is None:
        return None
    try:
        result = float(value)
        return int(result) if result.is_integer() else round(result, 4)
    except (TypeError, ValueError):
        return None


def fetch_season(start: int) -> dict:
    season = season_id(start)
    response = leaguedashplayerstats.LeagueDashPlayerStats(
        season=season,
        season_type_all_star="Regular Season",
        per_mode_detailed="Totals",
        timeout=90,
    )
    frame = response.get_data_frames()[0]
    players = []
    for _, row in frame.iterrows():
        stats = {column: number(row.get(column)) for column in SOURCE_COLUMNS}
        missed_fg = (stats["FGA"] or 0) - (stats["FGM"] or 0)
        missed_ft = (stats["FTA"] or 0) - (stats["FTM"] or 0)
        stats["EFF"] = sum(stats[key] or 0 for key in ("PTS", "REB", "AST", "STL", "BLK")) - missed_fg - missed_ft - (stats["TOV"] or 0)
        stats["AST_TO"] = round(stats["AST"] / stats["TOV"], 4) if stats["TOV"] else None
        stats["STL_TOV"] = round(stats["STL"] / stats["TOV"], 4) if stats["TOV"] else None
        players.append({"name": row["PLAYER_NAME"], "team": row["TEAM_ABBREVIATION"], "stats": stats})
    return {"season": season.replace("-", "–"), "startYear": start, "players": players}


def main() -> None:
    seasons_dir = OUTPUT / "seasons"
    seasons_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    for start in range(FIRST_SEASON, LAST_SEASON + 1):
        destination = seasons_dir / f"{season_id(start)}.json"
        print(f"Fetching {season_id(start)}...", flush=True)
        payload = fetch_season(start)
        destination.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
        manifest.append({"season": payload["season"], "startYear": start, "file": destination.name})
        time.sleep(0.6)
    (OUTPUT / "manifest.json").write_text(json.dumps({"seasons": manifest}, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(manifest)} seasons to {seasons_dir}")


if __name__ == "__main__":
    main()
