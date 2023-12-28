#!/bin/env bun

import { ArgumentParser } from "argparse";
import { Chess } from "chess.js";

const parser = new ArgumentParser({
  description: "Chess Game Analysis CLI",
});

parser.add_argument("FILENAME", {
  help: "File must be a .pgn file",
});

const args = parser.parse_args();

let mode;

if (args.FILENAME.endsWith(".pgn")) {
  mode = "pgn";
} else {
  throw new Error("File must be a .pgn file");
}

const file = Bun.file(args.FILENAME);

const chess = new Chess();
if (mode === "pgn") {
  chess.load_pgn(file.text()+"");
}

