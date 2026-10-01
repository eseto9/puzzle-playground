# Puzzle Playground

Eight bite-sized logic puzzles you can race a friend on. Each takes about one to two minutes, every puzzle is generated fresh with exactly one solution, and when you're stuck there is a **Give up and see the answer** button.

## The puzzles

| Puzzle | What you do |
| --- | --- |
| **Jungle** | Place animals on terrain tiles so every picture clue is true |
| **Alibi** | Work out when each haunted-party guest arrived from timeline clues |
| **Bridges** | Drag one continuous plank bridge across every tile, visiting islands in order |
| **Pup Parade** | Line the dogs up by rule cards (next to, not next to, left of, between, spot numbers...) |
| **Lineup** | Rule out faces with tricky clues, then accuse the culprit (wrong guesses cost 8 seconds) |
| **Untangle** | Drag nodes until no lines cross |
| **Layers** | Restack paper cut-outs to match a target picture |
| **Hues** | Swap tiles to rebuild a 4x4 colour gradient |

## Modes

- **Daily puzzle**: one game and one puzzle for everyone each day, with a fastest-time leaderboard.
- **Keep playing**: every puzzle is generated on demand from a random seed, so you never see the same one twice.
- **Race a friend**: you each pick five puzzles in order, a draw flips a coin on every row to decide whose pick you both play, then you race through them side by side. You can see which puzzle your friend is on and how fast they solved each one. Results move an **Elo** rating shown on a board by name.

## Run it

It is a single static page with no dependencies.

```sh
./build.sh          # bundles src/ into index.html
open index.html     # or serve it with any static server
npm test            # checks every generator produces valid, uniquely solvable puzzles
```

This project was built as a [Claude](https://claude.ai) artifact, which provides `db`, `room` and `user` capabilities for the daily board, Elo board and live races. Outside that host (e.g. GitHub Pages) it falls back to a free public MQTT relay for the same features (see `src/relay.js`), and degrades to local-only play if that relay can't be reached.

## How it works

- `src/logic*.js` hold the seeded RNG and the puzzle generators. Each generator builds a random solution, writes true clues, and keeps adding or trimming clues until a solver confirms there is exactly one answer.
- `src/*.js` for each game contain the DOM/SVG UI. Every game returns `reveal()` (show the answer), `celebrate()` (the win animation) and `destroy()`.
- `src/registry.js` registers the games and caches generated puzzles so the next one can be prepared while you look at your result.
- Races are deterministic: both players derive identical puzzles and the same coin flips from a shared seed, so only tiny progress messages cross the wire.

## License

MIT
