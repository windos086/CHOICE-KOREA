const lines = `네이션스리그	오전 04:30	경기전	1
세트	2
세트	3
세트	4
세트	5
세트	선5	선7	선10		라인	데이터
	이란 (세계랭킹12위)
전체 158-46-135
(원정 71-26-75)
4.30 -> 4.20
173.5	
	불가리아 (세계랭킹18위)
전체 104-32-133
(홈 58-16-66)
1.16 -> 1.17
-2.5`.split('\n');

const parseVolleyballStartLine = (l) => {
    const parts = l.split('\t').map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    const timeRegex = /(?:(오전|오후)\s*)?(\d{1,2}):(\d{2})/;
    let timeMatch = null;
    let timeStr = '';
    for (let idx = 1; idx < parts.length; idx++) {
        const m = parts[idx].match(timeRegex);
        if (m) { timeMatch = m; timeStr = parts[idx]; break; }
    }
    if (!timeMatch) return null;
    return { league: parts[0], dateTime: timeStr };
};

let startInfo = null;
let i = 0;
for (; i < lines.length; i++) {
    startInfo = parseVolleyballStartLine(lines[i]);
    if (startInfo) break;
}

let subLines = [];
let nextIdx = i + 1;
while(nextIdx < lines.length) {
    if (parseVolleyballStartLine(lines[nextIdx])) break;
    subLines.push(lines[nextIdx]);
    nextIdx++;
}

const filtered = subLines
    .map(sl => sl.trim())
    .filter(sl => {
        if (!sl) return false;
        const lower = sl.toLowerCase();
        const shouldIgnore = 
            lower.includes('쿼터') ||
            lower.includes('세트') ||
            lower.includes('연장') ||
            lower.includes('선득점') ||
            lower.includes('선5') ||
            lower.includes('선7') ||
            lower.includes('선10') ||
            lower.includes('선15') ||
            lower.includes('선20') ||
            lower.includes('라인') ||
            lower.includes('데이터') ||
            lower.includes('문자중계') ||
            /^\d+$/.test(sl);          
        return !shouldIgnore;
    });

console.log("Filtered length:", filtered.length);
console.log("Filtered elements:");
filtered.forEach((f, idx) => console.log(idx, ":", f));

const j_indices = [];
for (let j = 0; j < filtered.length; j++) {
    if (filtered[j].startsWith('전체 ')) j_indices.push(j);
}
console.log("j_indices:", j_indices);

let homeOdds = 1.0;
let awayOdds = 1.0;

if (j_indices.length === 2) {
    const homeEndScanIdx = j_indices[1] - 1;
    const homeOddsCandidates = [];
    for (let scanIdx = j_indices[0] + 1; scanIdx < homeEndScanIdx; scanIdx++) {
        const scanLine = filtered[scanIdx];
        if (scanLine.startsWith('(')) continue; 
        if (scanLine.includes('->')) {
            const parts = scanLine.split('->').map(x => x.trim());
            const val = parseFloat(parts[parts.length - 1]);
            if (!isNaN(val)) homeOddsCandidates.push(val);
        } else {
            const val = parseFloat(scanLine);
            if (!isNaN(val)) homeOddsCandidates.push(val);
        }
    }
    if (homeOddsCandidates.length > 0) homeOdds = homeOddsCandidates[0];

    const awayOddsCandidates = [];
    for (let scanIdx = j_indices[1] + 1; scanIdx < filtered.length; scanIdx++) {
        const scanLine = filtered[scanIdx];
        if (scanLine.startsWith('(')) continue; 
        if (scanLine.includes('->')) {
            const parts = scanLine.split('->').map(x => x.trim());
            const val = parseFloat(parts[parts.length - 1]);
            if (!isNaN(val)) awayOddsCandidates.push(val);
        } else {
            const val = parseFloat(scanLine);
            if (!isNaN(val)) awayOddsCandidates.push(val);
        }
    }
    if (awayOddsCandidates.length > 0) awayOdds = awayOddsCandidates[0];
}

console.log("HomeOdds:", homeOdds, "AwayOdds:", awayOdds);
