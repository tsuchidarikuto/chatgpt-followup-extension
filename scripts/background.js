chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'newResponse') {
        chrome.storage.local.set({ latestResponse: message.response }, () => {
            console.log('最新の応答が保存されました');
            chrome.runtime.sendMessage({ action: 'displayResponse', response: message.response });
        });
    }
    if (message.action === 'sendToChatGPT') { // popup.jsから送られたメッセージを処理
        sendToChatGPT(message.question)
            .then(response => {
                sendResponse({ success: true, response });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;  // 非同期処理のためtrueを返す
    }
});

const CHATGPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
let conversationHistory = [];


// Google検索を実行する関数
async function searchGoogle(query) {
    const apiKey = await getGoogleApiKey(); // Google API Keyを取得
    const cseId = await getCseId(); // Google CSE IDを取得
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error('Google検索に失敗しました');
    }

    const data = await response.json();
    let searchResults = "";
    if (data.items && data.items.length > 0) {
        for (let i = 0; i < Math.min(3, data.items.length); i++) {
            searchResults += `${i + 1}. ${data.items[i].title}\n${data.items[i].snippet}\n${data.items[i].link}\n\n`;
        }
    } else {
        searchResults = "関連する検索結果が見つかりませんでした。";
    }
    console.log("検索結果:",searchResults);
    return searchResults;
}


// OpenAI APIを使って検索クエリを生成する関数
async function generateSearchQuery(userMessage) {
    const apiKey = await getApiKey(); // OpenAIのAPIキーを取得
    const prompt = `
  次のユーザーメッセージからGoogle検索に適したクエリを生成してください:

  ## 例:

  ユーザーメッセージ: "ChatGPTのプラグインの使い方について教えてください"
  検索クエリ: "ChatGPT プラグイン 使い方"

  ユーザーメッセージ: "最新のAI論文を調べたい"
  検索クエリ: "AI 論文 最新"

  ユーザーメッセージ: "美味しいパスタのレシピを知りたい"
  検索クエリ: "パスタ レシピ 人気"

  ## ユーザーメッセージ:

  ${userMessage}

  ## 検索クエリ:
  `; // ここにモデルが生成したクエリが入る

    const response = await fetch(CHATGPT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-2024-07-18',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`APIリクエストに失敗しました: ${errorData.error.message}`);
    }

    const data = await response.json();
    const generatedQuery = data.choices[0].message.content.trim();
    console.log("検索クエリ",generatedQuery)
    return generatedQuery;
}

async function createMessage(conversation, searchResults) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['latestResponse'], (result) => {
            console.log("storage result:", result);
            const responseFromChatgpt = result.latestResponse || ""; 

            // 検索結果をプロンプトに含める
            let createdPrompt = "あなたはサポートアシスタントです。今、{#web版chatgptの出力}に対し、ユーザから発生した質問をあなたが答えています。{#会話履歴}と{#Web検索結果}を参考に、ユーザの疑問を解消してください。\n";
            createdPrompt += "#web版chatgptの出力\n" + responseFromChatgpt + "\n";
            createdPrompt += "#会話履歴\n" + conversation.map(item => `${item.role}: ${item.content}`).join("\n");
            createdPrompt += "#Web検索結果\n" + searchResults;

            const messages = [
                { role: 'system', content: createdPrompt },
                ...conversation
            ];

            resolve(messages); 
        });
    });
}


async function sendToChatGPT(message) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error('APIキーが設定されていません');
        return 'APIキーを入力してください';
    }

    conversationHistory.push({ role: 'user', content: message });

    if (conversationHistory.length > 6) {
        conversationHistory = conversationHistory.slice(-6);
    }

    // 検索クエリを生成
    const searchQuery = await generateSearchQuery(message);
    // 生成されたクエリで検索を実行
    const searchResults = await searchGoogle(searchQuery);
    // 検索結果を含めたプロンプトを作成
    const prompts = await createMessage(conversationHistory, searchResults);
    console.log("プロンプト:",prompts);


    const response = await fetch(CHATGPT_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini-2024-07-18',
            messages: prompts,
            max_tokens: 500
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`APIリクエストに失敗しました: ${errorData.error.message}`);
    }
    const data = await response.json();
    const assistantResponse = data.choices[0].message.content.trim();
    conversationHistory.push({ role: 'assistant', content: assistantResponse });
    return assistantResponse;
}

// OpenAI API Keyを取得
async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['openaiApiKey'], (result) => {
            resolve(result.openaiApiKey);
        });
    });
}

// Google API Keyを取得
async function getGoogleApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['googleApiKey'], (result) => {
            resolve(result.googleApiKey);
        });
    });
}


// Google CSE IDを取得
async function getCseId() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['googleCseId'], (result) => {
            resolve(result.googleCseId);
        });
    });
}


chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-popup") {
        chrome.windows.getCurrent((currentWindow) => {
            const screenWidth = currentWindow.width;
            const screenHeight = currentWindow.height;
            const popupWidth = 400;
            const popupHeight = 400;
            const left = screenWidth - popupWidth;
            const top = 0;

            chrome.windows.create({
                url: "popup/popup.html",
                type: "popup",
                width: popupWidth,
                height: popupHeight,
                left: left,
                top: top - 100,
            });
        });
    }
});