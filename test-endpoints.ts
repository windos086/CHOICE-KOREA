async function testPrecisely() {
  const host = "https://xn--950bo4em5v.co";
  
  // Try combinations of path prefixes and game names and file names
  const prefixes = [
    "/data/json/games/theme",
    "/data/json/games",
    "/data/json"
  ];
  
  const games = [
    "ladder", "speedladder", "speed_ladder", "daridari", "powerball", "powerball3", "powerball5", "power_ladder", "powerladder", "keno_ladder", "kenosadari"
  ];
  
  const files = [
    "dist.json", "result.json", "recent.json", "today.json", "dist_today.json"
  ];

  for (const prefix of prefixes) {
    for (const game of games) {
      for (const file of files) {
        const url = `${host}${prefix}/${game}/${file}`;
        try {
          const res = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": `${host}/`
            }
          });
          if (res.status === 200) {
            const text = await res.text();
            console.log(`✅ MATCH: ${url}`);
            console.log(`Data: ${text.substring(0, 150)}`);
            console.log("---------------------------------------");
          }
        } catch (err: any) {
          // ignore
        }
      }
    }
  }
}

testPrecisely();
