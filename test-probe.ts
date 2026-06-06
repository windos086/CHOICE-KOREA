async function probeThemeFiles() {
  const host = "https://xn--950bo4em5v.co";
  const paths = [
    "/data/json/games/theme/ladder/result.json",
    "/data/json/games/theme/ladder/recent.json",
    "/data/json/games/theme/ladder/today.json",
    "/data/json/games/theme/ladder/dist.json",
    "/data/json/games/theme/powerball/result.json",
    "/data/json/games/theme/powerball/recent.json",
    "/data/json/games/theme/powerball/today.json",
    "/data/json/games/theme/powerball/dist.json",
    "/data/json/games/theme/power_ladder/result.json",
    "/data/json/games/theme/power_ladder/recent.json"
  ];

  for (const path of paths) {
    const url = `${host}${path}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      console.log(`PROBE ${url} -> Status: ${res.status}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`  Data: ${text.substring(0, 200)}`);
      }
    } catch (e: any) {
      console.log(`PROBE ${url} -> ERROR: ${e.message}`);
    }
  }
}

probeThemeFiles();
