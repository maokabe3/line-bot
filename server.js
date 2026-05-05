async function generateUranai(num2, seiza) {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  // 1.5がNotFoundなので、最新の2.0-flashを指定します
  // ※もしこれでもダメなら gemini-2.5-flash に書き換えてみてください
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error Detail:", JSON.stringify(data.error));
      // エラーの詳細をLINEにも出すようにして原因を特定しやすくします
      return `⚠️ APIエラー(${data.error.code}): ${data.error.message}`;
    }

    if (data.candidates && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "⚠️ 占い結果を生成できませんでした。";
    }
  } catch (e) {
    console.error("Fetch Error:", e.message);
    return "⚠️ サーバー通信エラーが発生しました。";
  }
}
