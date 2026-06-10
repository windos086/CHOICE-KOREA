const text = `대한민국대한민국 KBO 리그
2026-06-09 19:30   종료
1	2	3	4	5	6	7	8	9	EX	R	안타	실수	승무패	오버/언더	핸디캡	
LG [1]		0	5	0	0	3	0	0	0	X		8	9	1	1.36	O 9.5 1.87	1.5 1.74	
SSG [8]		0	1	0	0	0	0	0	0	1		2	7	1	2.90	U 9.5 1.80	1.95

NBANBA
06.09 09:30   종료  	1	2	3	4	T	전반	승무패	오버/언더	핸디캡	데이터

뉴욕 닉스[E3]	22	42	27	20	111	64	1.80	O 215.5 1.91 	1.5  1.91 	
샌안토니오 스퍼스[W2]	33	24	35	23	115	57	2.05	U 215.5 1.91 	1.91 `;

const lines = text.split('\n').filter(l => l.trim().length > 0);
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('종료')) {
        let headerLine = line;
        let homeLine = lines[i+1];
        let awayLine = lines[i+2];

        const parseLineTokens = (l: string) => l.split(/\t/).map(s => s.trim());
        let headerTokens = parseLineTokens(headerLine);
        
        let tIndex = headerTokens.indexOf('T') !== -1 ? headerTokens.indexOf('T') : headerTokens.indexOf('R');
        let oneIndex = headerTokens.indexOf('1');

        if (tIndex === -1 && i + 1 < lines.length) {
            headerLine = lines[i+1];
            headerTokens = parseLineTokens(headerLine);
            tIndex = headerTokens.indexOf('T') !== -1 ? headerTokens.indexOf('T') : headerTokens.indexOf('R');
            oneIndex = headerTokens.indexOf('1');
            homeLine = lines[i+2];
            awayLine = lines[i+3];
        }

        if (tIndex > -1 && oneIndex > -1 && homeLine && homeLine.trim().length > 0 && awayLine && awayLine.trim().length > 0) {
            const distance = tIndex - oneIndex;

            const parseTeamLine = (teamLine: string) => {
                const parts = parseLineTokens(teamLine);
                // find the first index that has a number or X (this should be the score for '1')
                // wait, the team name might have a number like '76ers'.
                // So skip index 0 and start from 1.
                let firstValIndex = -1;
                for (let k = 1; k < parts.length; k++) {
                    if (parts[k] === 'X' || /^\d+$/.test(parts[k])) {
                        firstValIndex = k;
                        break;
                    }
                }
                
                if (firstValIndex > -1) {
                    const scoreIndex = firstValIndex + distance;
                    let teamName = parts[0] ? parts[0] : parts[1]; // fallback
                    teamName = teamName.replace(/\[.*?\]/g, '').trim();
                    const score = Number(parts[scoreIndex]);
                    return { teamName, score };
                }
                return null;
            };

            const home = parseTeamLine(homeLine);
            const away = parseTeamLine(awayLine);
            console.log("Parsed result:", home, away);
            
            if (headerLine !== line) {
                i += 3;
            } else {
                i += 2;
            }
        }
    }
}

