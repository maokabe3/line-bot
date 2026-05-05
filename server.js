async function generateUranai(num2, seiza) {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  // 現在の最新指定「gemini-2.5-flash」を試行
  // もしこれで「Not Found」が出る場合は「gemini-2.0-flash」に書き換えてください
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  const prompt = `あなたは競馬×相性占いの専門家です。
【ユーザー情報】携帯末尾2桁: ${num2}, 星座: ${seiza}
【占い内容】今日の中央競馬のメインレースにおけるラッキーホースを1頭選んでください。
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

    // エラーが出た場合、詳細をRenderのログに出力
    if (data.error) {
      console.error("Gemini API Error Detail:", JSON.stringify(data.error));
      return `⚠️ APIエラー（${data.error.status}）: ${data.error.message}`;
    }

    if (data.candidates && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "⚠️ 占い結果の生成に失敗しました。";
    }
  } catch (e) {
    console.error("Fetch Error:", e.message);
    return "⚠️ サーバー通信エラーが発生しました。";
  }
}
