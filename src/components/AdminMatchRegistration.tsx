import React, { useState } from 'react';
import { addDoc, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, AlertCircle, Trash2 } from 'lucide-react';

export default function AdminMatchRegistration() {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleRegisterMatches = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);

    try {
      const lines = inputText.split('\n').filter(l => l.trim() !== '');
      let currentLeague = 'Unknown';
      let matchesToSave = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 리그 헤더 체크 (시간 포맷이나 배당이 없는 라인을 리그로 간주)
        if (!/^\d{2}-\d{2}/.test(line) && !/^\d+\.\d+/.test(line)) {
          currentLeague = line;
          continue;
        }

        // 경기 데이터 파싱 (날짜 시간 포함 행)
        if (/^\d{2}-\d{2}\s\d{2}:\d{2}/.test(line)) {
          // 데이터가 최소 3줄(홈, 어웨이, 무승부)은 있어야 함
          if (i + 3 >= lines.length) continue;
          
          const homeLine = lines[i + 1]?.split('\t') || [];
          const awayLine = lines[i + 2]?.split('\t') || [];
          const drawLine = lines[i + 3]?.split('\t') || [];
          
          try {
            const match = {
              dateTime: line,
              league: currentLeague,
              homeTeam: homeLine[0] || 'Unknown',
              awayTeam: awayLine[0] || 'Unknown',
              markets: {
                matchWinner: {
                  home: parseFloat(homeLine[2]) || 0,
                  draw: parseFloat(drawLine[1]) || 0,
                  away: parseFloat(awayLine[1]) || 0
                },
                handicap: {
                  value: homeLine[3]?.split(' ')[0] || '',
                  oddsHome: parseFloat(homeLine[3]?.split(' ')[1]) || 0,
                  oddsAway: parseFloat(awayLine[2]) || 0
                },
                overUnder: {
                  value: homeLine[4]?.split(' ')[1] || '',
                  oddsOver: parseFloat(homeLine[4]?.split(' ')[2]) || 0,
                  oddsUnder: parseFloat(awayLine[3]?.split(' ')[1]) || 0
                }
              },
              status: 'pending',
              createdAt: new Date().toISOString()
            };
            matchesToSave.push(match);
            i += 3; 
          } catch (err) {
            console.error("Failed to parse match, skipping:", err);
          }
        }
      }

      for (const match of matchesToSave) {
        await addDoc(collection(db, 'matches'), match);
      }

      alert(`${matchesToSave.length}개의 경기가 등록되었습니다.`);
      setInputText('');
    } catch (e) {
      console.error(e);
      alert('데이터 파싱 오류: 데이터 형식을 확인해주세요.');
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
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-4">경기 데이터 붙여넣기</h3>
      <textarea
        className="w-full h-64 bg-black text-white p-4 rounded border border-neutral-700 mb-4 font-mono text-xs"
        placeholder="데이터를 붙여넣으세요..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button
        onClick={handleRegisterMatches}
        disabled={isParsing}
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded font-bold"
      >
        <Save className="w-4 h-4" />
        {isParsing ? '등록 중...' : '데이터 분석 및 경기 등록'}
      </button>
      <button
        onClick={handleDeleteAllMatches}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold mt-4"
      >
        <Trash2 className="w-4 h-4" />
        모든 경기 데이터 삭제
      </button>
      <div className="mt-4 text-xs text-gray-500">
        <AlertCircle className="inline w-3 h-3 mr-1" />
        팁: 타 사이트에서 복사한 형식에 따라 파싱 로직의 수정이 필요할 수 있습니다.
      </div>
    </div>
  );
}
