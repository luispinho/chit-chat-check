#!/usr/bin/node

import * as fs from "fs";
import srtValidator from "srt-validator";
import { exec } from "child_process";

import util from "node:util";
import path from "path";

// promisify exec
const execPromise = util.promisify(exec);

const dirPath = path.resolve(process.env.npm_config_path || ""); // Change this to the folder where you have the SRT files

// Check if a string has a line starting with a space
function hasLineStartingWithSpace(str: string): boolean {
  return /^ +/gm.test(str);
}

// Check if a string has uppercase letters outside the usual places
function hasOutOfPlaceCharacters(str: string): boolean {
  const words = str.replace(/[^a-zA-Z]+/g, " ").trim().split(" ");
  return words.some(word => /[a-z]\p{Lu}[a-z]/u.test(word));
}

/**
* Run Cspell on all files in a directory and log suggestions.
* An array of older version files can be passed in to exclude them from being spellchecked.
*/
function spellcheckAllFiles(olderVersionFiles: string[]) {

  try {

    // Create a glob of all the files to exclude
    const excludedFilesGlob = "\"{" + olderVersionFiles.join(",") + "}\""

    // Set the command to run
    const command = `cspell --no-progress --color --show-suggestions --locale "pt-PT, en-US, fr-FR, es-ES" --exclude ${excludedFilesGlob} "${dirPath}/*.srt"`;

    // Run the command
    const result = execPromise(command, {
      cwd: '/'
    }).child;

    result?.stdout?.on('data', function(data) {
      process.stdout.write(data);
    });

    result?.stderr?.on('data', function(data) {
      process.stdout.write('stderr: ' + data);
    });

  } catch (error) {
    console.error(error);
  }
}

/**
* Get the latest version of each file. If there are multiple files with the same name, only the latest version is returned.
* Example: getLatestVersionFiles(["file2_v1.srt", "file2_v2.srt"]) => ["file2_v2.srt"]
*/
const getLatestVersionFiles = (files: string[]): string[] => {
  const fileGroups: { [key: string]: string[] } = {};

  files.forEach(file => {
    const versionMatch = file.match(/^(.+?)(_v\d+)/i);
    if (versionMatch && versionMatch[1]) {
      const baseName = versionMatch[1];
      fileGroups[baseName] = fileGroups[baseName] || [];
      fileGroups[baseName].push(file);
    }
  });

  return Object.values(fileGroups).map(group => group.sort().pop() as string);
};

/**
* Get all files that are not the latest version of each file. If there are multiple files with the same name, only the older versions are returned.
* This is used for manually excluding older versions from being spellchecked.
* Example: getOlderVersionFiles(["file2_v1.srt", "file2_v2.srt"]) => ["file2_v1.srt"]
*/
const getOlderVersionFiles = (folderPath: string): string[] => {
  const files = fs.readdirSync(folderPath);
  const fileGroups: { [key: string]: string[] } = {};

  files.forEach(file => {
    const versionMatch = file.match(/^(.+?)(_v\d+)/i);
    if (versionMatch && versionMatch[1]) {
      const baseName = versionMatch[1];
      fileGroups[baseName] = fileGroups[baseName] || [];
      fileGroups[baseName].push(file);
    }
  });

  return Object.values(fileGroups).flatMap(group => {
    group.sort();
    group.pop(); // Remove the latest version
    return group; // Return the remaining older versions
  });
};

// Process all SRT files in the specified directory
fs.readdir(dirPath, (err, files) => {
  if (err) throw err;


  const latestVersionFiles = getLatestVersionFiles(files);
  const olderVersionFiles = getOlderVersionFiles(dirPath).map(file => `${dirPath}/${file}`);

  // We want to exclude older versions of the captions from being spellchecked
  spellcheckAllFiles(olderVersionFiles)

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
