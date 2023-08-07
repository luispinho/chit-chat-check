#! /usr/bin/env ts-node

import * as fs from "fs";
import { exec } from "child_process";
import util from "node:util";

// promisify exec
const execPromise = util.promisify(exec);

// Check if a string has a line starting with a space
export function hasLineStartingWithSpace(str: string): boolean {
    return /^ +/gm.test(str);
}

// Check if a string has uppercase letters outside the usual places
export function hasOutOfPlaceCharacters(str: string): boolean {
    const words = str.replace(/[^a-zA-Z]+/g, " ").trim().split(" ");
    return words.some(word => /[a-z]\p{Lu}[a-z]/u.test(word));
}

/**
* Run Cspell on all files in a directory and log suggestions.
* An array of older version files can be passed in to exclude them from being spellchecked.
*/
export function spellcheckAllFiles(olderVersionFiles: string[], dirPath: string) {

    // try {

    // Create a glob of all the files to exclude
    const excludedFilesGlob = "\"{" + olderVersionFiles.join(",") + "}\""

    // Set the command to run
    const command = `cspell --no-progress --color --show-suggestions --locale "pt-PT, en-US, fr-FR, es-ES" --exclude ${excludedFilesGlob} "${dirPath}/*.srt"`;


    // Run the command
    execPromise(command, {
        cwd: '/'
    })
        .then(result => {
            console.log("Command completed. No issues found");

            if (result.stdout) {
                console.log("stdout:", result.stdout);
            } else {
                console.log("No stdout.");
            }

            if (result.stderr) {
                console.log("stderr:", result.stderr);
            } else {
                console.log("No stderr.");
            }
        })
        .catch(error => {
            console.error(error.stderr, error.stdout);
        });
}

/**
* Get the latest version of each file. If there are multiple files with the same name, only the latest version is returned.
* Example: getLatestVersionFiles(["file2_v1.srt", "file2_v2.srt"]) => ["file2_v2.srt"]
*/
export const getLatestVersionFiles = (files: string[]): string[] => {
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
export const getOlderVersionFiles = (folderPath: string): string[] => {
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