#! /usr/bin/env ts-node

import * as fs from "fs";
import srtValidator from "srt-validator";

import { hasLineStartingWithSpace, hasOutOfPlaceCharacters, getLatestVersionFiles, getOlderVersionFiles, spellcheckAllFiles } from './utils';

// Use this to take the path as a "--PATH=" argument
// const dirPath = path.resolve(process.env.npm_config_path || ""); // Change this to the folder where you have the SRT files

const dirPath = process.argv[2];
if (!dirPath) {
    console.error("Please provide a directory path as an argument.");
    process.exit(1);
}

// Process all SRT files in the specified directory
fs.readdir(dirPath, (err, files) => {
  if (err) throw err;

  const latestVersionFiles = getLatestVersionFiles(files);
  const olderVersionFiles = getOlderVersionFiles(dirPath).map(file => `${dirPath}/${file}`);

  // We want to exclude older versions of the captions from being spellchecked
  spellcheckAllFiles(olderVersionFiles, dirPath)

  // Run the validator on the most recent version of each caption
  latestVersionFiles.forEach(file => {

    const filePath = `${dirPath}/${file}`;

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) throw err;

      const validationResult = srtValidator(data);
      if (validationResult.length !== 0) console.log(`${file} - ${JSON.stringify(validationResult, null, 2)}`);

      if (hasOutOfPlaceCharacters(data)) {
        console.log(`${file} - Out of place uppercase letters, open and check file`);
      }

      if (hasLineStartingWithSpace(data)) {
        console.log(`${file} - There's at least 1 line starting with a space`);
      }
    });
  });
});
