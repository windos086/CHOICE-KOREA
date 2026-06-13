import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, AlertCircle, Trash2, CheckCircle2, ChevronRight, HelpCircle, Activity } from 'lucide-react';

const cleanLineValue = (valStr: string): string => {
  if (!valStr) return '';
  const trimmed = valStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    return parts[parts.length - 1].trim();
  }
  return trimmed;
};

const isZeroHandicap = (valStr: string): boolean => {
  const cleaned = cleanLineValue(valStr);
  if (!cleaned) return true;
  const num = parseFloat(cleaned.replace(/[Hh]/g, '').trim());
  return isNaN(num) || num === 0;
};

export function deduplicateLeagueName(name: string): string {
  if (!name) return '';
  let cleaned = name.trim();
  if (cleaned.includes('<')) {
    cleaned = cleaned.split('<')[0].trim();
  }
  cleaned = cleaned.replace(/[<>]/g, '').trim();

  // 더 강력하게 반복되는 앞부분 제거
  // 예: "미국미국 메이저리그" -> 파동 "미국" + "미국" -> "미국 메이저리그"
  // 예: "베네수엘라베네수엘라 LMBP" -> "베네수엘라 LMBP"
  
  // 첫 번째 단어에서 반복을 먼저 해봅니다 (기존 로직 유지)
  const parts = cleaned.split(/\s+/);
  if (parts.length > 0) {
      const firstPart = parts[0];
      // 문자가 반복되는 패턴 찾기 (예: "미국미국" -> ["미국", "미국"])
      // 짝수 길이의 경우에만 절반으로 나누어 비교
      if (firstPart.length >= 2 && firstPart.length % 2 === 0) {
          const h = firstPart.length / 2;
          const left = firstPart.substring(0, h);
          const right = firstPart.substring(h);
          if (left === right) {
              parts[0] = left;
              cleaned = parts.join(' ');
          }
      }
  }

  // 이제 전체 문자열에서 반복되는 시작 패턴이 전체의 일부분인지 다시 확인해 봅니다.
  // "대한민국대한민국 KBO 리그"
  const words = cleaned.split(' ');
  // 첫 번째 단어가 매우 큰 경우, 그 자체가 두 번 반복된 것일 수도 있음
  if (words.length > 0) {
    const firstWord = words[0];
    if (firstWord.length > 4 && firstWord.length % 2 === 0) {
       const mid = firstWord.length / 2;
       if (firstWord.substring(0, mid) === firstWord.substring(mid)) {
           words[0] = firstWord.substring(0, mid);
           cleaned = words.join(' ');
       }
    }
  }

  // Try checking exact half match (no spaces)
  const noSpaces = cleaned.replace(/\s+/g, '');
  if (noSpaces.length > 0 && noSpaces.length % 2 === 0) {
    const halfLen = noSpaces.length / 2;
    const firstHalf = noSpaces.substring(0, halfLen);
    const secondHalf = noSpaces.substring(halfLen);
    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      if (cleaned.length % 2 === 0) {
        const h = cleaned.length / 2;
        if (cleaned.substring(0, h).replace(/\s+/g, '').toLowerCase() === cleaned.substring(h).replace(/\s+/g, '').toLowerCase()) {
          return cleaned.substring(0, h).trim();
        }
      }
      const origHalf = Math.floor(cleaned.length / 2);
      for (let offset = -2; offset <= 2; offset++) {
        const splitIdx = origHalf + offset;
        if (splitIdx > 0 && splitIdx < cleaned.length) {
          const part1 = cleaned.substring(0, splitIdx).trim();
          const part2 = cleaned.substring(splitIdx).trim();
          if (part1.replace(/\s+/g, '').toLowerCase() === part2.replace(/\s+/g, '').toLowerCase()) {
            return part1;
          }
        }
      }
      const words = cleaned.split(/\s+/);
      if (words.length > 0 && words.length % 2 === 0) {
        const halfWords = words.length / 2;
        const w1 = words.slice(0, halfWords).join(' ');
        const w2 = words.slice(halfWords).join(' ');
        if (w1.toLowerCase() === w2.toLowerCase()) {
          return w1;
        }
      }
      return firstHalf;
    }
  }
  return cleaned;
}

export function cleanTeamName(name: string): string {
  if (!name) return '';
  // Remove "라이브" prefix (case-insensitive and optional space) and content in brackets
  let cleaned = name.replace(/^라이브\s*/i, '').replace(/\[[^\]]*\]/g, '').trim();
  
  // Strip trailing numbers (and spaces/dashes between them) that represent scoring boards (like "밀워키 6 0 0", "신시내티 0 0 0 0 0 0")
  cleaned = cleaned.replace(/\s+([\d\-]+\s+)*\d+$/, '').trim();
  
  return cleaned;
}

export function normalizeDateString(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  return dateTimeStr.replace(/[\.\-/]/g, '-').replace(/\s+/g, ' ').trim();
}

export function getMatchKey(home: string, away: string, dateTime: string): string {
  const homeVal = cleanTeamName(home || '');
  const awayVal = cleanTeamName(away || '');
  const dateVal = normalizeDateString(dateTime || '');
  return `${homeVal}_${awayVal}_${dateVal}`;
}

export function isMatchAlreadyStarted(dateTimeStr: string): boolean {
  if (!dateTimeStr) return false;
  try {
    const cleaned = dateTimeStr.trim();
    const match = cleaned.match(/^(\d{2})[-](\d{2})\s+(\d{2}):(\d{2})/);
    if (match) {
      const month = parseInt(match[1], 10) - 1; // 0-indexed
      const day = parseInt(match[2], 10);
      const hour = parseInt(match[3], 10);
      const minute = parseInt(match[4], 10);
      
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const matchDate = new Date(currentYear, month, day, hour, minute);
      
      // Handle year wrap border conditions
      if (month === 0 && now.getMonth() === 11) {
        matchDate.setFullYear(currentYear + 1);
      }
      if (month === 11 && now.getMonth() === 0) {
        matchDate.setFullYear(currentYear - 1);
      }

      return now.getTime() > matchDate.getTime();
    }
  } catch (e) {
    console.warn("Error checking already started state:", e);
  }
  return false;
}

export const DATE_STAMP_REGEX = /(?:(?:\d{2,4})[\.\-/])?(\d{1,2})[\.\-/](\d{1,2})[^\d\n]*(\d{1,2}):(\d{2})/;

export function extractAndNormalizeDate(line: string, subtractOneHour: boolean = false): string | null {
  const match = line.match(DATE_STAMP_REGEX);
  if (match) {
    const monthInt = parseInt(match[1], 10);
    const dayInt = parseInt(match[2], 10);
    const hourInt = parseInt(match[3], 10);
    const minuteInt = parseInt(match[4], 10);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 원래의 시각을 생성 후 야구인 경우에만 1시간 감산
    const dateObj = new Date(currentYear, monthInt - 1, dayInt, hourInt, minuteInt);
    if (subtractOneHour) {
      dateObj.setHours(dateObj.getHours() - 1);
    }
    
    const finalMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const finalDay = String(dateObj.getDate()).padStart(2, '0');
    const finalHour = String(dateObj.getHours()).padStart(2, '0');
    const finalMinute = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${finalMonth}-${finalDay} ${finalHour}:${finalMinute}`;
  }
  return null;
}

const areMarketsDifferent = (m1: any, m2: any): boolean => {
  if (!m1 || !m2) return true;
  
  // Compare matchWinner
  const w1 = m1.matchWinner || {};
  const w2 = m2.matchWinner || {};
  if (
    Math.abs((w1.home || 0) - (w2.home || 0)) > 0.001 ||
    Math.abs((w1.draw || 0) - (w2.draw || 0)) > 0.001 ||
    Math.abs((w1.away || 0) - (w2.away || 0)) > 0.001
  ) {
    return true;
  }

  // Compare handicaps list
  const h1 = m1.handicaps || [];
  const h2 = m2.handicaps || [];
  if (h1.length !== h2.length) return true;
  for (let i = 0; i < h1.length; i++) {
    if (
      h1[i].value !== h2[i].value ||
      Math.abs((h1[i].home || 0) - (h2[i].home || 0)) > 0.001 ||
      Math.abs((h1[i].away || 0) - (h2[i].away || 0)) > 0.001
    ) {
      return true;
    }
  }

  // Compare overUnders list
  const ou1 = m1.overUnders || [];
  const ou2 = m2.overUnders || [];
  if (ou1.length !== ou2.length) return true;
  for (let i = 0; i < ou1.length; i++) {
    if (
      ou1[i].value !== ou2[i].value ||
      Math.abs((ou1[i].over || 0) - (ou2[i].over || 0)) > 0.001 ||
      Math.abs((ou1[i].under || 0) - (ou2[i].under || 0)) > 0.001
    ) {
      return true;
    }
  }

  return false;
};

export default function AdminMatchRegistration() {
  const [inputText, setInputText] = useState('');
  const [resultInputText, setResultInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState<'soccer' | 'baseball' | 'basketball' | 'volleyball'>('soccer');
  const [isParsing, setIsParsing] = useState(false);
  const [isResultParsing, setIsResultParsing] = useState(false);
  const [registeredMatches, setRegisteredMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const handleBulkResolve = async () => {
    if (!resultInputText.trim()) {
      alert('결과 데이터를 입력해주세요.');
      return;
    }
    if (!window.confirm('입력한 텍스트를 바탕으로 경기 결과를 일괄 정산하시겠습니까? (팀명, 스코어 기반)')) return;

    setIsResultParsing(true);
    try {
      const snap = await getDocs(query(collection(db, 'matches'), where('status', '==', 'pending')));
      const pendingMatches = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          cleanHome: cleanTeamName(data.homeTeam || ''),
          cleanAway: cleanTeamName(data.awayTeam || '')
        };
      });

      if (pendingMatches.length === 0) {
        alert('대기 중인 경기가 없습니다.');
        setIsResultParsing(false);
        return;
      }

      let resolvedCount = 0;
      const lines = resultInputText.split('\n').filter(l => l.trim().length > 0);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.includes('종료')) continue;
        
        let pH = '';
        let pA = '';
        let homeScoreD = -1;
        let awayScoreD = -1;

        // Tab-based Multiline logic (e.g., Basketball, Baseball)
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
                let firstValIndex = -1;
                for (let k = 1; k < parts.length; k++) {
                    if (parts[k] === 'X' || /^\d+$/.test(parts[k])) {
                        firstValIndex = k;
                        break;
                    }
                }
                
                if (firstValIndex > -1) {
                    const scoreIndex = firstValIndex + distance;
                    let teamName = parts[0] ? parts[0] : parts[1];
                    teamName = teamName.replace(/\[.*?\]/g, '').trim();
                    const score = Number(parts[scoreIndex]);
                    return { teamName, score };
                }
                return null;
            };

            const home = parseTeamLine(homeLine);
            const away = parseTeamLine(awayLine);

            if (home !== null && away !== null) {
                pH = cleanTeamName(home.teamName);
                homeScoreD = home.score;
                pA = cleanTeamName(away.teamName);
                awayScoreD = away.score;
                i += (headerLine !== line ? 3 : 2); // skip lines
            }
        }
        
        // Volleyball Multiline logic
        if (line.includes('종료') && homeScoreD === -1 && awayScoreD === -1) {
            let hc = '', ac = '';
            let hs = -1, as = -1;
            let j = i + 1;
            while(j < lines.length && !lines[j].includes('문자중계') && !(lines[j].includes('종료') && !lines[j].includes('문자중계')) && j < i + 20) {
                 let cl = lines[j].trim();
                 if (cl.length > 0 && !cl.startsWith('세트') && !cl.startsWith('전체') && !cl.startsWith('(') && !cl.match(/^\d+/) && !cl.startsWith('첫득점')) {
                     if (!hc) {
                         hc = cl;
                         for (let k = j+1; k <= j+3 && k < lines.length; k++) {
                             if (lines[k] && lines[k].trim().startsWith('(')) {
                                 let scoreMatch = lines[k].split(/\t|\s{2,}/);
                                 // Often the string after ) is the score. Or it's the second split part.
                                 if (scoreMatch.length > 1) {
                                     const p1 = scoreMatch[1].trim(); 
                                     if (/^\d+$/.test(p1)) hs = parseInt(p1, 10);
                                     else {
                                        const m = lines[k].match(/\)\s+(\d+)\s+/);
                                        if (m) hs = parseInt(m[1], 10);
                                     }
                                 }
                                 break;
                             }
                         }
                     } else if (!ac) {
                         ac = cl;
                         for (let k = j+1; k <= j+3 && k < lines.length; k++) {
                             if (lines[k] && lines[k].trim().startsWith('(')) {
                                 let scoreMatch = lines[k].split(/\t|\s{2,}/);
                                 if (scoreMatch.length > 1) {
                                     const p1 = scoreMatch[1].trim(); 
                                     if (/^\d+$/.test(p1)) as = parseInt(p1, 10);
                                     else {
                                        const m = lines[k].match(/\)\s+(\d+)\s+/);
                                        if (m) as = parseInt(m[1], 10);
                                     }
                                 }
                                 break;
                             }
                         }
                     }
                 }
                 j++;
            }
            if (hc && ac && hs !== -1 && as !== -1) {
                 pH = cleanTeamName(hc.replace(/\(세계랭킹.*?\)/g, ''));
                 pA = cleanTeamName(ac.replace(/\(세계랭킹.*?\)/g, ''));
                 homeScoreD = hs;
                 awayScoreD = as;
                 i = j - 1; // skip checked lines
            }
        }

        // Single line logic fallback (e.g., Soccer)
        if (homeScoreD === -1 || awayScoreD === -1) {
            let m = line.match(/종료\s+(.*?)\s+(\d+\s*-\s*\d+)\s+(.*?)(?:\s+[\d-]+\s*|\s*$|\t)/);
            if (!m) continue;

            pH = cleanTeamName(m[1].replace(/^[0-9]+\s*/, '')).trim();
            const scoreStr = m[2];
            pA = cleanTeamName(m[3].replace(/^[0-9]+\s*/, '')).trim();

            const scores = scoreStr.split('-').map(s => parseInt(s.trim(), 10));
            homeScoreD = scores[0];
            awayScoreD = scores[1];
        }

        if (isNaN(homeScoreD) || isNaN(awayScoreD)) continue;

        // Try to match with pending matches
        const match = pendingMatches.find(pm => {
            const hw = pm.cleanHome.replace(/\s+/g, '');
            const aw = pm.cleanAway.replace(/\s+/g, '');
            const phw = pH.replace(/\s+/g, '');
            const paw = pA.replace(/\s+/g, '');
            // Simple subset check or exact
            return (hw.includes(phw) || phw.includes(hw)) && (aw.includes(paw) || paw.includes(aw));
        });

        if (match) {
            let outcome: 'home' | 'draw' | 'away' = 'draw';
            if (homeScoreD > awayScoreD) outcome = 'home';
            else if (homeScoreD < awayScoreD) outcome = 'away';

            await updateDoc(doc(db, 'matches', match.id), {
                status: outcome,
                homeScore: homeScoreD,
                awayScore: awayScoreD,
                outcome
            });

            await addDoc(collection(db, 'gameResultsTTL'), {
                matchId: match.id,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                homeScore: homeScoreD,
                awayScore: awayScoreD,
                outcome,
                timestamp: new Date().toISOString()
            });

            resolvedCount++;
            pendingMatches.splice(pendingMatches.indexOf(match), 1);
        }
      }

      alert(`총 ${resolvedCount}개의 경기 결과가 성공적으로 등록 및 정산(TTL 파이프라인 전송) 처리되었습니다.`);
      setResultInputText('');
      fetchRegisteredMatches();
    } catch (e) {
      console.error(e);
      alert('정산 처리 중 오류가 발생했습니다.');
    } finally {
      setIsResultParsing(false);
    }
  };

  const fetchRegisteredMatches = async () => {
    setLoadingMatches(true);
    try {
      const snap = await getDocs(collection(db, 'matches'));
      const list = snap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          homeTeam: cleanTeamName(data.homeTeam || ''),
          awayTeam: cleanTeamName(data.awayTeam || ''),
          league: data.league ? deduplicateLeagueName(data.league) : ''
        };
      });
      // Sort matches by date/time or creation
      list.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setRegisteredMatches(list);
    } catch (e) {
      console.error("Failed to load matches:", e);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchRegisteredMatches();
  }, []);

  const handleRegisterMatches = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);

    try {
      // 1. Fetch current matches in Firebase to identify duplicates in real-time
      const snap = await getDocs(collection(db, 'matches'));
      const existingList = snap.docs.map(d => ({ docId: d.id, ...d.data() } as any));
      const existingMap = new Map<string, any>();
      for (const m of existingList) {
        const key = getMatchKey(m.homeTeam || '', m.awayTeam || '', m.dateTime || '');
        existingMap.set(key, m);
      }

      const lines = inputText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      console.log('Lines to parse:', lines);
      let currentLeague = '일반 리그';
      let addedCount = 0;
      let updatedCount = 0;

      if (selectedSport === 'basketball' || selectedSport === 'baseball') {
          const sportLabel = selectedSport === 'basketball' ? '농구' : '야구';
          let currentLeague = `${sportLabel} 리그`;

          const parseDualLineOdds = (l: string) => {
              const parts = l.split(/\s+/).filter(Boolean);
              
              // O / U 토큰의 인덱스를 찾습니다 (대소문자 무관)
              const ouIdx = parts.findIndex(p => {
                  const cleanP = p.toUpperCase().replace(/[\[\]\(\)]/g, '').trim();
                  return cleanP === 'O' || cleanP === 'U';
              });

              if (ouIdx === -1) {
                  // 만약 오버/언더 토큰을 찾지 못했다면 기본값 fallback 활용
                  const teamMatch = l.match(/^(.*?)\s+[\d\.]+/);
                  const teamName = cleanTeamName(teamMatch ? teamMatch[1] : l);
                  const numbers = l.replace(/\[[^\]]*\]/g, '').match(/\d+\.?\d*/g) || [];
                  const mlOdds = numbers.length > 0 ? parseFloat(numbers[0]) : 1.0;
                  return { teamName, mlOdds, ouThreshold: "0", overOdds: 1.0, underOdds: 1.0, handiValue: "0", handiOdds: 1.0 };
              }

              // ouIdx를 기준으로 데이터를 분해합니다.
              // 1. 단승식 배당 (ouIdx 바로 앞 토큰)
              const mlOddsStr = parts[ouIdx - 1];
              const mlOdds = parseFloat(mlOddsStr) || 1.0;

              // 2. 팀명 (단승식 배당 앞의 모든 토큰)
              const teamNameRaw = parts.slice(0, ouIdx - 1).join(' ');
              const teamName = cleanTeamName(teamNameRaw);

              // 3. 오버/언더 기준점 및 배당
              const isOver = parts[ouIdx].toUpperCase() === 'O';
              const ouThreshold = parts[ouIdx + 1] || "0";
              const ouOdds = parseFloat(parts[ouIdx + 2]) || 1.0;
              const overOdds = isOver ? ouOdds : 1.0;
              const underOdds = isOver ? 1.0 : ouOdds;

              // 4. 핸디캡 정보 (ouIdx + 3 이후의 잔여 토큰)
              const remaining = parts.slice(ouIdx + 3);
              let handiValue = "0";
              let handiOdds = 1.0;

              if (remaining.length === 1) {
                  // 배당만 있는 경우
                  handiOdds = parseFloat(remaining[0]) || 1.0;
              } else if (remaining.length >= 2) {
                  // 기준점과 배당 모두 있는 경우
                  handiValue = remaining[0];
                  handiOdds = parseFloat(remaining[1]) || 1.0;
              }

              return { teamName, mlOdds, ouThreshold, overOdds, underOdds, handiValue, handiOdds };
          };

          for (let i = 0; i < lines.length; i++) {
              const line = lines[i];

              // 1. 날짜 패턴 검출을 가장 먼저 수행합니다.
              const matchTime = extractAndNormalizeDate(line, selectedSport === 'baseball');
              if (matchTime) {
                  // 날짜 줄에 함께 적힌 리그 이름이 있다면 추출
                  const remaining = line.replace(DATE_STAMP_REGEX, '').trim();
                  const cleanLg = remaining.replace(/[\[\]\(\)]/g, '').trim();
                  if (cleanLg) {
                      const isStatusOrHeader = cleanLg.includes('회') || 
                                               cleanLg.includes('쿼터') || 
                                               cleanLg.includes('Q') || 
                                               cleanLg.includes('전반') || 
                                               cleanLg.includes('후반') || 
                                               cleanLg.includes('승무패') || 
                                               cleanLg.includes('오버/언더') || 
                                               cleanLg.includes('핸디캡') || 
                                               cleanLg.includes('안타') || 
                                               cleanLg.includes('실수') || 
                                               /^\d/.test(cleanLg) || 
                                               cleanLg.length < 4;
                      if (!isStatusOrHeader) {
                          currentLeague = deduplicateLeagueName(cleanLg);
                      }
                  }

                  // 그 다음 두 줄(홈팀 라인, 원정팀 라인)을 읽습니다.
                  let homeLine = '';
                  let awayLine = '';
                  
                  // 스캐너를 가동하여 후속 라인 중 유효한 배당이 포함되어 있는 줄 2개를 찾습니다.
                  let scanCount = 0;
                  let foundHome = false;
                  let foundAway = false;
                  let nextIdx = i + 1;
                  
                  while (nextIdx < lines.length && scanCount < 8) {
                      const candidate = lines[nextIdx];
                      scanCount++;
                      
                      // 다음 경기 일정 라인을 만나면 즉시 서치를 중단합니다.
                      const isAnotherDate = extractAndNormalizeDate(candidate, selectedSport === 'baseball');
                      if (isAnotherDate) {
                          break;
                      }
                      
                      const hasNumbers = /\d/.test(candidate);
                      if (!hasNumbers) {
                          // 숫자가 아예 없는 문장(예: 중간의 또다른 리그 선언줄)은 리그명으로 최신화
                          const possibleLg = candidate.replace(/[\[\]\(\)]/g, '').trim();
                          if (possibleLg && possibleLg.length < 50) {
                              currentLeague = deduplicateLeagueName(possibleLg);
                          }
                          nextIdx++;
                          continue;
                      }

                      // 야구 등의 스코어판 헤더줄 등 의미없는 구조적 수치 정보들을 가진 경우 스킵 처리합니다.
                      const cleanL = candidate.replace(/\s+/g, '');
                      const isHeaderLine = cleanL.includes('승무패') || cleanL.includes('오버/언더') || cleanL.includes('핸디캡') || cleanL.includes('안타') || cleanL.includes('실수') || cleanL.includes('EX') || cleanL.includes('교체') || cleanL.includes('전반') || cleanL.includes('후반');
                      if (isHeaderLine) {
                          nextIdx++;
                          continue;
                      }
                      
                      if (!foundHome) {
                          homeLine = candidate;
                          foundHome = true;
                      } else if (!foundAway) {
                          awayLine = candidate;
                          foundAway = true;
                          break;
                      }
                      nextIdx++;
                  }

                  if (!foundHome || !foundAway) {
                      continue;
                  }

                  try {
                      const h = parseDualLineOdds(homeLine);
                      const a = parseDualLineOdds(awayLine);

                      if (!h || !a || !h.teamName || !a.teamName) continue;
                      if (h.teamName.length < 2 || a.teamName.length < 2) continue;

                      // 홈/원정 데이터 병합
                      const threshold = h.ouThreshold !== "0" ? h.ouThreshold : a.ouThreshold;
                      const overOdds = h.overOdds !== 1.0 ? h.overOdds : a.overOdds;
                      const underOdds = h.underOdds !== 1.0 ? h.underOdds : a.underOdds;

                      let handiValue = a.handiValue !== "0" ? a.handiValue : h.handiValue;
                      const handiHomeOdds = h.handiOdds;
                      const handiAwayOdds = a.handiOdds;

                      // 배당이 올바르게 존재하는지 확인
                      const hasMoneylineOdds = h.mlOdds > 1.01 && a.mlOdds > 1.01;
                      const hasHandicap = handiValue && handiValue !== "0" && handiHomeOdds > 1.01 && handiAwayOdds > 1.01;
                      const hasOverUnder = threshold && threshold !== "0" && overOdds > 1.01 && underOdds > 1.01;

                      // 승무패 정보가 없으면 게임등록에서 제외 처리
                      if (!hasMoneylineOdds) {
                          console.log(`Skipping ${sportLabel} match because it lacks moneyline (승무패) odds:`, h.teamName, a.teamName);
                          continue;
                      }

                      // 이미 시작된 경기는 등록에서 제외 처리
                      if (isMatchAlreadyStarted(matchTime)) {
                          console.log(`Skipping started ${sportLabel} match: ${h.teamName} vs ${a.teamName} at ${matchTime}`);
                          continue;
                      }

                      if (handiValue && handiValue !== "0") {
                          const cleanV = handiValue.replace(/[+-]/g, '').trim();
                          if (h.mlOdds < a.mlOdds) {
                              handiValue = `-${cleanV}`;
                          } else {
                              handiValue = `+${cleanV}`;
                          }
                      }

                      const markets = {
                          matchWinner: { home: h.mlOdds, draw: 0, away: a.mlOdds },
                          handicap: { value: handiValue, home: handiHomeOdds, away: handiAwayOdds },
                          overUnder: { value: threshold, over: overOdds, under: underOdds },
                          handicaps: [{ value: handiValue, home: handiHomeOdds, away: handiAwayOdds }],
                          overUnders: [{ value: threshold, over: overOdds, under: underOdds }]
                      };

                      const key = getMatchKey(h.teamName, a.teamName, matchTime);
                      const existingMatch = existingMap.get(key);

                      if (existingMatch) {
                          const isMarketsDiff = areMarketsDifferent(markets, existingMatch.markets);
                          const isLeagueDiff = existingMatch.league !== currentLeague;
                          if (isMarketsDiff || isLeagueDiff) {
                              await updateDoc(doc(db, 'matches', existingMatch.docId), {
                                  markets: markets,
                                  league: currentLeague,
                                  updatedAt: new Date().toISOString()
                              });
                              updatedCount++;
                          }
                      } else {
                          const newMatchDoc = {
                              dateTime: matchTime,
                              league: currentLeague,
                              homeTeam: h.teamName,
                              awayTeam: a.teamName,
                              sport: selectedSport,
                              markets: markets,
                              status: 'pending',
                              homeScore: 0,
                              awayScore: 0,
                              createdAt: new Date().toISOString()
                          };
                          console.log("Adding new match:", newMatchDoc);

                          await addDoc(collection(db, 'matches'), newMatchDoc);
                          addedCount++;
                      }
                  } catch (err) {
                      console.error(`Error parsing ${sportLabel} lines sequential:`, err, homeLine, awayLine);
                  }

                  i = nextIdx - 1; // 스캔이 끝난 인덱스로 루프 인덱스 이동하여 중복 파싱 방지
                  continue;
              }

              // 2. 시간 데이터가 아닌 일반 텍스트 라인은 리그명으로 취급
              // 농구/야구 모두 적용되는 좀 더 유연한 리그명 파싱 로직
              if (!line.includes(']') && line.length > 0 && line.length < 50 && 
                  !line.includes('승무패') && !line.includes('오버/언더') && !line.includes('핸디캡') && 
                  !line.includes('안타') && !line.includes('실수')) {
                  
                  // '전반', '후반', '데이터', '교체', '1 2 3 4 T', '승무패', '오버/언더', '핸디캡' 등 리그명이 아닌 키워드가 포함되면 제외
                  const isBlacklisted = line.includes('전반') || line.includes('후반') || line.includes('데이터') || line.includes('교체') || 
                                       line.includes('승무패') || line.includes('오버/언더') || line.includes('핸디캡') || line.includes('1 2 3 4');
                  
                  if (!isBlacklisted && !/^\d+\s+\d+\s+\d+\s+/.test(line)) {
                    // 줄 내용을 먼저 정제(반복 제거)하여 리그명으로 활용
                    const potentialLeague = deduplicateLeagueName(line);
                    // 숫자가 있더라도 '리그', '메이저', '엘리트' 같은 단어가 포함되면 리그명으로 인정
                    if (!/\d/.test(potentialLeague) || potentialLeague.includes('리그') || potentialLeague.includes('메이저') || potentialLeague.includes('엘리트')) {
                      currentLeague = potentialLeague;
                    }
                  }
              }
          }

          if (addedCount > 0 && updatedCount > 0) {
              alert(`${addedCount}개의 신규 ${sportLabel} 경기가 등록되었고, ${updatedCount}개의 기존 등록 경기 배당/기준점이 최신 정보로 갱신되었습니다.`);
          } else if (addedCount > 0) {
              alert(`${addedCount}개의 신규 ${sportLabel} 경기가 성공적으로 등록되었습니다.`);
          } else if (updatedCount > 0) {
              alert(`${updatedCount}개의 기존 등록 ${sportLabel} 경기 배당/기준점이 갱신되었습니다.`);
          } else {
              alert(`저장되거나 변경된 배당/기준점 정보가 없습니다.`);
          }

          setInputText('');
          fetchRegisteredMatches();
          return;
      }

      if (selectedSport === 'volleyball') {
          const sportLabel = '배구';
          
          const parseVolleyballStartLine = (l: string) => {
              const parts = l.split('\t').map(p => p.trim()).filter(Boolean);
              if (parts.length < 2) return null;
              
              const timeRegex = /(?:(오전|오후)\s*)?(\d{1,2}):(\d{2})/;
              let timeMatch = null;
              let timeStr = '';
              
              for (let idx = 1; idx < parts.length; idx++) {
                  const m = parts[idx].match(timeRegex);
                  if (m) {
                      timeMatch = m;
                      timeStr = parts[idx];
                      break;
                  }
              }
              
              if (!timeMatch) return null;
              
              const rawLeague = parts[0];
              
              let isPm = false;
              let hasAmPm = false;
              if (timeMatch[1]) {
                  hasAmPm = true;
                  isPm = timeMatch[1] === '오후';
              } else {
                  const timeIdx = parts.indexOf(timeStr);
                  if (timeIdx > 0) {
                      const tokenBefore = parts[timeIdx - 1];
                      if (tokenBefore && (tokenBefore.includes('오전') || tokenBefore.includes('오후'))) {
                          hasAmPm = true;
                          isPm = tokenBefore.includes('오후');
                      }
                  }
              }
              
              let hours = parseInt(timeMatch[2], 10);
              const minutes = parseInt(timeMatch[3], 10);
              
              if (hasAmPm) {
                  if (isPm && hours < 12) {
                      hours += 12;
                  } else if (!isPm && hours === 12) {
                      hours = 0;
                  }
              }
              
              const now = new Date();
              const matchDate = new Date();
              matchDate.setHours(hours, minutes, 0, 0);

              // 현재 시각보다 6시간 이상 이전 시간이면 "내일" 경기일 가능성이 매우 높음
              if (matchDate.getTime() < now.getTime() - (6 * 60 * 60 * 1000)) {
                  matchDate.setDate(matchDate.getDate() + 1);
              }
              
              const month = String(matchDate.getMonth() + 1).padStart(2, '0');
              const day = String(matchDate.getDate()).padStart(2, '0');
              const dateTime = `${month}-${day} ${String(matchDate.getHours()).padStart(2, '0')}:${String(matchDate.getMinutes()).padStart(2, '0')}`;
              
              return { league: rawLeague, dateTime };
          };

          for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const startInfo = parseVolleyballStartLine(line);
              if (!startInfo) continue;
              
              const { league: rawLeague, dateTime: matchTime } = startInfo;
              const currentLeague = deduplicateLeagueName(rawLeague) || "배구 리그";
              
              let nextIdx = i + 1;
              const subLines: string[] = [];
              while (nextIdx < lines.length) {
                  const nextLine = lines[nextIdx];
                  if (parseVolleyballStartLine(nextLine)) {
                      break;
                  }
                  subLines.push(nextLine);
                  nextIdx++;
              }
              
              // subLines에서 필요없는 메타 정보를 전부 제거하여 순수한 필터링 라인 목록을 만듦
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
                          /^\d+$/.test(sl); // 단독 숫자로만 구성된 경우 (예: '1', '2' 등)
                          
                      return !shouldIgnore;
                  });

              // '전체 ' 전적의 시작 인덱스들을 찾아 팀 블록을 나눔
              const j_indices: number[] = [];
              for (let j = 0; j < filtered.length; j++) {
                  if (filtered[j].startsWith('전체 ')) {
                      j_indices.push(j);
                  }
              }

              let homeTeam = '';
              let awayTeam = '';
              let homeOdds = 1.0;
              let awayOdds = 1.0;
              let handicapValue = '';
              let ouValue = '';

              if (j_indices.length === 2) {
                  // --- 첫 번째 팀 (홈팀) 파싱 ---
                  const homeTeamNameIdx = j_indices[0] - 1;
                  if (homeTeamNameIdx >= 0) {
                      const rawName = filtered[homeTeamNameIdx];
                      // 괄호 제거 (예: '폴란드 (세계랭킹2위)' -> '폴란드') 및 cleanTeamName 적용
                      homeTeam = cleanTeamName(rawName.replace(/\s*\([^)]*\)/g, '').trim());
                  }

                  // 첫 번째 팀 세부 정보 스캔 범위
                  const homeEndScanIdx = j_indices[1] - 1;
                  const homeOddsCandidates: number[] = [];
                  for (let scanIdx = j_indices[0] + 1; scanIdx < homeEndScanIdx; scanIdx++) {
                      const scanLine = filtered[scanIdx];
                      if (scanLine.startsWith('(')) continue; // (원정 91-17-38) 같은 줄 무시
                      
                      // 실시간 배당 '1.07 -> 1.08' 또는 일반 숫자 배당률 검출
                      if (scanLine.includes('->')) {
                          const parts = scanLine.split('->').map(x => x.trim());
                          const val = parseFloat(parts[parts.length - 1]);
                          if (!isNaN(val)) homeOddsCandidates.push(val);
                      } else {
                          const val = parseFloat(scanLine);
                          if (!isNaN(val)) homeOddsCandidates.push(val);
                      }
                  }
                  
                  if (homeOddsCandidates.length > 0) {
                      homeOdds = homeOddsCandidates[0];
                      for (let k = 1; k < homeOddsCandidates.length; k++) {
                          const val = homeOddsCandidates[k];
                          if (val > 50) ouValue = val.toString();
                          else handicapValue = val.toString();
                      }
                  }

                  // --- 두 번째 팀 (원정팀) 파싱 ---
                  const awayTeamNameIdx = j_indices[1] - 1;
                  if (awayTeamNameIdx >= 0) {
                      const rawName = filtered[awayTeamNameIdx];
                      awayTeam = cleanTeamName(rawName.replace(/\s*\([^)]*\)/g, '').trim());
                  }

                  const awayOddsCandidates: number[] = [];
                  for (let scanIdx = j_indices[1] + 1; scanIdx < filtered.length; scanIdx++) {
                      const scanLine = filtered[scanIdx];
                      if (scanLine.startsWith('(')) continue; // (홈 78-14-41) 같은 줄 무시
                      
                      if (scanLine.includes('->')) {
                          const parts = scanLine.split('->').map(x => x.trim());
                          const val = parseFloat(parts[parts.length - 1]);
                          if (!isNaN(val)) awayOddsCandidates.push(val);
                      } else {
                          const val = parseFloat(scanLine);
                          if (!isNaN(val)) awayOddsCandidates.push(val);
                      }
                  }
                  if (awayOddsCandidates.length > 0) {
                      awayOdds = awayOddsCandidates[0];
                      for (let k = 1; k < awayOddsCandidates.length; k++) {
                          const val = awayOddsCandidates[k];
                          if (Math.abs(val) > 50) ouValue = Math.abs(val).toString();
                          else handicapValue = val.toString();
                      }
                  }
              }

              if (!homeTeam || !awayTeam) {
                  console.log(`Skipping volleyball match due to missing teams: ${homeTeam} vs ${awayTeam}`);
                  i = nextIdx - 1;
                  continue;
              }
              
              if (homeOdds <= 1.01 || awayOdds <= 1.01) {
                  console.log(`Skipping volleyball match due to missing ML odds: ${homeTeam} vs ${awayTeam}`);
                  i = nextIdx - 1;
                  continue;
              }
              
              if (isMatchAlreadyStarted(matchTime)) {
                  console.log(`Skipping started volleyball match: ${homeTeam} vs ${awayTeam} at ${matchTime}`);
                  i = nextIdx - 1;
                  continue;
              }

              // 배구 언오버, 핸디캡은 당분간 등록 제외 (추후 예정)
              const markets = {
                  matchWinner: { home: homeOdds, draw: 0, away: awayOdds },
                  handicap: { value: '0', home: 1.0, away: 1.0 },
                  overUnder: { value: '0', over: 1.0, under: 1.0 },
                  handicaps: [],
                  overUnders: []
              };
              
              const key = getMatchKey(homeTeam, awayTeam, matchTime);
              const existingMatch = existingMap.get(key);
              
              if (existingMatch) {
                  const isMarketsDiff = areMarketsDifferent(markets, existingMatch.markets);
                  const isLeagueDiff = existingMatch.league !== currentLeague;
                  if (isMarketsDiff || isLeagueDiff) {
                      await updateDoc(doc(db, 'matches', existingMatch.docId), {
                          markets: markets,
                          league: currentLeague,
                          dateTime: matchTime,
                          updatedAt: new Date().toISOString()
                      });
                      updatedCount++;
                  }
              } else {
                  const newMatchDoc = {
                      dateTime: matchTime,
                      league: currentLeague,
                      homeTeam: homeTeam,
                      awayTeam: awayTeam,
                      sport: 'volleyball',
                      markets: markets,
                      homeScore: 0,
                      awayScore: 0,
                      status: 'pending',
                      createdAt: new Date().toISOString()
                  };
                  
                  await addDoc(collection(db, 'matches'), newMatchDoc);
                  addedCount++;
              }
              
              i = nextIdx - 1;
          }

          if (addedCount > 0 && updatedCount > 0) {
              alert(`${addedCount}개의 신규 ${sportLabel} 경기가 등록되었고, ${updatedCount}개의 기존 등록 경기 배당/기준점이 최신 정보로 갱신되었습니다.`);
          } else if (addedCount > 0) {
              alert(`${addedCount}개의 신규 ${sportLabel} 경기가 성공적으로 등록되었습니다.`);
          } else if (updatedCount > 0) {
              alert(`${updatedCount}개의 기존 등록 ${sportLabel} 경기 배당/기준점이 갱신되었습니다.`);
          } else {
              alert(`저장되거나 변경된 배당/기준점 정보가 없습니다.`);
          }

          setInputText('');
          fetchRegisteredMatches();
          return;
      }

      interface MatchBlock {
        dateTime: string;
        allLines: string[];
        league: string;
      }

      const matchBlocks: MatchBlock[] = [];
      let currentBlock: MatchBlock | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const normalizedDateStr = extractAndNormalizeDate(line);
        if (normalizedDateStr) {
          console.log('Found block header:', line, 'Normalized as:', normalizedDateStr);
          const dateStr = normalizedDateStr;
          
          // Check if there is any league text in the same line as the date stamp (e.g. "06-05 23:00 [K-League]")
          const remaining = line.replace(DATE_STAMP_REGEX, '').trim();
          const cleanLg = remaining.replace(/[\[\]\(\)]/g, '').trim();
          if (cleanLg) {
            currentLeague = deduplicateLeagueName(cleanLg);
          }

          // Backtrack previous block's trailing lines. If there are trailing lines representing a newly declared league or header for the upcoming matches.
          if (currentBlock && currentBlock.allLines.length > 0) {
            const isOddsLine = (txt: string): boolean => {
              return /\d+\.\d+/.test(txt);
            };
            let firstOddsLineIdx = -1;
            for (let j = 0; j < currentBlock.allLines.length; j++) {
              if (isOddsLine(currentBlock.allLines[j])) {
                firstOddsLineIdx = j;
                break;
              }
            }
            if (firstOddsLineIdx !== -1) {
              // The match block ends at firstOddsLineIdx + 2 (if there is a draw odds line as well) or firstOddsLineIdx + 1 (otherwise)
              const hasDrawLine = (firstOddsLineIdx + 2 < currentBlock.allLines.length) && isOddsLine(currentBlock.allLines[firstOddsLineIdx + 2]);
              const matchEndIdx = hasDrawLine ? firstOddsLineIdx + 2 : firstOddsLineIdx + 1;
              
              if (matchEndIdx < currentBlock.allLines.length - 1) {
                const extraLines = currentBlock.allLines.slice(matchEndIdx + 1);
                const leagueText = extraLines.map(l => l.trim()).filter(Boolean).join(' ');
                if (leagueText && !/\d/.test(leagueText)) {
                  currentLeague = deduplicateLeagueName(leagueText.replace(/[\[\]\(\)]/g, '').trim());
                  console.log('Extracted league from previous block trailing lines:', currentLeague);
                }
                currentBlock.allLines = currentBlock.allLines.slice(0, matchEndIdx + 1);
              }
            }
          }

          currentBlock = { dateTime: dateStr, allLines: [], league: currentLeague };
          matchBlocks.push(currentBlock);
        } else {
          if (currentBlock) {
            currentBlock.allLines.push(line);
          } else {
            // League detection for lines before the first block
            if (!/\d+\.\d+/.test(line)) {
              currentLeague = deduplicateLeagueName(line.replace(/[\[\]\(\)]/g, '').trim());
            }
          }
        }
      }

      console.log('Found blocks:', matchBlocks.length);

      for (const block of matchBlocks) {
        const blockLines = block.allLines;
        if (blockLines.length === 0) continue;

        const isOddsLine = (txt: string): boolean => {
          // Odds line MUST contain at least one float decimal (e.g. 1.50, 2.50)
          // to avoid incorrectly matching team names/leagues with integers (e.g. "U19" or "디비전 2")
          return /\d+\.\d+/.test(txt);
        };

        let firstOddsLineIdx = -1;
        for (let j = 0; j < blockLines.length; j++) {
          if (isOddsLine(blockLines[j])) {
            firstOddsLineIdx = j;
            break;
          }
        }

        if (firstOddsLineIdx === -1) {
          console.log('Skipping block, no odds line found:', block);
          continue;
        }

        console.log('Found odds line in block', block.dateTime, 'at index', firstOddsLineIdx);

        const homeTeam = cleanTeamName(blockLines[firstOddsLineIdx - 1]);
        if (!homeTeam) continue;

        let matchLeague = block.league || '일반 리그';
        if (firstOddsLineIdx - 1 > 0) {
          const possibleLeague = blockLines[firstOddsLineIdx - 2];
          // Allow if it doesn't look like an odds line
          if (possibleLeague && !/^\d+\.\d+$/.test(possibleLeague)) {
             matchLeague = possibleLeague;
          }
        }
        if (matchLeague) {
          matchLeague = deduplicateLeagueName(matchLeague.replace(/[\[\]\(\)]/g, '').trim());
        }
        if (!matchLeague) {
          matchLeague = '일반 리그';
        }

        const homeOddsLine = blockLines[firstOddsLineIdx];
        const awayTeamLine = blockLines[firstOddsLineIdx + 1];
        const drawOddsLine = blockLines[firstOddsLineIdx + 2];

        if (!homeOddsLine || !awayTeamLine) continue;

        try {
          const formatOddsStr = (raw: string): string => {
            return raw
              .replace(/\[/g, ' [')
              .replace(/\]/g, '] ')
              .replace(/\(/g, ' [')
              .replace(/\)/g, '] ')
              .replace(/\s+/g, ' ')
              .trim();
          };

          const formattedHomeLine = formatOddsStr(homeOddsLine);
          const formattedAwayLine = formatOddsStr(awayTeamLine);
          const formattedDrawLine = drawOddsLine ? formatOddsStr(drawOddsLine) : '';

          const isMarketToken = (token: string): boolean => {
            if (/[가-힣<>]/.test(token)) return false;
            const cleaned = token.replace(/[\[\]\(\)]/g, '').trim();
            if (cleaned === '') return false;
            return /^[OoUuHh]?([+-]?\d+)/.test(cleaned) || /^[OoUuHh]$/.test(cleaned);
          };

          const cleanBrackets = (token: string) => token.replace(/[\[\]\(\)]/g, '').trim();

          let drawOdds = 0;
          if (formattedDrawLine) {
            const rawDrawTokens = formattedDrawLine.split(/\s+/).filter(Boolean);
            const drawMarketTokens = rawDrawTokens.filter(isMarketToken).map(cleanBrackets);
            drawOdds = drawMarketTokens.length > 0 ? (parseFloat(drawMarketTokens[0]) || 0) : 0;
          }

          const rawHomeTokens = formattedHomeLine.split(/\s+/).filter(Boolean);
          const homeMarketTokens = rawHomeTokens.filter(isMarketToken).map(cleanBrackets);
          const homeOdds = homeMarketTokens.length > 0 ? (parseFloat(homeMarketTokens[0]) || 1.00) : 1.00;

          const rawAwayTokens = formattedAwayLine.split(/\s+/).filter(Boolean);
          let firstOddsIndex = -1;
          for (let j = 0; j < rawAwayTokens.length; j++) {
            const cleanedX = rawAwayTokens[j].replace(/[\[\]\(\)]/g, '').trim();
            if (/^\d+\.\d+$/.test(cleanedX)) {
              firstOddsIndex = j;
              break;
            }
          }
          if (firstOddsIndex === -1) {
            for (let j = 0; j < rawAwayTokens.length; j++) {
              const cleanedX = rawAwayTokens[j].replace(/[\[\]\(\)]/g, '').trim();
              if (/^\d+$/.test(cleanedX)) {
                firstOddsIndex = j;
                break;
              }
            }
          }

          if (firstOddsIndex === -1) continue;

          const awayTeam = cleanTeamName(rawAwayTokens.slice(0, firstOddsIndex).join(' '));
          const awayOddsTokensRaw = rawAwayTokens.slice(firstOddsIndex);
          const awayMarketTokens = awayOddsTokensRaw.filter(isMarketToken).map(cleanBrackets);
          const awayOdds = awayMarketTokens.length > 0 ? (parseFloat(awayMarketTokens[0]) || 1.00) : 1.00;

          const homeRemains = homeMarketTokens.slice(1);
          const awayRemains = awayMarketTokens.slice(1);

          const handicaps: any[] = [];
          const overUnders: any[] = [];

          let hIdxAll = 0;
          let aIdxAll = 0;

          while (hIdxAll < homeRemains.length) {
            const prevIdx = hIdxAll;
            const currentToken = homeRemains[hIdxAll];
            if (!currentToken) break;

            const isOU = currentToken === 'O' || currentToken === 'U' || /^[OoUu]/.test(currentToken);

            if (isOU) {
              const isOverHome = currentToken.toUpperCase().startsWith('O');
              let threshold = '';
              let overOdds = 1.00;

              if (currentToken === 'O' || currentToken === 'U' || currentToken.toUpperCase() === 'O' || currentToken.toUpperCase() === 'U') {
                threshold = homeRemains[hIdxAll + 1] || '';
                overOdds = parseFloat(homeRemains[hIdxAll + 2]) || 1.00;
                hIdxAll += 3;
              } else {
                threshold = currentToken.substring(1);
                overOdds = parseFloat(homeRemains[hIdxAll + 1]) || 1.00;
                hIdxAll += 2;
              }

              if (threshold && threshold.trim() !== '') {
                let underOdds = 1.00;
                if (aIdxAll < awayRemains.length) {
                  const awayToken = awayRemains[aIdxAll];
                  if (awayToken === 'U' || awayToken === 'O' || awayToken.toUpperCase() === 'U' || awayToken.toUpperCase() === 'O') {
                    underOdds = parseFloat(awayRemains[aIdxAll + 2]) || 1.00;
                    aIdxAll += 3;
                  } else if (/^[OoUu]\d/.test(awayToken)) {
                    underOdds = parseFloat(awayRemains[aIdxAll + 1]) || 1.00;
                    aIdxAll += 2;
                  } else {
                    underOdds = parseFloat(awayToken) || 1.00;
                    aIdxAll += 1;
                  }
                }

                overUnders.push({
                  value: threshold,
                  over: isOverHome ? overOdds : underOdds,
                  under: isOverHome ? underOdds : overOdds
                });
              }
            } else {
              let threshold = '';
              let homeHandiOdds = 1.00;

              if (currentToken === 'H' || currentToken === 'h' || currentToken.toUpperCase() === 'H') {
                threshold = homeRemains[hIdxAll + 1] || '';
                homeHandiOdds = parseFloat(homeRemains[hIdxAll + 2]) || 1.00;
                hIdxAll += 3;
              } else {
                threshold = currentToken;
                homeHandiOdds = parseFloat(homeRemains[hIdxAll + 1]) || 1.00;
                hIdxAll += 2;
              }

              if (threshold && threshold.trim() !== '') {
                let awayHandiOdds = 1.00;
                if (aIdxAll < awayRemains.length) {
                  const awayToken = awayRemains[aIdxAll];
                  if (awayToken === 'H' || awayToken === 'h' || awayToken.toUpperCase() === 'H') {
                    awayHandiOdds = parseFloat(awayRemains[aIdxAll + 2]) || 1.00;
                    aIdxAll += 3;
                  } else if (/^[Hh][+-]?\d/.test(awayToken)) {
                    awayHandiOdds = parseFloat(awayRemains[aIdxAll + 1]) || 1.00;
                    aIdxAll += 2;
                  } else {
                    awayHandiOdds = parseFloat(awayToken) || 1.00;
                    aIdxAll += 1;
                  }
                }

                if (!isZeroHandicap(threshold)) {
                  // Keep existing sign if present, otherwise assume positive if no sign
                  const trimmedThreshold = threshold.trim();
                  const cleanThreshold = trimmedThreshold.replace(/[+-]/g, '');
                  
                  // Favorite gets minus handicap, underdog gets plus handicap
                  let adjustedThreshold = cleanThreshold;
                  if (homeOdds < awayOdds) {
                    // Home is favorite: Home gets minus (-) handicap
                    adjustedThreshold = `-${cleanThreshold}`;
                  } else {
                    // Away is favorite: Home gets plus (+) handicap
                    adjustedThreshold = `+${cleanThreshold}`;
                  }

                  handicaps.push({
                    value: adjustedThreshold,
                    home: homeHandiOdds,
                    away: awayHandiOdds
                  });
                }
              }
            }

            if (hIdxAll <= prevIdx) {
              hIdxAll++;
            }
          }

          const parsedMarkets = {
            matchWinner: {
              home: homeOdds,
              draw: drawOdds,
              away: awayOdds
            },
            handicap: handicaps.length > 0 ? handicaps[0] : { value: '', home: 0, away: 0 },
            overUnder: overUnders.length > 0 ? overUnders[0] : { value: '', oddsOver: 0, oddsUnder: 0 },
            handicaps: handicaps,
            overUnders: overUnders
          };

          // 배당이 없거나 기준점(기존점)이 없는 경기는 제외 처리
          const hasMoneylineOdds = homeOdds > 1.01 && awayOdds > 1.01;
          const hasHandicap = handicaps.length > 0 && handicaps[0].value && handicaps[0].home > 1.01 && handicaps[0].away > 1.01;
          const hasOverUnder = overUnders.length > 0 && overUnders[0].value && overUnders[0].over > 1.01 && overUnders[0].under > 1.01;

          // 승무패 정보가 없으면 게임등록에서 제외 처리
          if (!hasMoneylineOdds) {
            console.log('Skipping soccer/baseball match because it lacks moneyline (승무패) odds:', homeTeam, awayTeam);
            continue;
          }

          // 이미 시작된 경기는 등록에서 제외 처리
          if (isMatchAlreadyStarted(block.dateTime)) {
            console.log(`Skipping started soccer/baseball match: ${homeTeam} vs ${awayTeam} at ${block.dateTime}`);
            continue;
          }

          const key = getMatchKey(homeTeam, awayTeam, block.dateTime);
          const existingMatch = existingMap.get(key);

          if (existingMatch) {
            const isMarketsDiff = areMarketsDifferent(parsedMarkets, existingMatch.markets);
            const isLeagueDiff = existingMatch.league !== matchLeague;
            if (isMarketsDiff || isLeagueDiff) {
              await updateDoc(doc(db, 'matches', existingMatch.docId), {
                markets: parsedMarkets,
                league: matchLeague,
                updatedAt: new Date().toISOString()
              });
              updatedCount++;
            }
          } else {
            const newMatchDoc = {
              dateTime: block.dateTime,
              league: matchLeague,
              homeTeam: homeTeam.trim(),
              awayTeam: awayTeam.trim(),
              markets: parsedMarkets,
              status: 'pending',
              homeScore: 0,
              awayScore: 0,
              sport: selectedSport,
              createdAt: new Date().toISOString()
            };
            await addDoc(collection(db, 'matches'), newMatchDoc);
            addedCount++;
          }
        } catch (err) {
          console.error("Failed to parse match block:", err);
        }
      }

      // Show beautiful feedback based on operations completed
      if (addedCount > 0 && updatedCount > 0) {
        alert(`${addedCount}개의 신규 경기가 등록되었고, ${updatedCount}개의 기존 등록 경기 배당/기준점이 최신 정보로 갱신되었습니다.`);
      } else if (addedCount > 0) {
        alert(`${addedCount}개의 신규 경기가 성공적으로 등록되었습니다.`);
      } else if (updatedCount > 0) {
        alert(`${updatedCount}개의 기존 등록 경기 배당/기준점이 갱신되었습니다.`);
      } else {
        alert(`저장되거나 변경된 배당/기준점 정보가 없습니다.`);
      }

      setInputText('');
      fetchRegisteredMatches();
    } catch (e) {
      console.error(e);
      alert('데이터 파싱 및 저장 오류: 데이터 형식을 확인해주세요.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteAllMatches = async () => {
    if (!window.confirm('정말로 모든 경기 및 경기 결과 데이터를 완전히 삭제하시겠습니까? 데이터가 모두 사라지며 복구되지 않습니다.')) return;
    try {
      // 1. Delete all matches
      const matchSnap = await getDocs(collection(db, 'matches'));
      await Promise.all(matchSnap.docs.map(d => deleteDoc(doc(db, 'matches', d.id))));
      
      // 2. Delete all results
      const resultSnap = await getDocs(collection(db, 'gameResultsTTL'));
      await Promise.all(resultSnap.docs.map(d => deleteDoc(doc(db, 'gameResultsTTL', d.id))));
      
      alert('모든 경기 데이터 및 경기 결과가 삭제되었습니다.');
      fetchRegisteredMatches();
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteMatchesBySport = async (sport: 'soccer' | 'baseball' | 'basketball' | 'volleyball') => {
    const sportName = sport === 'soccer' ? '축구' : sport === 'baseball' ? '야구' : sport === 'basketball' ? '농구' : '배구';
    if (!window.confirm(`정말로 모든 대기 중인 ${sportName} 경기 데이터를 삭제하시겠습니까?`)) return;
    try {
      const snap = await getDocs(collection(db, 'matches'));
      const toDelete = snap.docs.filter(d => d.data().sport === sport && d.data().status === 'pending');
      await Promise.all(toDelete.map(d => deleteDoc(doc(db, 'matches', d.id))));
      alert(`대기 중인 ${sportName} 경기 데이터(${toDelete.length}건)가 삭제되었습니다.`);
      fetchRegisteredMatches();
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

// ... existing imports ...
  const handleResolveMatchVoid = async (matchId: string) => {
    if (!window.confirm(`이 경기를 [적중특례 (연기/취소)] 결과로 처리하시겠습니까?\n모든 관련 배팅은 무효 처리(적중특례)됩니다.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: 'void',
        homeScore: 0,
        awayScore: 0,
        resolvedAt: new Date().toISOString()
      });
      alert(`정산완료: [적중특례] 처리되었습니다.`);
      fetchRegisteredMatches();
    } catch (err) {
      console.error(err);
      alert('정산 처리 중 오류가 발생했습니다.');
    }
  };

  const handleResolveMatchWithScore = async (matchId: string, homeScore: number, awayScore: number) => {
// ...
    let outcome: 'home' | 'draw' | 'away' = 'draw';
    if (homeScore > awayScore) outcome = 'home';
    else if (homeScore < awayScore) outcome = 'away';

    if (!window.confirm(`이 경기를 스코어 [${homeScore} : ${awayScore}] 결과로 전산 및 당첨 정산 처리하시겠습니까?\n이 동작은 되돌릴 수 없으며 대기 중인 모든 배팅 폴더에 당첨금이 자동 지급됩니다.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: outcome,
        homeScore: homeScore,
        awayScore: awayScore,
        resolvedAt: new Date().toISOString()
      });
      alert(`정산완료: [${homeScore} : ${awayScore}] 결과가 성공적으로 반영되었습니다.`);
      fetchRegisteredMatches();
    } catch (err) {
      console.error(err);
      alert('정산 처리 중 오류가 발생했습니다.');
    }
  };

  const handleResolveMatch = async (matchId: string, outcome: 'home' | 'draw' | 'away') => {
    const outcomeLabel = outcome === 'home' ? '홈 승' : outcome === 'draw' ? '무승부' : '원정 승';
    if (!window.confirm(`이 경기를 [${outcomeLabel}] 결과로 전산 및 당첨 정산 처리하시겠습니까?\n이 동작은 되돌릴 수 없으며 대기 중인 모든 배팅 폴더에 당첨금이 자동 지급됩니다.`)) {
      return;
    }

    const homeScore = outcome === 'home' ? 1 : 0;
    const awayScore = outcome === 'away' ? 1 : 0;

    try {
      await updateDoc(doc(db, 'matches', matchId), {
        status: outcome,
        homeScore: homeScore,
        awayScore: awayScore,
        resolvedAt: new Date().toISOString()
      });
      alert(`정산완료: [${outcomeLabel}] 정산이 성공적으로 반영되었습니다.`);
      fetchRegisteredMatches();
    } catch (err) {
      console.error(err);
      alert('정산 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteSingleMatch = async (matchId: string) => {
    if (!window.confirm('해당 경기 데이터를 서버에서 즉시 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      fetchRegisteredMatches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-white">
      
      {/* 1. Bulk Import Block */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
        <h3 className="text-md font-black text-white mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
          신규 스포츠 경기 데이터 파싱 등록
        </h3>
        
        <div className="flex gap-2 mb-4">
          {(['soccer', 'baseball', 'basketball', 'volleyball'] as const).map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${selectedSport === sport ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'}`}
            >
              {sport === 'soccer' ? '축구' : sport === 'baseball' ? '야구' : sport === 'basketball' ? '농구' : '배구'}
            </button>
          ))}
        </div>

        <p className="text-xs text-neutral-400 mb-4">그랩한 배팅 파트너 {selectedSport === 'soccer' ? '축구' : selectedSport === 'baseball' ? '야구' : selectedSport === 'basketball' ? '농구' : '배구'} 문자열 데이터를 아래에 붙여넣어 자동 DB 구축을 시작하세요.</p>
        
        <textarea
          className="w-full h-48 bg-black text-white p-4 rounded-xl border border-neutral-800 focus:border-amber-500/50 mb-4 font-mono text-[11px] outline-none"
          placeholder="06-07 00:00&#10;유로 U19&#10;포르투갈 U19&#10;1.50   3.70&#10;그리스 U19   5.50&#10;무승부   3.70"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleRegisterMatches}
            disabled={isParsing}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 hover:from-amber-400 to-amber-600 hover:to-amber-500 text-black px-6 py-2.5 rounded-xl font-black text-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isParsing ? '등록 중...' : '데이터 분석 및 경기 등록'}
          </button>
          
          <button
            onClick={handleDeleteAllMatches}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-750 text-red-400 border border-neutral-700/60 px-6 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            모든 등록 경기 초기화
          </button>
          <button
            onClick={() => handleDeleteMatchesBySport('soccer')}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-750 text-red-500 border border-neutral-700/60 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            축구초기화
          </button>
          <button
            onClick={() => handleDeleteMatchesBySport('basketball')}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-750 text-red-500 border border-neutral-700/60 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            농구초기화
          </button>
          <button
            onClick={() => handleDeleteMatchesBySport('baseball')}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-750 text-red-500 border border-neutral-700/60 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            야구초기화
          </button>
          <button
            onClick={() => handleDeleteMatchesBySport('volleyball')}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-750 text-red-500 border border-neutral-700/60 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            배구초기화
          </button>
        </div>
        
        <div className="mt-4 text-[10px] text-gray-500 flex items-center gap-1.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span>팁: 복사한 데이터가 정상적으로 포맷팅되지 않을 시 한 단락씩 나누어 파싱해 전송하십시오.</span>
        </div>
      </div>

      {/* 2. Bulk Match Resolution Block */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl mt-6">
        <h3 className="text-md font-black text-white mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          경기 결과 일괄 등록 (텍스트 기반)
        </h3>
        
        <p className="text-xs text-neutral-400 mb-4">"종료" 상태인 경기 결과 텍스트를 붙여넣으세요. 이름과 스코어 차이로 승무패를 판별하여 대기 중인 경기를 일괄 정산합니다.</p>
        
        <textarea
          className="w-full h-32 bg-black text-white p-4 rounded-xl border border-neutral-800 focus:border-emerald-500/50 mb-4 font-mono text-[11px] outline-none"
          placeholder="00:00 종료 카자흐스탄 U19 2 - 4 그리스 U19..."
          value={resultInputText}
          onChange={(e) => setResultInputText(e.target.value)}
        />
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleBulkResolve}
            disabled={isResultParsing}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 hover:from-emerald-400 to-emerald-600 hover:to-emerald-500 text-black px-6 py-2.5 rounded-xl font-black text-xs transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isResultParsing ? '정산 중...' : '결과 일괄 정산 처리'}
          </button>
        </div>
      </div>

      {/* 3. Settle &Settle List Block */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl space-y-4 mt-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-md font-black text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            실시간 등록 경기 관리 & 승무패 결과 정산기
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black border border-neutral-800 text-xs px-2 py-1.5 rounded-lg text-white outline-none focus:border-amber-500/50"
            />
            <button
              onClick={fetchRegisteredMatches}
              className="text-[10px] bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              새로고침
            </button>
          </div>
        </div>

        {loadingMatches ? (
          <div className="py-8 text-center text-neutral-500 font-bold text-xs animate-pulse">
            스포츠 매칭 목록을 동기화 중입니다...
          </div>
        ) : registeredMatches.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl space-y-1.5">
            <HelpCircle className="w-8 h-8 text-neutral-700 mx-auto" />
            <p className="text-xs font-black">등록된 경기가 남아있지 않습니다.</p>
            <p className="text-[10px] text-neutral-600">위 파라미터 영역을 통해 새로운 정규 스포츠 게임들을 업로드하십시오.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-850/80 rounded-xl bg-neutral-950/40">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0b0c10] text-[#71717a] border-b border-neutral-850 text-[10px] font-black uppercase tracking-wider">
                <tr>
                  <th className="p-3">경기일정 / 리그</th>
                  <th className="p-3 text-center">홈 팀 vs 어웨이 팀</th>
                  <th className="p-3 text-center">배당 수율</th>
                  <th className="p-3 text-center">현재정산상태</th>
                  <th className="p-3 text-center">정산 처리 동작</th>
                  <th className="p-3 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850/30 text-xs">
                {registeredMatches
                  .filter((m) => m.status === 'pending')
                  .filter((m) => !searchTerm || m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) || m.league?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3 space-y-1">
                      <div className="font-mono text-neutral-400 font-bold">{m.dateTime}</div>
                      <div className="text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md inline-block">
                        {m.league || '일반 리그'}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-amber-500">{m.homeTeam}</span>
                        <span className="text-neutral-600 text-[10px] font-mono">VS</span>
                        <span className="text-sky-400">{m.awayTeam}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[11px] text-neutral-400 space-y-0.5">
                      <div>승: {m.markets?.matchWinner?.home?.toFixed(2) || '0'}</div>
                      <div>무: {m.markets?.matchWinner?.draw?.toFixed(2) || '-'}</div>
                      <div>패: {m.markets?.matchWinner?.away?.toFixed(2) || '0'}</div>
                    </td>
                    <td className="p-3 text-center">
                      {m.status === 'pending' ? (
                        <span className="px-2 py-1 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded-md font-black text-[10px] inline-block animate-pulse">
                          배팅 접수 중
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-md font-black text-[10px] inline-block">
                          {m.status === 'void' ? '결과: 적중특례' : `결과: ${m.homeScore ?? 0} : ${m.awayScore ?? 0} (${m.status === 'home' ? '홈 승' : m.status === 'draw' ? '무승부' : '원정 승'})`}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {m.status === 'pending' ? (
                        <div className="space-y-2">
                          {/* 스코어 정산 수동 입력 */}
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              placeholder="홈"
                              min="0"
                              id={`score_home_${m.id}`}
                              className="w-11 bg-black border border-neutral-800 text-center text-xs font-mono font-black py-1 px-1.5 rounded focus:border-amber-500/50 outline-none text-white-500"
                            />
                            <span className="text-neutral-600 font-extrabold">:</span>
                            <input
                              type="number"
                              placeholder="원정"
                              min="0"
                              id={`score_away_${m.id}`}
                              className="w-11 bg-black border border-neutral-800 text-center text-xs font-mono font-black py-1 px-1.5 rounded focus:border-amber-500/50 outline-none text-white-500"
                            />
                            <button
                              onClick={() => {
                                const homeEl = document.getElementById(`score_home_${m.id}`) as HTMLInputElement;
                                const awayEl = document.getElementById(`score_away_${m.id}`) as HTMLInputElement;
                                const hVal = parseInt(homeEl?.value);
                                const aVal = parseInt(awayEl?.value);
                                if (isNaN(hVal) || isNaN(aVal)) {
                                  alert('정확한 스코어 숫자를 각각 입력하십시오.');
                                  return;
                                }
                                handleResolveMatchWithScore(m.id, hVal, aVal);
                              }}
                              className="px-2 py-1 text-[10px] font-black rounded bg-amber-500 text-black hover:bg-amber-400 transition cursor-pointer shrink-0"
                            >
                              정산
                            </button>
                          </div>
                          
                          {/* 원클릭 빠른 정산 단축 */}
                          <div className="flex justify-center gap-1 border-t border-neutral-850/40 pt-1.5 flex-wrap">
                            <button
                              onClick={() => handleResolveMatch(m.id, 'home')}
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-amber-900/60 text-amber-500 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                              title="홈 승리 정산 (스코어 1:0 자동 인입)"
                            >
                              홈승(1:0)
                            </button>
                            <button
                              onClick={() => handleResolveMatch(m.id, 'draw')}
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-neutral-750 text-neutral-300 hover:bg-neutral-200 hover:text-black transition cursor-pointer"
                              title="무승부 정산 (스코어 0:0 자동 인입)"
                            >
                              무(0:0)
                            </button>
                            <button
                              onClick={() => handleResolveMatch(m.id, 'away')}
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-sky-900/60 text-sky-400 hover:bg-sky-500 hover:text-black transition cursor-pointer"
                              title="원정 승리 정산 (스코어 0:1 자동 인입)"
                            >
                              원정승(0:1)
                            </button>
                            <button
                              onClick={() => handleResolveMatchVoid(m.id)}
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded border border-rose-900/60 text-rose-500 hover:bg-rose-500 hover:text-black transition cursor-pointer"
                              title="연기/취소로 인한 적중특례 처리"
                            >
                              적중특례
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-600 text-xs font-bold">정산 완료됨</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteSingleMatch(m.id)}
                        className="text-neutral-500 hover:text-rose-500 p-1.5 rounded transition"
                        title="경기 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
