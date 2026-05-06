import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ==== エラーを絶対に落とさない ====
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

// ==== 占い関数 ====
async function generateUranai(num2, seiza) {
  const API_KEY = process.env.GEMINI_API_KEY;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `あなたは競馬×相性占いの専門家です。今日の中央競馬のメインレースを想定して占い結果を作成してください。
【ユーザー情報】携帯末尾2桁: ${num2}, 星座: ${seiza}
【出力フォーマット】
⭐[馬名] 🐎
🍀 ラッキーアイテム：[アイテム]
「[四字熟語]」
[ドラマチックなコメント]
🔮 相性スコア [0-100]点`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return `⚠️ APIエラー: ${data.error.message}`;
    }

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ 占い結果を生成できませんでした"
    );
  } catch (e) {
    console.error("Fetch Error:", e);
    return "⚠️ 通信エラー";
  }
}

// ==== 動作確認用 ====
app.get("/", (req, res) => {
  res.send("LINE BOT OK");
});

// ==== Webhook ====
app.post("/webhook", async (req, res) => {
  try {
    const events = req.body?.events || [];
    if (events.length === 0) return res.sendStatus(200);

    const event = events[0];
    const text = event?.message?.text || "";

    // 適当にテスト用
    const result = await generateUranai("23", "牡羊座");

    console.log("占い結果:", result);

    // ※今はLINE返信なしでもOK（落ちないことが最優先）
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook Error:", e);
    res.sendStatus(200);
  }
});

// ==== ★最重要（これが今回の本丸）====
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
