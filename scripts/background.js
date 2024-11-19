chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'newResponse') {
        chrome.storage.local.set({ latestResponse: message.response }, () => {
            console.log('最新の応答が保存されました');
            returnResponseTopic(message.response);            
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
    if(message.action==='resetChat'){
        resetChatLog()
            .then(response=>{
                sendResponse({success:true,response});
            })
            .catch(error=>{
                sendResponse({success:false,error:error.message});
            });
        return true;
    }
});

const CHATGPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
let conversationHistory = [];

async function returnResponseTopic(topic){
    const apiKey=await getApiKey();
    const prompt=`
    あなたはプロの要約家です。次の#文章から話題を考察し、10文字程度にまとめて出力して
    #文章
    ${topic}`
    const response=await fetch(CHATGPT_API_ENDPOINT,{
        method:'POST',
        headers:{
            'Content-Type':'application/json',
            'Authorization':`Bearer ${apiKey}`
        },
        body:JSON.stringify({
            model:'gpt-4o-mini-2024-07-18',
            messages:[{role:'user',content:prompt}],
            max_tokens:50
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`APIリクエストに失敗しました: ${errorData.error.message}`);
    }
  
    const data = await response.json();
    const generatedSummary = data.choices[0].message.content.trim();
    console.log("要約",generatedSummary)
    chrome.runtime.sendMessage({ action: 'displayResponse', response: generatedSummary });
    return ;
}
async function resetChatLog(){
    conversationHistory=[];
    chrome.storage.local.set({latestResponse:""});
    console.log("リセットしたよ")

}
// Google検索を実行する関数
async function searchGoogle(query) {
    const apiKey = await getGoogleApiKey();
    const cseId = await getCseId();

    // 改善後の技術系サイト、ニュースサイトの指定
    const techSites = 'site:stackoverflow.com OR site:github.com OR site:dev.to OR site:medium.com OR site:hashnode.com';
    const jpTechSites = 'OR site:qiita.com OR site:zenn.dev OR site:itmedia.co.jp OR site:codezine.jp';
    const techNewsSites = 'OR site:techcrunch.com OR site:publickey1.jp OR site:watch.impress.co.jp OR site:japan.cnet.com';
    const generalNewsSites = 'OR site:news.yahoo.co.jp OR site:nhk.or.jp OR site:mainichi.jp OR site:asahi.com OR site:yomiuri.co.jp';

    // 除外キーワード
    const excludeKeywords = '-レビュー -まとめ';

    // APIのURL
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`
        + `+(${techSites} ${jpTechSites} ${techNewsSites} ${generalNewsSites})`
        + ` ${excludeKeywords}`
        + '&num=10'
        + '&sort=date'
        + '&dateRestrict=m3'
        + '&fields=items(title,snippet)';

    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error('検索に失敗しました');
    }

    const data = await response.json();
    return data.items
        ? data.items.map(item => `${item.title}\n${item.snippet}`).join('\n\n')
        : "関連する最新の情報は見つかりませんでした。";
}

// OpenAI APIを使って検索クエリを生成する関数
async function generateSearchQuery(userMessage) {
    const apiKey = await getApiKey(); // OpenAIのAPIキーを取得
    const prompt = `
        You are a search query specialist. Please extract the most suitable search keywords from the #conversationHistory, referring to the examples below. No unnecessary explanations are needed.
        入力: "新宿でデートにおすすめのイタリアンを探しています"
        出力: 新宿 イタリアン デート おすすめ
        入力: "初心者向けのヨガ教室を探しています"
        出力: ヨガ 教室 初心者 入門
        入力: "#{conversationhistory${userMessage}*"
        出力:
        `; 

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
            let createdPrompt = "あなたはサポートアシスタントです。今、{#web版chatgptの出力}に対し、ユーザから発生した質問をあなたが答えています。{#会話履歴}と{#Web検索結果}を参考に、ユーザの疑問を解消してください。特に{#web検索結果}の取り扱いについては必ず、タイトルの後に添えられる時間に着目し、最新のものを最優先するようにしなさい。基本的に短文で要約して返すこと\n";
            createdPrompt += "\n#web版chatgptの出力\n" + responseFromChatgpt + "\n";
            createdPrompt += "\n#会話履歴\n" + conversation.map(item => `${item.role}: ${item.content}`).join("\n");
            createdPrompt += "\n#Web検索結果\n" + searchResults;

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
     
    }

    conversationHistory.push({ role: 'user', content: message });

    if (conversationHistory.length > 6) {
        conversationHistory = conversationHistory.slice(-6);
    }

    // 検索クエリを生成
    const searchQuery = await generateSearchQuery(conversationHistory.map(item => item.content).join(' '));
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
            const popupWidth = 370;
            const popupHeight = 550;
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