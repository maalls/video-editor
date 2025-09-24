// @ts-nocheck
/* eslint-disable */
// Disable autocomplete and IntelliSense for this file

import fs from 'fs';

const INDENT = 3;
const INDENT_VALUE = ' ';
const INDENT_PATTERN = INDENT_VALUE.repeat(INDENT);

export default class Viai {
   constructor() {
      this.tree = [];
   }

   importFile(filePath) {
      if (!fs.existsSync(filePath)) throw new Error('file do not exists.');
      const data = fs.readFileSync(filePath, 'utf8');
      const lines = data.split('\n');
      this.import(lines);
   }

   import(lines, index = 0, indent = '   ') {
      if (Array.isArray(lines)) {
         lines.forEach((line, index) => {
            this.import(line, index + 1, indent);
         });
      } else {
         if (lines.trim() === '') return;
         console.log(indent + lines);
      }
   }
}
