# Chess Analysis

Chess Analysis is a tool for generating analysis of chess games Made with [Bun](https://bun.sh) and [Stockfish](https://github.com/official-stockfish/Stockfish)


## Prerequisites

* [Bun.sh](https://bun.sh)

## Installation

```bash
git clone https://github.com/yourusername/chess-analysis.git
cd chess-analysis
bun install
bun index.js
```
## Usage

```
usage: chess-analysis [-h] [--depth DEPTH] GAME

Chess Game Analysis CLI

positional arguments:
  GAME                  Game can either be a local .pgn file or a lichess.org or chess.com game URL

optional arguments:
  -h, --help            show this help message and exit
  --depth DEPTH, -d DEPTH
                        Depth of analysis
```