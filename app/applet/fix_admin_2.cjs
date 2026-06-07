const fs = require('fs');
let c = fs.readFileSync('./src/components/AdminMinigameManagement.tsx', 'utf8');

c = c.replace(
  "if (!bet.rollResult) {",
  "if (!bet.rollResult || bet.rollResult !== newOutcomeStr) {"
);

fs.writeFileSync('./src/components/AdminMinigameManagement.tsx', c);
console.log('Replaced successfully');
