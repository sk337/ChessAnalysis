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
import { stockfishPath } from "./config.json";


const parser = new ArgumentParser({
  description: "Chess Game Analysis CLI",
  prog: "chess-analysis",
});

parser.add_argument("GAME", {
  help: "Game can either be a local .pgn file or a lichess.org or chess.com game URL",
});
parser.add_argument("--depth", "-d", {
  help: "Depth of analysis",
  default: 20,
});
parser.add_argument("--force-file", "-f", {
  help: "Force the game to be loaded as a .pgn file regardless of the file extension or url",
  action: "store_true",
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
 * @returns {Promise<Object>} - A promise that resolves to the game data in JSON format.
 * @throws {Error} - If the game cannot be found.
 */
async function GetchesscomGame(gameurl) {
  const gameid=gameurl.split("/").pop().split("?")[0];
  const gameRawData = await Bun.fetch("https://www.chess.com/callback/live/game/"+gameid);
  const gameJson = await gameRawData.json();
  const gameDate= gameJson["game"]["pgnHeaders"]["Date"];
  const searchDate = gameDate.split(".")[0]+"/"+gameDate.split(".")[1];
  const player = gameJson["players"]["top"]["username"];
  const gameArchive= await Bun.fetch("https://api.chess.com/pub/player/"+player+"/games/"+searchDate);
  const gamesjson = await gameArchive.json();
  const gameliveurl = `https://www.chess.com/game/live/${gameid}`;
  for (let i=0; i<gamesjson["games"].length; i++) {
    if (gamesjson["games"][i]["url"] === gameliveurl) {
      return gamesjson["games"][i];
    }
  }
  throw new Error("Could Not find game");
}

/**
 * Fetches a lichess.org game using the game URL.
 *
 * @param {string} gameurl - The lichess.org game URL.
 * @returns {Promise<string>} - A promise that resolves to the game data in PGN format.
 */
async function GetLichessGame(gameurl) {
  const game = await Bun.fetch(`https://lichess.org/game/export/${gameurl.split("/")[3]}?evals=0&clocks=0`);
  if (!game.ok) {
    throw new Error("Invalid game");
  }
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
  } else if (url.hostname.endsWith("chess.com")) {
    mode = "chesscom";
  } else {
    mode = "url";
  }
} else if (args.force_file) {
  mode = "pgn";
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
  chess.loadPgn(await GetLichessGame(args.GAME));
} else if (mode === "url") {
  try {
    chess.loadPgn((await Bun.fetch(args.GAME)).text());
  } catch (e) {
    throw new Error("Game not found: Make sure the URL is correct and it contains Plain Text PGN data");
  }
}

/**
 * Analyzes the chess position using the Stockfish engine.
 *
 * @param {string} position - The chess position in FEN (Forsyth–Edwards Notation) format.
 * @returns {Promise<Object>} - A promise that resolves to the analysis result, including the best move and evaluation.
 */
async function analyze(position) {
  /**
   * @type {string}
   */
  let command = `uci\nposition fen ${position}\ngo depth ${args.depth}\neval\nquit`;
  const engine = Bun.spawn([stockfishPath], {
    stdin: "pipe",
    stdout: "pipe"
  });
  engine.stdin.write(command);
  engine.stdin.flush();
  engine.stdin.end();
  const result = await new Response(engine.stdout).text();
  engine.kill();
  const res = {
    bestmove: result.split("\n").filter(line => line.startsWith("bestmove")).toString().match(/[a-h][1-8][a-h][1-8]/i)[0],
    eval: result.split("\n").filter(line => line.startsWith("Final evaluation")).toString().match(/[+-]\d+.\d+/i)[0],
  };
  return res;
}

console.log(await analyze(chess.fen()));