const fs = require('fs');
const path = './src/MainPage.tsx';
let c = fs.readFileSync(path, 'utf8');

const startIndex = c.indexOf('// Dynamic background pending-bets auto-resolver');
const endIndex = c.indexOf('}, [currentUserData]);', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const finalEndIndex = endIndex + '}, [currentUserData]);'.length;
  c = c.slice(0, startIndex) + 
      '// [미니게임 자동정산 시스템 중지]\n  // 회원 배팅시 대기상태로 유지하고, 어드민의 "적중보정 시스템"이 결과값을 확정하도록 변경되었습니다.\n' + 
      c.slice(finalEndIndex);
  fs.writeFileSync(path, c);
  console.log('Successfully disabled auto settlement');
} else {
  console.log('Could not find the target range');
}
