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
      // 복사한 데이터를 기반으로 경기 정보 파싱
      // 줄바꿈으로 나누어 분석
      const lines = inputText.split('\n').map(l => l.trim()).filter(l => l !== '');
      
      // 아주 단순한 파싱 (문자열 매칭)
      // 예시: 우크라이나 / 5.09 / VS / 1.15 / 독일
      let currentMatch: any = null;
      const matchesToSave = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 리그 확인 (예: ">" 로 구분)
        if (line.includes('>')) {
          if (currentMatch) matchesToSave.push(currentMatch);
          currentMatch = { league: line, status: 'pending', createdAt: new Date().toISOString() };
          continue;
        }

        // 날짜/시간 확인 (예: 06-05 05:30)
        if (/^\d{2}-\d{2}\s\d{2}:\d{2}$/.test(line)) {
          if (currentMatch) currentMatch.dateTime = line;
          continue;
        }

        // 팀/배당 확인 (우크라이나 / 5.09)
        if (currentMatch && !currentMatch.homeTeam && /^[가-힣a-zA-Z\s\(\)]+$/.test(line)) {
            currentMatch.homeTeam = line;
            currentMatch.homeDividend = parseFloat(lines[i+1] || '0');
            currentMatch.awayDividend = parseFloat(lines[i+3] || '0');
            currentMatch.awayTeam = lines[i+4];
            i += 4; // 건너뛰기
            continue;
        }
      }
      if (currentMatch) matchesToSave.push(currentMatch);

      // Firebase에 저장
      for (const match of matchesToSave) {
        if (match.homeTeam && match.awayTeam) {
            await addDoc(collection(db, 'matches'), match);
        }
      }

      alert(`${matchesToSave.length}개의 경기가 등록되었습니다.`);
      setInputText('');
    } catch (error) {
      console.error('Error registering matches:', error);
      alert('경기 데이터 파싱 중 오류가 발생했습니다. 형식을 확인해주세요.');
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
