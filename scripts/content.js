function getLatestChatGPTResponse() {
    console.log("getLatestChatGPTResponse 関数が呼び出されました。");
    const conversation = document.querySelector('main');

    if (conversation) {
        console.log("会話エリアが見つかりました。");
        const lastArticle = conversation.querySelector('article:last-of-type'); // 最後のarticle要素を取得

        if (lastArticle) {
            console.log("最後のarticle要素が見つかりました。");
            const messageDiv = lastArticle.querySelector('[data-message-author-role="assistant"]');

            if (messageDiv) {
                console.log("アシスタントのメッセージコンテナが見つかりました。");
                let responseText = "";
                messageDiv.querySelectorAll('.markdown.prose p, .markdown.prose code').forEach(para => {
                    responseText += para.textContent + "\n";
                });

                responseText = responseText.trim();

                if (responseText !== "") {
                    console.log("応答テキストを取得しました: ", responseText);
                    chrome.runtime.sendMessage({
                        action: 'newResponse',
                        response: responseText
                    });
                    console.log("メッセージを送信しました。");
                    return responseText; // 関数の呼び出し元に最新の応答テキストを返す
                } else {
                    console.log("応答テキストが空です。");
                    return ""; // 空の文字列を返す
                }
            } else {
                console.log("アシスタントのメッセージコンテナが見つかりません。");
                return "";
            }
        } else {
            console.log("最後のarticle要素が見つかりません。");
            return "";
        }

    } else {
        console.log('会話エリアが見つかりません。');
        return "";
    }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getLatestResponse') {
        getLatestChatGPTResponse();
        
    }
});