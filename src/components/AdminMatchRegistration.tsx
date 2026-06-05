import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
  const num = parseFloat(cleaned.replace(/[+-Hh]/g, '').trim());
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

      const lines = inputText.split('\n').map(l => l.trim()).filter(Boolean);
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
        if (/^\d{2}-\d{2}\s\d{2}:\d{2}/.test(line)) {
          currentBlock = { dateTime: line, allLines: [] };
          matchBlocks.push(currentBlock);
        } else {
          if (currentBlock) {
            currentBlock.allLines.push(line);
          } else {
            if (!/^\d+\.\d+/.test(line)) {
              currentLeague = line;
            }
          }
        }
      }

      for (const block of matchBlocks) {
        const blockLines = block.allLines;
        if (blockLines.length === 0) continue;

        const isOddsLine = (txt: string): boolean => {
          return /\d+\.\d+/.test(txt) || /[HhOoUu][+-]?\d/.test(txt);
        };

        let firstOddsLineIdx = -1;
        for (let j = 0; j < blockLines.length; j++) {
          if (isOddsLine(blockLines[j])) {
            firstOddsLineIdx = j;
            break;
          }
        }

        if (firstOddsLineIdx === -1) continue;

        const homeTeam = blockLines[firstOddsLineIdx - 1];
        if (!homeTeam) continue;

        let matchLeague = currentLeague;
        if (firstOddsLineIdx - 1 > 0) {
          matchLeague = blockLines[firstOddsLineIdx - 2];
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

          const awayTeam = rawAwayTokens.slice(0, firstOddsIndex).join(' ');
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

                handicaps.push({
                  value: threshold,
                  home: homeHandiOdds,
                  away: awayHandiOdds
                });
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

          const key = `${homeTeam.trim()}_${awayTeam.trim()}_${block.dateTime.trim()}`;
          const existingMatch = existingMap.get(key);

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
              homeTeam: homeTeam.trim(),
              awayTeam: awayTeam.trim(),
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
