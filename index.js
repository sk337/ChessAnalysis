#!/bin/env bun
/**
 * Chess Game Analysis CLI
 *
 * @fileoverview This script analyzes chess games from different sources such as local .pgn files, lichess.org, and chess.com game URLs.
 * It determines the source of the game based on the input argument and loads the game using the chess.js library.
 * The analysis is performed by parsing the PGN (Portable Game Notation) format.
 *
 * @requires argparse
 * @requires chess.js
 */

import { ArgumentParser } from "argparse";
import { Chess } from "chess.js";

const parser = new ArgumentParser({
  description: "Chess Game Analysis CLI",
});

parser.add_argument("GAME", {
  help: "Game can either be a local .pgn file or a lichess.org or chess.com game URL",
});


/**
 * Checks if a string is a valid URL.
 *
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string is a valid URL, false otherwise.
 */
function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Fetches a chess.com game using the game URL.
 *
 * @param {string} gameurl - The chess.com game URL.
 * @returns {Promise<object>} - A promise that resolves to the game data in JSON format.
 */
async function GetchesscomGame(gameurl) {
  const game = await Bun.fetch(`https://api.chess.com/pub/game/${gameurl.split("/").pop().split("?")[0]}`);
  return game.json();
}

/**
 * Fetches a lichess.org game using the game URL.
 *
 * @param {string} gameurl - The lichess.org game URL.
 * @returns {Promise<string>} - A promise that resolves to the game data in PGN format.
 */
async function GetLichessGame(gameurl) {
  const game = await Bun.fetch(`https://lichess.org/game/export/${gameurl.split("/")[3]}`);
  return game.text();
}

const args = parser.parse_args();

let mode;

// determine game source
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
  chess.loadPgn(t);
}


