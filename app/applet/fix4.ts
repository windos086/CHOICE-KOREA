import * as fs from 'fs';
let c = fs.readFileSync('./src/MainPage.tsx', 'utf-8');

const regex = /([ \t]*)if \(matchedItem && matchedItem\.start_point && matchedItem\.line_count && matchedItem\.odd_even\) \{\n[ \t]*\? '좌' : '우';/g;

c = c.replace(regex, (match, prefix) => {
  return prefix + "if (matchedItem && matchedItem.start_point && matchedItem.line_count && matchedItem.odd_even) {\n" + prefix + "  const start = matchedItem.start_point === 'LEFT' ? '좌' : '우';";
});

fs.writeFileSync('./src/MainPage.tsx', c);
