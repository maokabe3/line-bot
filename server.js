import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 環境変数から取得（Renderの管理画面で設定してください）
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  // Webhook検証用
  if (!events || events.length === 0) {
    return res.status(200).send("OK");
  }

  for (const event of events) {
    if (event.type === "message" && event.message.text) {
      const userMessage = event.message.text;
      
      // 1. メッセージを解析（GASのhandleMessage相当）
      const match = userMessage.match(/^(\d{2})([ァ-ヶーぁ-ん\u4e00-\u9fa5a-zA-Z]{2,8})(?:\s+(.+))?$/u);
      
      let replyText = "";
      if (!match) {
        replyText = '🐎 送り方の例:\n「89ヤギ」→ 本日のメインレース占い\n「89ヤギ 有馬記念」→ 指定レース占い\n\n携帯末尾数字2桁＋星座で送ってね！';
      } else {
        const num2 = match[1];
        const seiza = match[2];
        // 2. Geminiで占いを生成
        replyText = await generateUranai(num2, seiza);
      }

      // 3. LINEに返信
      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [{ type: "text", text: replyText }]
        })
      });
    }
  }
  res.status(200).send("OK");
});

// Gemini APIを呼び出す関数
async function generateUranai(num2, seiza) {
  const prompt = `あなたは競馬×相性占いの専門家です。今日の中央競馬のメインレースを想定して占い結果を作成してください。
【ユーザー情報】携帯末尾2桁: ${num2}, 星座: ${seiza}
【出力フォーマット】
⭐[馬名] 🐎
🍀 ラッキーアイテム：[アイテム]
「[四字熟語]」
[ドラマチックなコメント]
🔮 相性スコア [0-100]点`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "⚠️ 占い生成に失敗しました。";
  }
}

app.get("/", (req, res) => res.send("Bot is running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
