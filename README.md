# Rail Shift

Restore a railway signal pattern by sliding two adjacent tracks in opposite directions. Tracks wrap around, so every shift moves both signals and gaps. Six puzzles introduce longer tracks and more junctions.

Open `index.html` in a browser. The arrow buttons shift each pair. On a keyboard, Up and Down choose a pair, Left and Right shift, and Z undoes the last move. The target pattern is visible throughout, and hints label the next shortest move.

Built for [GitHub Game Off 2026](https://itch.io/jam/game-off-2026). The game uses original procedural board graphics, HTML, CSS, and JavaScript. Codex assisted with the implementation, interface and validation.

The solver was compared with exhaustive breadth-first search across all 7,712 reachable states of the six layouts. Desktop and mobile browser checks covered a win, level advance, undo, and touch-size arrow controls.
