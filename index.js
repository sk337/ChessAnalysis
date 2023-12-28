#!/bin/env bun

import { ArgumentParser } from "argparse";
import { Chess } from "chess.js";

const parser = new ArgumentParser({
  description: "Chess Game Analysis CLI",
});

parser.add_argument("GAME", {
  help: "Game can either be a local .pgn file or a lichess.org or chess.com game URL",
});

function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

async function GetchesscomGame(gameurl) {
  const game = await Bun.fetch(`https://api.chess.com/pub/game/${gameurl.split("/").pop().split("?")[0]}`);
  return game.json();
}

async function GetLichessGame(gameurl) {
  const game = await Bun.fetch(`https://lichess.org/game/export/${gameurl.split("/")[3]}`);
  return game.text();
}

const args = parser.parse_args();

let mode;

if (args.GAME.endsWith(".pgn")) {
  mode = "pgn";
} else if (isUrl(args.GAME)) {
  let url = new URL(args.GAME);
  if (url.hostname === "lichess.org") {
    mode = "lichess";
  } else if (url.hostname === "chess.com") {
    mode = "chesscom";
  } else {
    throw new Error("Invalid game");
  }
} else {
  throw new Error("Invalid game");
}

const file = Bun.file(args.GAME);

const chess = new Chess();

if (mode === "pgn") {
  chess.loadPgn(file.text()+"");
} else if (mode === "chesscom") { 
  const json = await GetchesscomGame(args.GAME);
  chess.loadPgn(json.pgn);
} else if (mode === "lichess") {
  let t=await GetLichessGame(args.GAME);
  console.log(t);
  chess.loadPgn(t);
}


