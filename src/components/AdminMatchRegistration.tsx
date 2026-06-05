import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, deleteDoc, doc, updateDoc, db } from '../lib/firebase';
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
  const [isParsing, setIsParsing] = useState(false);
  const [registeredMatches, setRegisteredMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const fetchRegisteredMatches = async () => {
    setLoadingMatches(true);
    try {
      const snap = await getDocs(collection(db, 'matches'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
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
        const key = `${m.homeTeam.trim()}_${m.awayTeam.trim()}_${m.dateTime.trim()}`;
        existingMap.set(key, m);
      }

      const standardOddsCache = new Map<string, { home: number; away: number }>();

      const lines = inputText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      console.log('Lines to parse:', lines);
      let currentLeague = '일반 리그';
      let addedCount = 0;
      let updatedCount = 0;

      interface MatchBlock {
        dateTime: string;
        allLines: string[];
      }

      const matchBlocks: MatchBlock[] = [];
      let currentBlock: MatchBlock | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\d{2}-\d{2}\s\d{2}:\d{2}/.test(line)) {
          console.log('Found block header:', line);
          const dateMatch = line.match(/\d{2}-\d{2}\s\d{2}:\d{2}/);
          const dateStr = dateMatch![0];
          
          // Check if there is any league text in the same line as the date stamp (e.g. "06-05 23:00 [K-League]")
          const remaining = line.replace(dateStr, '').trim();
          const cleanLg = remaining.replace(/[\[\]\(\)]/g, '').trim();
          if (cleanLg) {
            currentLeague = cleanLg;
          }

          // Backtrack previous block's trailing lines. If there are trailing lines without numbers after the last odds/numeric line,
          // those lines representing a newly declared league or header for the upcoming matches.
          if (currentBlock && currentBlock.allLines.length > 0) {
            const isOddsLine = (txt: string): boolean => {
              return /\d+\.\d+/.test(txt);
            };
            let lastOddsLineIdx = -1;
            for (let j = currentBlock.allLines.length - 1; j >= 0; j--) {
              if (isOddsLine(currentBlock.allLines[j])) {
                lastOddsLineIdx = j;
                break;
              }
            }
            if (lastOddsLineIdx !== -1 && lastOddsLineIdx < currentBlock.allLines.length - 1) {
              const extraLines = currentBlock.allLines.slice(lastOddsLineIdx + 1);
              const leagueText = extraLines.map(l => l.trim()).filter(Boolean).join(' ');
              if (leagueText && !/\d/.test(leagueText)) {
                currentLeague = leagueText.replace(/[\[\]\(\)]/g, '').trim();
                console.log('Extracted league from previous block trailing lines:', currentLeague);
              }
              currentBlock.allLines = currentBlock.allLines.slice(0, lastOddsLineIdx + 1);
            }
          }

          currentBlock = { dateTime: dateStr, allLines: [] };
          matchBlocks.push(currentBlock);
        } else {
          if (currentBlock) {
            currentBlock.allLines.push(line);
          } else {
            // League detection for lines before the first block
            if (!/\d+\.\d+/.test(line)) {
              currentLeague = line.replace(/[\[\]\(\)]/g, '').trim();
            }
          }
        }
      }

      console.log('Found blocks:', matchBlocks.length);

      for (const block of matchBlocks) {
        const blockLines = block.allLines;
        if (blockLines.length === 0) continue;

        let standardHomeOdds = 0;
        let standardDrawOdds = 0;
        let standardAwayOdds = 0;
        let homeTeamName = '';
        let awayTeamName = '';
        let foundStandard = false;

        const skipKeywords = ['핸디', '핸디캡', '오버', '언더', '언오버', 'U/O', 'under', 'over', 'handicap'];
        const isMarketLine = (txt: string): boolean => {
          return skipKeywords.some(k => txt.toLowerCase().includes(k));
        };

        // Scan block lines to extract standard match winner odds and team names
        for (let j = 0; j < blockLines.length; j++) {
          const line = blockLines[j];
          if (isMarketLine(line)) continue;

          const decimals = line.match(/\d+(\.\d+)?/g) || [];
          if (decimals.length === 3) {
            standardHomeOdds = parseFloat(decimals[0]) || 0;
            standardDrawOdds = parseFloat(decimals[1]) || 0;
            standardAwayOdds = parseFloat(decimals[2]) || 0;

            const idxFirst = line.indexOf(decimals[0]);
            const idxLast = line.indexOf(decimals[2]) + decimals[2].length;
            const textLeft = line.substring(0, idxFirst).trim();
            const textRight = line.substring(idxLast).trim();

            if (textLeft && textRight) {
              homeTeamName = textLeft;
              awayTeamName = textRight;
            } else {
              homeTeamName = (blockLines[j - 1] || '').trim();
              awayTeamName = (blockLines[j + 1] || '').trim();
            }
            foundStandard = true;
            break;
          } else if (decimals.length === 2 && !line.includes('/') && !line.toLowerCase().includes('o') && !line.toLowerCase().includes('u')) {
            standardHomeOdds = parseFloat(decimals[0]) || 0;
            standardDrawOdds = 0;
            standardAwayOdds = parseFloat(decimals[1]) || 0;

            const idxFirst = line.indexOf(decimals[0]);
            const idxLast = line.indexOf(decimals[1]) + decimals[1].length;
            const textLeft = line.substring(0, idxFirst).trim();
            const textRight = line.substring(idxLast).trim();

            if (textLeft && textRight) {
              homeTeamName = textLeft;
              awayTeamName = textRight;
            } else {
              homeTeamName = (blockLines[j - 1] || '').trim();
              awayTeamName = (blockLines[j + 1] || '').trim();
            }
            foundStandard = true;
            break;
          }
        }

        // Dropback fallback parsing for team names if standard winner row was omitted in raw paste
        if (!foundStandard) {
          for (let j = 0; j < blockLines.length; j++) {
            const line = blockLines[j];
            const decimals = line.match(/\d+(\.\d+)?/g) || [];
            if (decimals.length >= 2) {
              const idxFirst = line.indexOf(decimals[0]);
              const lastDec = decimals[decimals.length - 1];
              const idxLast = line.indexOf(lastDec) + lastDec.length;
              const textLeft = line.substring(0, idxFirst).replace(/[\[\]\(\)\+\-\d\.\s]/g, '').trim();
              const textRight = line.substring(idxLast).replace(/[\[\]\(\)\+\-\d\.\s]/g, '').trim();

              const cleanedLeft = textLeft
                .replace(/핸디캡/g, '')
                .replace(/핸디/g, '')
                .replace(/오버언더/g, '')
                .replace(/언더오버/g, '')
                .replace(/오버/g, '')
                .replace(/언더/g, '')
                .trim();

              const cleanedRight = textRight
                .replace(/핸디캡/g, '')
                .replace(/핸디/g, '')
                .replace(/오버언더/g, '')
                .replace(/언더오버/g, '')
                .replace(/오버/g, '')
                .replace(/언더/g, '')
                .trim();

              if (cleanedLeft && cleanedRight) {
                homeTeamName = cleanedLeft;
                awayTeamName = cleanedRight;
                break;
              } else {
                const prevLine = (blockLines[j - 1] || '').trim();
                const nextLine = (blockLines[j + 1] || '').trim();
                const cleanedPrev = prevLine
                  .replace(/핸디캡/g, '')
                  .replace(/핸디/g, '')
                  .replace(/오버언더/g, '')
                  .replace(/언더오버/g, '')
                  .replace(/오버/g, '')
                  .replace(/언더/g, '')
                  .replace(/[\[\]\(\)\+\-\d\.\s]/g, '')
                  .trim();
                const cleanedNext = nextLine
                  .replace(/핸디캡/g, '')
                  .replace(/핸디/g, '')
                  .replace(/오버언더/g, '')
                  .replace(/언더오버/g, '')
                  .replace(/오버/g, '')
                  .replace(/언더/g, '')
                  .replace(/[\[\]\(\)\+\-\d\.\s]/g, '')
                  .trim();
                if (cleanedPrev) homeTeamName = cleanedPrev;
                if (cleanedNext) awayTeamName = cleanedNext;
                if (homeTeamName && awayTeamName) break;
              }
            }
          }
        }

        homeTeamName = homeTeamName.replace(/[\[\]\(\)]/g, '').trim();
        awayTeamName = awayTeamName.replace(/[\[\]\(\)]/g, '').trim();

        if (!homeTeamName || !awayTeamName) {
          console.log('Skipping block, could not extract team names:', block);
          continue;
        }

        let matchLeague = currentLeague;
        if (blockLines[0] && !/\d/.test(blockLines[0])) {
          matchLeague = blockLines[0].replace(/[\[\]\(\)]/g, '').trim();
        }

        try {
          const key = `${homeTeamName.trim()}_${awayTeamName.trim()}_${block.dateTime.trim()}`;
          const existingMatch = existingMap.get(key);

          if (foundStandard && standardHomeOdds > 0 && standardAwayOdds > 0) {
            standardOddsCache.set(key, { home: standardHomeOdds, away: standardAwayOdds });
          }

          const handicaps: any[] = [];
          const overUnders: any[] = [];

          for (let j = 0; j < blockLines.length; j++) {
            const line = blockLines[j];
            const lowerLine = line.toLowerCase();

            // Handicap Line Parsing
            if (lowerLine.includes('핸디') || lowerLine.includes('handi')) {
              const decimals = line.match(/\d+(\.\d+)?/g) || [];
              let thresholdVal = '';
              let homeHandiOdds = 1.00;
              let awayHandiOdds = 1.00;

              if (decimals.length === 3) {
                homeHandiOdds = parseFloat(decimals[0]) || 1.00;
                thresholdVal = decimals[1];
                awayHandiOdds = parseFloat(decimals[2]) || 1.00;
              } else if (decimals.length === 2) {
                homeHandiOdds = parseFloat(decimals[0]) || 1.00;
                thresholdVal = decimals[1];

                for (let k = -2; k <= 2; k++) {
                  if (k === 0) continue;
                  const adjIdx = j + k;
                  if (adjIdx >= 0 && adjIdx < blockLines.length) {
                    const adjLine = blockLines[adjIdx];
                    const adjDecs = adjLine.match(/\d+(\.\d+)?/g) || [];
                    if (adjDecs.length === 1 && !adjLine.includes('/') && !adjLine.toLowerCase().includes('o') && !adjLine.toLowerCase().includes('u')) {
                      awayHandiOdds = parseFloat(adjDecs[0]) || 1.00;
                      break;
                    }
                  }
                }
              }

              if (thresholdVal && !isZeroHandicap(thresholdVal)) {
                const cleanThreshold = thresholdVal.replace(/[+-]/g, '').trim();
                let adjustedThreshold = thresholdVal;

                // Judge favorite purely from standard matchWinner odds
                let isHomeFavorite = true;

                const cachedStandard = standardOddsCache.get(key);
                const dbStandardHome = existingMatch?.markets?.matchWinner?.home || (foundStandard ? standardHomeOdds : 0);
                const dbStandardAway = existingMatch?.markets?.matchWinner?.away || (foundStandard ? standardAwayOdds : 0);

                let checkHome = 0;
                let checkAway = 0;

                if (cachedStandard) {
                  checkHome = cachedStandard.home;
                  checkAway = cachedStandard.away;
                } else if (dbStandardHome && dbStandardAway) {
                  checkHome = dbStandardHome;
                  checkAway = dbStandardAway;
                }

                if (checkHome > 0 && checkAway > 0) {
                  if (checkHome < checkAway) {
                    isHomeFavorite = true;
                  } else if (checkAway < checkHome) {
                    isHomeFavorite = false;
                  } else {
                    isHomeFavorite = true;
                  }
                } else {
                  if (thresholdVal.includes('-')) {
                    isHomeFavorite = true;
                  } else if (thresholdVal.includes('+')) {
                    isHomeFavorite = false;
                  } else {
                    isHomeFavorite = true;
                  }
                }

                if (isHomeFavorite) {
                  adjustedThreshold = `-${cleanThreshold}`;
                } else {
                  adjustedThreshold = `+${cleanThreshold}`;
                }

                handicaps.push({
                  value: adjustedThreshold,
                  home: homeHandiOdds,
                  away: awayHandiOdds
                });
              }
            }

            // Over Under Line Parsing
            if (lowerLine.includes('오버') || lowerLine.includes('언더') || lowerLine.includes('언오버') || lowerLine.includes('under') || lowerLine.includes('over') || lowerLine.includes('u/o')) {
              const decimals = line.match(/\d+(\.\d+)?/g) || [];
              let thresholdVal = '';
              let overOdds = 1.00;
              let underOdds = 1.00;

              if (decimals.length === 3) {
                overOdds = parseFloat(decimals[0]) || 1.00;
                thresholdVal = decimals[1];
                underOdds = parseFloat(decimals[2]) || 1.00;
              } else if (decimals.length === 2) {
                overOdds = parseFloat(decimals[0]) || 1.00;
                thresholdVal = decimals[1];

                for (let k = -2; k <= 2; k++) {
                  if (k === 0) continue;
                  const adjIdx = j + k;
                  if (adjIdx >= 0 && adjIdx < blockLines.length) {
                    const adjLine = blockLines[adjIdx];
                    const adjDecs = adjLine.match(/\d+(\.\d+)?/g) || [];
                    if (adjDecs.length === 1 && !adjLine.includes('/') && !adjLine.toLowerCase().includes('h')) {
                      underOdds = parseFloat(adjDecs[0]) || 1.00;
                      break;
                    }
                  }
                }
              }

              if (thresholdVal) {
                const cleanThreshold = thresholdVal.replace(/[^\d\.]/g, '').trim();
                overUnders.push({
                  value: cleanThreshold,
                  over: overOdds,
                  under: underOdds
                });
              }
            }
          }

          const finalMatchWinner = {
            home: foundStandard ? standardHomeOdds : 0,
            draw: foundStandard ? standardDrawOdds : 0,
            away: foundStandard ? standardAwayOdds : 0
          };

          if (!foundStandard && existingMatch?.markets?.matchWinner) {
            finalMatchWinner.home = existingMatch.markets.matchWinner.home || 0;
            finalMatchWinner.draw = existingMatch.markets.matchWinner.draw || 0;
            finalMatchWinner.away = existingMatch.markets.matchWinner.away || 0;
          }

          const finalHandicaps = handicaps.length > 0 ? handicaps : (existingMatch?.markets?.handicaps || []);
          const finalOverUnders = overUnders.length > 0 ? overUnders : (existingMatch?.markets?.overUnders || []);

          const parsedMarkets = {
            matchWinner: finalMatchWinner,
            handicap: finalHandicaps.length > 0 ? finalHandicaps[0] : { value: '', home: 0, away: 0 },
            overUnder: finalOverUnders.length > 0 ? finalOverUnders[0] : { value: '', oddsOver: 0, oddsUnder: 0 },
            handicaps: finalHandicaps,
            overUnders: finalOverUnders
          };

          if (existingMatch) {
            if (areMarketsDifferent(parsedMarkets, existingMatch.markets)) {
              await updateDoc(doc(db, 'matches', existingMatch.docId), {
                markets: parsedMarkets,
                updatedAt: new Date().toISOString()
              });
              updatedCount++;
            }
          } else {
            const newMatchDoc = {
              dateTime: block.dateTime,
              league: matchLeague,
              homeTeam: homeTeamName.trim(),
              awayTeam: awayTeamName.trim(),
              homeScore: 0,
              awayScore: 0,
              markets: parsedMarkets,
              status: 'pending',
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
    if (!window.confirm('정말로 모든 경기 데이터를 삭제하시겠습니까?')) return;
    try {
      const snap = await getDocs(collection(db, 'matches'));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'matches', d.id))));
      alert('모든 경기 데이터가 삭제되었습니다.');
      fetchRegisteredMatches();
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleResolveMatchWithScore = async (matchId: string, homeScore: number, awayScore: number) => {
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
        <p className="text-xs text-neutral-400 mb-4">그랩한 배팅 파트너 스포츠 문자열 데이터를 아래에 붙여넣어 자동 DB 구축을 시작하세요.</p>
        
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
        </div>
        
        <div className="mt-4 text-[10px] text-gray-500 flex items-center gap-1.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span>팁: 복사한 데이터가 정상적으로 포맷팅되지 않을 시 한 단락씩 나누어 파싱해 전송하십시오.</span>
        </div>
      </div>

      {/* 2. Settle &Settle List Block */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-md font-black text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            실시간 등록 경기 관리 & 승무패 결과 정산기
          </h3>
          <button
            onClick={fetchRegisteredMatches}
            className="text-[10px] bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg transition"
          >
            새로고침
          </button>
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
                {registeredMatches.map((m) => (
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
                          결과: {m.homeScore ?? 0} : {m.awayScore ?? 0} ({m.status === 'home' ? '홈 승' : m.status === 'draw' ? '무승부' : '원정 승'})
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
                          <div className="flex justify-center gap-1 border-t border-neutral-850/40 pt-1.5">
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
