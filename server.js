// Gemini APIを呼び出す関数
async function generateUranai(num2, seiza) {
  // 環境変数から読み込み（Renderの設定画面で登録した名前と一致させてください）
  const API_KEY = process.env.GEMINI_API_KEY;
  
  // ★ ここで gemini-1.5-flash を明示的に指定しています
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
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

    // ログに詳細を出力（RenderのLogsで確認できるようになります）
    if (data.error) {
      console.error("Gemini APIからのエラー:", data.error.message);
      return `⚠️ 占い生成に失敗（${data.error.message}）`;
    }

    if (!data.candidates || !data.candidates[0].content) {
      console.error("Geminiからの応答が空です:", data);
      return "⚠️ 占い結果が空でした。";
    }

    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    console.error("通信エラー:", e.message);
    return "⚠️ サーバー通信エラーで占えませんでした。";
  }
}
