import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy-load Gemini Client to prevent crash on startup
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Enable CORS robustly for cross-origin API calls (e.g. from static Firebase Hosting on custom domains)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // API Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 3. 실제 카카오 로그인 인증 URL 요청 API
  app.get("/api/auth/kakao/url", (req, res) => {
    try {
      const origin = (req.query.origin as string) || "";
      const customKey = (req.query.customKey as string) || "";
      
      const clientId = customKey || process.env.KAKAO_REST_API_KEY || process.env.VITE_KAKAO_JAVASCRIPT_KEY || "bb6373111f2679add80deecba86eb2ca"; 
      
      // 어떤 상황에서도 무조건 https://choicekr.co.kr/api/auth/kakao/callback 값이 되도록 고정
      const redirectUri = "https://choicekr.co.kr/api/auth/kakao/callback";
      
      console.log("🧩 [Kakao Login Project System] Generating Direct kakao authorize URL", { origin, clientId, redirectUri });

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        state: `${redirectUri}||${clientId}`, // KOE303 리다이렉트 및 클라이언트 불일치를 완벽하게 방지하기 위해 state에 인코딩하여 전송합니다.
      });

      const kakaolink = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
      res.json({ success: true, url: kakaolink, clientId, redirectUri });
    } catch (err: any) {
      console.error("Error generating Kakao authorize URL:", err);
      res.status(500).json({ success: false, error: err.message || "카카오 로그인 연동 URL 생성에 실패했습니다." });
    }
  });

  // 4. 실제 카카오 로그인 콜백 핸들러 API (토큰 교환 및 프로필정보 획득)
  app.get("/api/auth/kakao/callback", async (req, res) => {
    const { code, state, error: kakaoError, error_description } = req.query;

    // 공통 에러 응답 도구: HTML 페이지 대신 프론트엔드가 처리할 수 있도록 일관된 JSON 형식으로 직접 출력
    const sendErrorResponse = (status: number, message: string) => {
      console.error(`❌ [Kakao Auth Callback Error Handler] Status: ${status}, Message: ${message}`);
      return res.status(status).json({ success: false, error: message });
    };
    
    if (kakaoError) {
      return sendErrorResponse(400, (error_description as string) || (kakaoError as string));
    }

    if (!code) {
      return sendErrorResponse(400, "로그인 인증 코드(Authorization Code)가 누락되었습니다.");
    }

    try {
      // 어떤 상황에서도 무조건 https://choicekr.co.kr/api/auth/kakao/callback 값이 되도록 고정
      const redirectUri = "https://choicekr.co.kr/api/auth/kakao/callback";
      
      const stateStr = (state as string) || "";
      let clientId = "";

      if (stateStr.includes("||")) {
        const parts = stateStr.split("||");
        clientId = parts[1];
      }

      if (!clientId) {
        clientId = process.env.KAKAO_REST_API_KEY || process.env.VITE_KAKAO_JAVASCRIPT_KEY || "bb6373111f2679add80deecba86eb2ca";
      }
      
      console.log("🔑 [Kakao OAuth Token Exchange] Trading authorization code for token", { code, redirectUri, clientId });

      const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          redirect_uri: redirectUri,
          code: code as string,
        }),
      });

      const tokenData = await tokenResponse.json() as any;

      if (!tokenResponse.ok) {
        console.error("Kakao Token trading failure details:", tokenData);
        throw new Error(tokenData.error_description || tokenData.error || "카카오로부터 액세스 토큰을 교환하지 못했습니다.");
      }

      const accessToken = tokenData.access_token;
      console.log("🟢 [Kakao Access Token Acquired]");

      // 사용자 정보 조회
      const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      });

      const userData = await userResponse.json() as any;

      if (!userResponse.ok) {
        console.error("Kakao User Data request failure:", userData);
        throw new Error(userData.msg || "카카오 사용자 정보를 조회할 수 없었습니다.");
      }

      console.log("👤 [Kakao user profile payload]:", userData);

      const id = userData.id;
      const properties = userData.properties || {};
      const kakaoAccount = userData.kakao_account || {};
      
      const nickname = properties.nickname || kakaoAccount.profile?.nickname || `카카오회원_${id}`;
      const email = kakaoAccount.email || `${id}@kakaouser.com`;
      const profileImage = properties.profile_image || kakaoAccount.profile?.profile_image_url || "";

      return res.send(`
        <html>
          <head>
            <title>카카오톡 로그인 완료</title>
          </head>
          <body style="font-family: -apple-system, sans-serif; text-align: center; padding-top: 100px; background-color: #f9fafb;">
            <div style="max-width: 400px; margin: 0 auto; background: white; padding: 40px 30px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
              <div style="background: #fee500; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <svg style="width: 32px; height: 32px; fill: #191919;" viewBox="0 0 24 24">
                  <path d="M12 3c-5.523 0-10 3.535-10 7.9c0 2.825 1.848 5.295 4.633 6.64-.176.65-.635 2.34-.726 2.705-.11.455.168.448.354.323.146-.097 2.337-1.587 3.282-2.228.795.11 1.62.16 2.457.16 5.523 0 10-3.535 10-7.9s-4.477-7.9-10-7.9z" />
                </svg>
              </div>
              <h2 style="color: #111827; margin-bottom: 8px; font-weight: 800;">카카오 로그인 성공!</h2>
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">반갑습니다, <strong>${nickname}</strong>님.<br>귀하의 계정이 정상적으로 연동되었습니다.</p>
              <p style="font-size: 12px; color: #9ca3af;">잠시 후 이 창이 자동으로 닫힙니다.</p>
            </div>
            <script>
              try {
                if (window.opener) {
                  const payload = {
                    type: 'KAKAO_OAUTH_SUCCESS',
                    email: ${JSON.stringify(email)},
                    nickname: ${JSON.stringify(nickname)},
                    id: ${JSON.stringify(id)},
                    profileImage: ${JSON.stringify(profileImage)}
                  };
                  console.log("Sending Kakao OAuth success payload to opener:", payload);
                  window.opener.postMessage(payload, "*");
                  window.close();
                } else {
                  console.warn("Opener window not found. Redirecting to home.");
                  window.location.href = '/';
                }
              } catch (err) {
                console.error("Error communicating with opener:", err);
                alert("로그인을 반영하는 중에 오류가 발생했습니다: " + err.message);
              }
            </script>
          </body>
        </html>
      `);

    } catch (err: any) {
      return sendErrorResponse(500, err.message || "카카오 서버와 API를 연동하는 과정에서 예외가 발생했습니다.");
    }
  });

  // 1. AI 예측 카드 자동 생성 API
  app.post("/api/ai/generate-questions", async (req, res) => {
    console.log("🛠️ [Server] Received AI generation request");
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY missing");
        return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
      }

      console.log("Request body subcategories:", req.body.subcategories);

      const prompt = `You are an expert prediction market creator for a Korean forum (Choice Korea, inspired by Polymarket style).
Your task is to search the web for REAL-WORLD events, schedules, and matches taking place TODAY (May 26, 2026) or the very near future, specifically matching the active subcategories below, and generate highly engaging prediction games.

Active Subcategories & Child categories available on the website (JSON format):
${JSON.stringify(req.body.subcategories, null, 2)}

Requirements:
1. ONLY generate prediction games for the specific subcategories provided in the list above. USE THE EXACT 'key' for subCategory (from the list) AND THE EXACT 'parentCategory' name FOR EACH GENERATED GAME.
2. For sports games, ALWAYS perform an EXHAUSTIVE, COMPREHENSIVE search for EVERY SINGLE GAME scheduled TODAY (May 26, 2026) for KBO, MLB, NPB, NBA, and other major sports. YOU ARE FORBIDDEN FROM OMITTING GAMES. LIST EVERY GAME FOUND. If absolutely no games are today, search for the earliest upcoming scheduled games. 
   Format titles EXACTLY: "[Team A] vs [Team B] 승자는 ?".
   VERY IMPORTANT: Provide FULL, COMPLETE, AND EXACT Team Names in the "options" list. DO NOT TRUNCATE, ABBREVIATE, OR SHORTEN TEAM NAMES UNDER ANY CIRCUMSTANCES. If a team name is normally long, include the full name. Failure to provide full names will break the system. Ensure names are clear and unambiguous.
3. For election or politics prediction games: ALWAYS search and include ALL potential candidates as options. Create engaging titles.
4. For other categories: Search for current hot news/events/prices.
5. If you receive a request to regenerate/re-register games, DO NOT check for existing titles; just generate the best current list.
6. Date limit: Set "endAt" to a realistic ISO datetime string representing the start of the event or match. Ensure you capture games that have not started yet.

Provide the output in KOREAN language only, following this JSON structure:
[
  {
    "title": "예측 카드 제목 (예시와 동일하게 '... 승자는 ?' 형식 준수)",
    "description": "구체적이고 명확한 판정 기준 설명 (한국어)",
    "category": "sports | politics | esports | economy | entertainment | news | broadcast 중 하나 (제공된 리스트의 parentCategory와 정확히 일치)",
    "subCategory": "Kategorey Key (제공된 리스트의 'key'와 정확히 일치해서 바인딩)",
    "parentCategory": "부모 카테고리 이름 (제공된 리스트의 'parentCategory'와 정확히 일치)",
    "options": ["옵션 1", "옵션 2", ...],
    "endAt": "마감 시점 ISO DateTime String",
    "sourceUrl": "판정에 활용할 핵심 검색 및 참고 검증용 설명 또는 검색어"
  }
]`;

      const response = await getAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                subCategory: { type: Type.STRING },
                parentCategory: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                endAt: { type: Type.STRING },
                sourceUrl: { type: Type.STRING }
              },
              required: ["title", "description", "category", "subCategory", "parentCategory", "options", "endAt", "sourceUrl"]
            }
          }
        }
      });

      let rawText = response.text ? response.text.trim() : "[]";
      // Robustly extract JSON if it's wrapped in markdown
      const jsonStr = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const cards = JSON.parse(jsonStr);
      res.json({ success: true, data: cards });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ success: false, error: error.message || "예측 생성 중 오류가 발생했습니다." });
    }
  });

  // 2. AI 오라클 판정 시스템 (자동 정산) API
  app.post("/api/ai/resolve-prediction", async (req, res) => {
    const { title, description, options, sourceUrl } = req.body;

    if (!title || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: "잘못된 데이터 요청 형식입니다." });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
      }

      const prompt = `You are an unbiased AI Oracle for a prediction market. Your job is to search the web and determine the absolute truth about this event.
Event Title: "${title}"
Event Details: "${description}"
Search Reference: "${sourceUrl}"
Available Options of Prediction: ${JSON.stringify(options)}

Use Google Search to active check the actual, real-world result of this event. 
Return the output in JSON format with KOREAN explanation:
{
  "winningOption": "options 배열 항목 중 정확히 매칭하는 승리한 단 하나의 옵션 문자열 (예: 'YES (득점 기록)')",
  "evidence": "구체적인 인터넷 뉴스 검색 결과 및 입증된 사실을 서술한 근거 한마디 (한국어)",
  "source": "참조한 뉴스 기사나 사이트 제목"
}`;

      const response = await getAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              winningOption: { type: Type.STRING },
              evidence: { type: Type.STRING },
              source: { type: Type.STRING }
            },
            required: ["winningOption", "evidence", "source"]
          }
        }
      });

      const jsonStr = response.text ? response.text.trim() : "{}";
      const resolution = JSON.parse(jsonStr);
      res.json({ success: true, data: resolution });
    } catch (error: any) {
      console.error("AI Resolution Error:", error);
      res.status(500).json({ success: false, error: error.message || "AI 판정 중 오류가 발생했습니다." });
    }
  });

  // Vite middleware setup
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });

  // 실시간 접속자 수 전송 함수 (Broadcast standard presence event to all clients)
  const broadcastOnlineCount = () => {
    let openClientsCount = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 = OPEN
        openClientsCount++;
      }
    });

    // 최소 1명의 활성 유저(나 자신) 보정
    if (openClientsCount < 1) {
      openClientsCount = 1;
    }

    console.log(`🌐 [Real-Time Active User Count] Broadcasting count: ${openClientsCount}`);

    const payload = JSON.stringify({
      type: "SYSTEM_ONLINE_COUNT",
      payload: { count: openClientsCount }
    });

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("🟢 WebSocket Client Connected");

    // 연결 직후 즉시 갱신 전송 (지연 처리로 wss.clients에 최종 등록 보장)
    setTimeout(() => {
      broadcastOnlineCount();
    }, 100);

    ws.on("message", (message) => {
      // 전달받은 메세지가 있으면 전체 클라이언트에 단순히 BroadCast
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message.toString());
        }
      });
    });

    ws.on("close", () => {
      console.log("🔴 WebSocket Client Disconnected");
      // 유저가 웹브라우저 창 해제/탭 닫기를 수행했으므로 즉각 인원수 카운트다운 갱신 브로드캐스트
      broadcastOnlineCount();
    });

    ws.on("error", (err) => {
      console.error("🛜 WebSocket Error:", err);
    });
  });
}

startServer();

