document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const latestRes = document.getElementById('latest-response-from-chatgpt');
  const followupInput = document.getElementById('followup-question');
  const charCount = document.getElementById('char-count');
  const sendButton = document.getElementById('submit-button');
  const updateButton = document.getElementById('update-button');

  setupMessageListener();
  setupInputListeners();
  setupUpdateButtonListener();

  // フォーカスを入力フィールドに設定
  followupInput.focus();

  function displayLatestResponse(response) {
      const latestResWrapper = document.getElementById('latest-response-wrapper');
      latestRes.textContent = response;
      latestResWrapper.style.display = response ? 'block' : 'none';
  }

  function setupMessageListener() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.action === 'displayResponse') {
              displayLatestResponse(request.response);
          }
      });
  }

  function setupInputListeners() {
      followupInput.addEventListener('input', updateCharCount);
      sendButton.addEventListener('click', sendFollowupQuestion);
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

  function sendFollowupQuestion() {
      const question = followupInput.value.trim();
      if (question.length === 0) {
          displayResponseFromAPI('質問を入力してください');
          return;
      }

      const safeQuestion = escapeHtml(question);
      
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