const fs = require("fs");
const path = require("path");

const files = [
  "secret/admin/index.html",
  "secret/infosharer/index.html",
  "secret/releases/index.html",
  "assets/js/nav.js",
  "assets/js/supabase-auth.js"

];

function commentConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  let i = 0;
  const result = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this line starts a console statement
    const consoleMatch = line.match(/^(\s*)console\.(log|warn|info|debug)\(/);

    if (
      consoleMatch &&
      !trimmed.startsWith("//") &&
      !line.includes(": console.")
    ) {
      const indent = consoleMatch[1];

      // Find the complete statement by tracking parentheses
      let statementLines = [line];
      let depth = 1; // Already counted opening paren
      let currentLine = line.substring(consoleMatch[0].length);
      let inString = false;
      let stringChar = null;
      let escaped = false;

      // Count parens in first line
      for (let j = 0; j < currentLine.length; j++) {
        const char = currentLine[j];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === "\\") {
          escaped = true;
          continue;
        }

        if (!inString && (char === '"' || char === "'" || char === "`")) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar) {
          inString = false;
          stringChar = null;
        } else if (!inString) {
          if (char === "(") depth++;
          else if (char === ")") depth--;
        }
      }

      // If not closed on first line, continue to next lines
      let lineIndex = i + 1;
      while (depth > 0 && lineIndex < lines.length) {
        const nextLine = lines[lineIndex];
        statementLines.push(nextLine);

        for (let j = 0; j < nextLine.length; j++) {
          const char = nextLine[j];

          if (escaped) {
            escaped = false;
            continue;
          }

          if (char === "\\") {
            escaped = true;
            continue;
          }

          if (!inString && (char === '"' || char === "'" || char === "`")) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar) {
            inString = false;
            stringChar = null;
          } else if (!inString) {
            if (char === "(") depth++;
            else if (char === ")") depth--;
          }
        }

        lineIndex++;
      }

      // Comment out all lines of the statement
      const commentedLines = statementLines.map((l, idx) => {
        if (idx === 0) {
          return l.replace(/^(\s*)console\./, "$1// console.");
        } else {
          // Add // to continuation lines, preserving indentation
          const leadingSpace = l.match(/^(\s*)/)[1];
          const content = l.substring(leadingSpace.length);
          return content ? `${leadingSpace}// ${content}` : l;
        }
      });

      result.push(...commentedLines);
      i = lineIndex;
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

console.log(
  "🚀 Starting AGGRESSIVE console.log commenting (multi-line support)...\n"
);

let successCount = 0;
let errorCount = 0;

files.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      const original = fs.readFileSync(filePath, "utf8");
      const modified = commentConsoleLogs(filePath);

      if (original !== modified) {
        fs.writeFileSync(filePath, modified, "utf8");
        console.log(`✅ ${file}`);
        successCount++;
      } else {
        console.log(`⚪ ${file} (no changes)`);
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
      errorCount++;
    }
  } else {
    console.log(`⚠️  ${file} (not found)`);
  }
});

console.log(
  `\n✨ Complete! Modified ${successCount} files, ${errorCount} errors`
);
