const fs = require('fs');
let c = fs.readFileSync('./src/components/AdminMinigameManagement.tsx', 'utf8');

c = c.replace(
  "let newWin = false;",
  "let newStatus = 'pending';"
);

c = c.replace(
  "newWin = updatedFolders.every((f: any) => f.status === 'win');",
  "const hasLose = updatedFolders.some((f: any) => f.status === 'lose'); const allWin = updatedFolders.every((f: any) => f.status === 'win'); if (hasLose) { newStatus = 'lose'; } else if (allWin) { newStatus = 'win'; } else { newStatus = 'pending'; }"
);

c = c.replace(
  "newWin = isWinFolder;",
  "newStatus = isWinFolder ? 'win' : 'lose';"
);

c = c.replace(
  "const newStatus = newWin ? 'win' : 'lose';",
  ""
);

fs.writeFileSync('./src/components/AdminMinigameManagement.tsx', c);
console.log('Replaced successfully');
