import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// ==== 占い ====
async function generateUranai(num2, seiza) {
  const API_KEY = process.env.GEMINI_API_KEY;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `あなたは競馬×相性占いの専門家です。
携帯末尾: ${num2}, 星座: ${seiza} の占いを作成してください。`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    return data?.candidates?.[0]?.content?.parts?.[0]?.text
      || "占い生成失敗";

  } catch (e) {
    console.error(e);
    return "通信エラー";
  }
}

// ==== 確認 ====
app.get("/", (req, res) => {
  res.send("OK");
});

// ==== Webhook ====
app.post("/webhook", async (req, res) => {
  try {
    const events = req.body?.events || [];
    if (events.length === 0) return res.sendStatus(200);

    const event = events[0];
    const replyToken = event.replyToken;
    const userText = event.message?.text || "";

    console.log("受信:", userText);

    // 例：89ヤギ
    const num = userText.slice(0, 2);
    const seiza = userText.slice(2);

    const result = await generateUranai(num, seiza);

    console.log("占い結果:", result);

    // 🔥 LINE返信
const lineRes = await fetch("https://api.line.me/v2/bot/message/reply", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
  },
  body: JSON.stringify({
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: result
      }
    ]
  })
});

// 🔥 これ追加（超重要）
const resText = await lineRes.text();
console.log("LINE返信結果:", lineRes.status, resText);
    res.sendStatus(200);

  } catch (e) {
    console.error("Webhook Error:", e);
    res.sendStatus(200);
  }
});

// ==== 起動 ====
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
