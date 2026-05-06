import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// ==== 占い ====
async function generateUranai(num2, seiza) {
  const API_KEY = process.env.GEMINI_API_KEY;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `あなたは競馬×相性占いの専門家です。
携帯末尾: ${num2}, 星座: ${seiza}
以下の形式で出力してください：

⭐[馬名] 🐎
🍀 ラッキーアイテム：[アイテム]
「[四字熟語]」
[コメント]
🔮 相性スコア [0-100]点`;

  try {
    console.log("Gemini開始");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    console.log("Gemini raw:", JSON.stringify(data, null, 2));

    // ❌ エラー返ってきた場合
    if (data.error) {
      console.error("Gemini APIエラー:", data.error);
      return `⚠️APIエラー: ${data.error.message}`;
    }

    // ✅ 安定取得
    const text = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join("");

    if (!text) {
      return "⚠️ 占い生成失敗（空レス）";
    }

    console.log("Gemini結果取得");

    return text;

  } catch (e) {
    console.error("Geminiエラー:", e);
    return "⚠️ 通信エラー";
  }
}

// ==== Webhook ====
app.post("/webhook", async (req, res) => {
  try {
    const events = req.body?.events || [];
    if (events.length === 0) return res.sendStatus(200);

    const event = events[0];
    const replyToken = event.replyToken;
    const userText = event.message?.text || "";

    console.log("受信:", userText);

    // ① 即返信
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: "text", text: "占い中...🔮" }]
      })
    });

    // ② 非同期処理
    (async () => {
      const num = userText.slice(0, 2);
      const seiza = userText.slice(2);

      const result = await generateUranai(num, seiza);

      console.log("占い結果:", result);

      // ③ push送信
      const pushRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: event.source.userId,
          messages: [{ type: "text", text: result }]
        })
      });

      const pushText = await pushRes.text();
      console.log("Push結果:", pushRes.status, pushText);

    })();

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
