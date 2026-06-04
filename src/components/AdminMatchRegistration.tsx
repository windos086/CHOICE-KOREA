import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Save, AlertCircle } from 'lucide-react';

export default function AdminMatchRegistration() {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleRegisterMatches = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);

    try {
      const lines = inputText.split('\n').map(l => l.trim()).filter(l => l !== '');
      
      let currentLeague = 'Unknown';
      let matchesToSave = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 리그 확인
        if (line.includes('>')) {
          currentLeague = line;
          continue;
        }

        // 날짜/시간 확인 -> 매치 시작
        if (/^\d{2}-\d{2}\s\d{2}:\d{2}$/.test(line)) {
          // 다음 라인들에서 팀과 배당 찾기
          // 구조: [팀A] [배당1] [VS] [배당2] [팀B] -> 혹은 줄바꿈이 다를 수 있음.
          // 예시 파싱: 
          // 우크라이나
          // 5.09
          // VS
          // 1.15
          // 독일 (W)
          
          // 다음 5-6라인을 살펴봄
          const nextLines = lines.slice(i + 1, i + 10);
          
          // 팀과 배당 찾기 (단순화: 배당이 숫자인 것을 찾음)
          const teams = nextLines.filter(l => /^[가-힣a-zA-Z\s\(\)]+$/.test(l) && l !== 'VS');
          const odds = nextLines.filter(l => /^\d+\.\d+$/.test(l)).map(l => parseFloat(l));
          
          if (teams.length >= 2 && odds.length >= 2) {
            matchesToSave.push({
              dateTime: line,
              league: currentLeague,
              homeTeam: teams[0],
              homeDividend: odds[0],
              awayTeam: teams[1],
              awayDividend: odds[1],
              status: 'pending',
              createdAt: new Date().toISOString()
            });
            // 파싱한 만큼 건너뛰기
            i += 5; 
          }
          continue;
        }
      }

      // Firebase에 저장
      for (const match of matchesToSave) {
        await addDoc(collection(db, 'matches'), match);
      }

      alert(`${matchesToSave.length}개의 경기가 등록되었습니다.`);
      setInputText('');
    } catch (error) {
      console.error('Error registering matches:', error);
      alert('경기 데이터 파싱 중 오류가 발생했습니다. (팀이름/배당 형식을 확인해주세요.)');
    } finally {
      setIsParsing(false);
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
      <div className="mt-4 text-xs text-gray-500">
        <AlertCircle className="inline w-3 h-3 mr-1" />
        팁: 타 사이트에서 복사한 형식에 따라 파싱 로직의 수정이 필요할 수 있습니다.
      </div>
    </div>
  );
}
