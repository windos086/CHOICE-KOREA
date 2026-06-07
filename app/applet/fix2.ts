import * as fs from 'fs';
let c = fs.readFileSync('./src/MainPage.tsx', 'utf-8');

c = c.replaceAll(`              const o = liveData.o || liveData.odd_even;
              if (liveRound === roundNum && liveData.s && liveData.l && o) {

                const l = liveData.l;
                const o = liveData.o || liveData.odd_even;

                const start = s === 'LEFT' ? '좌' : '우';
                const lines = l == 3 || l === '3' ? '3줄' : '4줄';
                const outcome = o === 'ODD' || o === '홀' ? '홀' : '짝';`, `              const o = liveData.o || liveData.odd_even;
              if (liveRound === roundNum && liveData.s && liveData.l && o) {
                const s = liveData.s;
                const l = liveData.l;
                const outcome = o === 'ODD' || o === '홀' ? '홀' : '짝';
                const start = s === 'LEFT' ? '좌' : '우';
                const lines = l == 3 || l === '3' ? '3줄' : '4줄';`);

fs.writeFileSync('./src/MainPage.tsx', c);
