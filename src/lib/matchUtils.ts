export function getSportCategory(match: any): '축구' | '농구' | '야구' | '배구' | '아이스하키' {
  if (match.sport === 'soccer' || match.sport === '축구') return '축구';
  if (match.sport === 'basketball' || match.sport === '농구') return '농구';
  if (match.sport === 'baseball' || match.sport === '야구') return '야구';
  if (match.sport === 'volleyball' || match.sport === '배구') return '배구';
  if (match.sport === 'hockey' || match.sport === '아이스하키') return '아이스하키';

  const name = ((match.league || '') + ' ' + (match.homeTeam || '') + ' ' + (match.awayTeam || '') + ' ' + (match.sport || '')).toLowerCase();
  if (name.includes('농구') || name.includes('nba') || name.includes('kbl') || name.includes('wkbl') || name.includes('basketball')) {
    return '농구';
  }
  if (name.includes('야구') || name.includes('mlb') || name.includes('kbo') || name.includes('npb') || name.includes('baseball') || name.includes('라스 투나스') || name.includes('마탄자스')) {
    return '야구';
  }
  if (name.includes('배구') || name.includes('kovo') || name.includes('volleyball')) {
    return '배구';
  }
  if (name.includes('하키') || name.includes('아이스하키') || name.includes('nhl') || name.includes('hockey')) {
    return '아이스하키';
  }
  return '축구';
}
