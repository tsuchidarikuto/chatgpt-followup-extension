document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const googleApiKeyInput = document.getElementById('google-api-key');
    const googleCseIdInput = document.getElementById('google-cse-id');
    const saveButton = document.getElementById('save-api-key');
    const statusMessage = document.getElementById('status-message');

    const apiKeyError = document.getElementById('api-key-error');
    const googleApiKeyError = document.getElementById('google-api-key-error');
    const googleCseIdError = document.getElementById('google-cse-id-error');

    function updateStatus(saved) {
        if (saved) {
            statusMessage.textContent = 'すべてのAPIキーが保存されました';
            statusMessage.classList.remove("error");
            statusMessage.classList.add("success");
            saveButton.textContent = "更新";
        } else {
            statusMessage.textContent = ''; 
            saveButton.textContent = "保存";
        }
        apiKeyError.textContent = '';
        googleApiKeyError.textContent = '';
        googleCseIdError.textContent = '';
    }


    chrome.storage.sync.get(['openaiApiKey', 'googleApiKey', 'googleCseId'], (result) => {
        if (result.openaiApiKey) {
            apiKeyInput.value = result.openaiApiKey;
        }
        if (result.googleApiKey) {
            googleApiKeyInput.value = result.googleApiKey;
        }
        if (result.googleCseId) {
            googleCseIdInput.value = result.googleCseId;
        }

        // どれか一つでもキーが保存されていれば「更新」ボタンとメッセージを表示
        if (result.openaiApiKey && result.googleApiKey && result.googleCseId) {
            updateStatus(true);
        } else {
            updateStatus(false);
        }
    });

    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const googleApiKey = googleApiKeyInput.value.trim();
        const googleCseId = googleCseIdInput.value.trim();

        let isValid = true;
        let isAllFilled = true;

        if (!apiKey) {
            apiKeyError.textContent = 'OpenAI API Keyを入力してください';
            isValid = false;
            isAllFilled = false;
        }

        if (!googleApiKey) {
            googleApiKeyError.textContent = 'Google API Keyを入力してください';
            isValid = false;
            isAllFilled = false;
        }

        if (!googleCseId) {
            googleCseIdError.textContent = 'Google CSE IDを入力してください';
            isValid = false;
            isAllFilled = false;
        }

        if (!isValid) {
            return;
        }

        chrome.storage.sync.set({
            openaiApiKey: apiKey,
            googleApiKey: googleApiKey,
            googleCseId: googleCseId
        }, () => {
            updateStatus(isAllFilled);
        });
    });
});