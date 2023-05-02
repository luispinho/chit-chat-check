# 📜 Chit-Chat-Check (C3) <sub><sup>*aka "the captions validation script"*</sup></sub>


### What does this do?

Checks all `.srt` files in a given folder for:
- Any common errors by running its content through [this tool](https://github.com/taoning2014/srt-validator)
- Uppercase letters in the middle of words or other lowercase letters
- Lines that begin with spaces
- Word typos using [CSpell](https://cspell.org/)

This will only run the validations for the most recent versions of the captions. For example, if there's a caption file called `gen_123_v1.srt` and another called `gen_123_v2.srt`, it will only run the validations for `gen_123_v2.srt`.


### How to run it (after setting it up)

```bash
npm run validation --path=/YOUR/PATH/HERE
```
You can drag&drop a folder into the terminal window to get its path.

### How to set it up

0. Open a terminal window.
1. Ensure you have Node installed by running `node --version`. If you don't have it installed, get it from [their website](https://nodejs.org/en/download) OR from [Brew](https://formulae.brew.sh/formula/node#default)
2. Go to a terminal and `cd` into this folder
3. Install dependencies for spellchecking
    1. Install CSpell and necessary dictionaries `npm install -g cspell @cspell/dict-es-es @cspell/dict-fr-fr @cspell/dict-pt-pt`
    2. Link the dictionaries to CSpell using `cspell link add @cspell/dict-es-es && cspell link add @cspell/dict-fr-fr && cspell link add @cspell/dict-pt-pt`
3. Install local dependencies
    1. Run `npm i`
4. (Optional) Open `package.json` and change the hardcoded path for the script `spellcheck`. This script is used to run only the spellcheck using CSpell.
5. Run the script using `npm run validation --path=/YOUR/PATH/HERE`. You'll see output in case there are any bad caption files. This runs all the validations.
6. To just spellcheck all files, run `npm run spellcheck`.
    1. You can also run this from any other folder with `cspell --no-progress --show-suggestions --locale "pt-PT, en-US, fr-FR, es-ES" "/YOUR/PATH/HERE/*.srt"`
