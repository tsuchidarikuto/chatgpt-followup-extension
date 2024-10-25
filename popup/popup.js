document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const latestRes = document.getElementById('latest-response-from-chatgpt');
  const followupInput = document.getElementById('followup-question');
  const charCount = document.getElementById('char-count');
  const sendButton = document.getElementById('submit-button');
  const updateButton = document.getElementById('update-button');
  const resetButton = document.getElementById('reset-button');

  // 送信中かどうかを管理するフラグ
  let isSending = false;

  setupMessageListener();
  setupInputListeners();
  setupUpdateButtonListener();

  // フォーカスを入力フィールドに設定
  followupInput.focus();

  function displayLatestResponse(response) {
    const latestResWrapper = document.getElementById('latest-response-wrapper');
    latestRes.textContent = response;
    
  }

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'displayResponse') {
        displayLatestResponse(request.response);
      }
    });
  }

  function resetChatData() {
    chrome.runtime.sendMessage(
        {action:'resetChat'},
        (response)=>{
            if(!response.success){
                alert('エラーが発生しました'+response.error)
            }
    });
    displayLatestResponse("すべての要素をリセットしました。");
    chatMessages.textContent='';
  }

  function setupInputListeners() {
    followupInput.addEventListener('input', updateCharCount);
    sendButton.addEventListener('click', sendFollowupQuestion);
    resetButton.addEventListener('click', resetChatData);
    followupInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendFollowupQuestion();
      }
    });
  }

  function setupUpdateButtonListener() {
    updateButton.addEventListener('click', () => {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getLatestResponse'});
      });
    });
  }

  function updateCharCount() {
    const count = followupInput.value.length;
    charCount.textContent = `${count}/500`;
    if (count > 500) {
      followupInput.value = followupInput.value.slice(0, 500);
      charCount.textContent = '500/500';
    }
  }

  function setLoadingState(isLoading) {
    isSending = isLoading;
    followupInput.disabled = isLoading;
    sendButton.disabled = isLoading;
    
    // ビジュアル的なフィードバック
    if (isLoading) {
      sendButton.style.opacity = '0.5';
      followupInput.style.opacity = '0.7';
      followupInput.placeholder = '応答を待っています...';
    } else {
      sendButton.style.opacity = '1';
      followupInput.style.opacity = '1';
      followupInput.placeholder = 'メッセージを入力';
    }
  }

  function sendFollowupQuestion() {
    // 送信中は新しいメッセージを送信できないようにする
    if (isSending) return;

    const question = followupInput.value.trim();
    if (question.length === 0) {
      displayResponseFromAPI('質問を入力してください');
      return;
    }

    const safeQuestion = escapeHtml(question);
    
    // 送信中の状態を設定
    setLoadingState(true);
    
    // ユーザーのメッセージを表示
    displayUserMessage(safeQuestion);

    chrome.runtime.sendMessage(
        {action: 'sendToChatGPT', question: safeQuestion},
        (response) => {
          if (response.success) {
            displayResponseFromAPI(response.response);
          } else {
            alert('エラーが発生しました: ' + response.error);
            console.error('APIエラー', response.error);
          }
          // 送信完了後、入力を再び有効化
          setLoadingState(false);
        }
    );

    followupInput.value = '';
    updateCharCount();
  }

  function displayResponseFromAPI(response) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.textContent = response;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function displayUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

function escapeHtml(unsafe) {
  return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}