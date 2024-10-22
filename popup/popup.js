document.addEventListener('DOMContentLoaded', () => {
  const latestRes = document.getElementById('latest-response-from-chatgpt');
  const followupInput = document.getElementById('followup-question');
  const charCount = document.getElementById('char-count');
  const sendButton = document.getElementById('submit-button');
  const updateButton=document.getElementById('update-button');
  
  setupMessageListener();
  setupInputListeners();
  setupUpdateButtonListener();

  function displayLatestResponse() {
    chrome.storage.local.get(['latestResponse'], (result) => {
      latestRes.textContent = result.latestResponse;
    });
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
  }

  function setupUpdateButtonListener() {
    updateButton.addEventListener('click',()=>{
      console.log('button推されてるよ')
      chrome.tabs.query({active:true,currentWindow:true},tabs=>
      {
        chrome.tabs.sendMessage(tabs[0].id,{action:'getLatestResponse'},()=>{
        });
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
    let safeQuestion="";
    const question = followupInput.value.trim();
    if (question.length === 0) {
      displayResponseFromAPI('質問を入力してください')
      return;
    }
    safeQuestion=escapeHtml(question);
    
    console.log('送信する質問:', safeQuestion);
    
    chrome.runtime.sendMessage({action:'sendToChatGPT',question:safeQuestion},(response)=>{ // sendToChatGPTアクションでbackgroundにメッセージを送信
      if(response.success){
          displayResponseFromAPI(response.response);
      }else{
          alert('エラーが発生しました:'+response.error);
          console.error('APIエラー',response.error);
      }
    });
    followupInput.value = '';
    updateCharCount();
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
function displayResponseFromAPI(response) {
  const responseElement = document.getElementById('response-from-api');
  responseElement.textContent = response;
}
