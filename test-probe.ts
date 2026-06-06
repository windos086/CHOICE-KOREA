async function probeNtry() {
  const url = "https://www.ntry.com/data/json/games/keno_ladder/result.json";
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const data = await resp.json();
    console.log(`--- ${url} ---`);
    console.log(JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.log(`--- ${url} --- ERROR: ${e.message}`);
  }
}
probeNtry();
