#!/usr/bin/node

import * as fs from "fs";

import srtValidator from "srt-validator";

import { exec } from "child_process";

type SupportedLanguages = {
  [key: string]: string;
};

const supportedLanguages: SupportedLanguages = {
  _pt: "pt-PT",
  _en: "en-US",
  _es: "es-ES",
  _fr: "fr-FR",
};

// Change this to the folder where you have the SRT files
const dirPath = "/dir";

function hasLineStartingWithSpace(str: string): boolean {
  const regex: RegExp = /^ +/gm;

  return regex.test(str);
}

function hasOutOfPlaceCharacters(str: string) {
  // Remove all non-letter characters and split the string into an array of words
  const words = str
    .replace(/[^a-zA-Z]+/g, " ")
    .trim()
    .split(" ");

  // Check each word for an out of place character
  for (let i = 0; i < words.length; i++) {
    if (/[a-z]\p{Lu}[a-z]/u.test(words[i])) {
      return true;
    }
  }

  return false;
}

function spellAllFilescheck() {
  const command = `cspell --no-progress --show-suggestions --locale "pt-PT, en-US, fr-FR, es-ES" "${dirPath}/*.srt"`;

  var result = exec(command);

  result?.stdout?.on("data", function(data) {
    console.log(data);
  });
}

// Run Cspell on the captions folder, scan all files
//spellAllFilescheck();

// Go through all files in folder
fs.readdir(dirPath, (err, files) => {
  if (err) throw err;

  const srtFiles = files.filter((file) => file.endsWith(".srt"));

  srtFiles.forEach((file) => {
    const filePath = `${dirPath}/${file}`;

    // Read SRT file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) throw err;

      // Result is either an empty array (all good) or with errors inside
      const result = srtValidator(data);

      if (result.length !== 0) {
        // Bad file
        console.log(`${file} - ${result}`);
      }

      // Check for uppercase letters outside usual places
      if (hasOutOfPlaceCharacters(data)) {
        console.log(
          `${file} - Out of place uppercase letters, open and check file`
        );
      }

      if (hasLineStartingWithSpace(data)) {
        console.log(`${file} - There's at least 1 line starting with a space`);
      }
    });
  });
});
