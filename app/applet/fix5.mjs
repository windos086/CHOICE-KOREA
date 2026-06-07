const fs = require("fs");
let c = fs.readFileSync("./src/MainPage.tsx", "utf-8");

c = c.replace(/if \(matchedItem && matchedItem\.start_point && matchedItem\.line_count && matchedItem\.odd_even\) \{\n \? '좌' : '우';/g, "if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {\n                const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';");

fs.writeFileSync("./src/MainPage.tsx", c);
