const fs = require('fs');
let c = fs.readFileSync('./src/MainPage.tsx', 'utf-8');

c = c.replace(/const o = liveData\.o \|\| liveData\.odd_even;\n              if \(liveRound === roundNum && liveData\.s && liveData\.l && o\) \{\n\n                const l = liveData\.l;\n                const o = liveData\.o \|\| liveData\.odd_even;\n\n                const start = s === 'LEFT' \? '좌' : '우';\n                const lines = l == 3 \|\| l === '3' \? '3줄' : '4줄';\n                const outcome = o === 'ODD' \|\| o === '홀' \? '홀' : '짝';/g, "const o = liveData.o || liveData.odd_even;\n              if (liveRound === roundNum && liveData.s && liveData.l && o) {\n                const s = liveData.s;\n                const l = liveData.l;\n                const outcome = o === 'ODD' || o === '홀' ? '홀' : '짝';\n                const start = s === 'LEFT' ? '좌' : '우';\n                const lines = l == 3 || l === '3' ? '3줄' : '4줄';");

fs.writeFileSync('./src/MainPage.tsx', c);
