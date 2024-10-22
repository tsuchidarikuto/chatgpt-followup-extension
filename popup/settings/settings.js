document.addEventListener('DOMContentLoaded', () => {
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const googleApiKeyInput = document.getElementById('google-api-key');
    const googleCseIdInput = document.getElementById('google-cse-id');
    const saveButton = document.getElementById('save-api-key');
    const statusMessage = document.getElementById('status-message');

    const geminiApiKeyError = document.getElementById('gemini-api-key-error');
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

    chrome.storage.sync.get(['geminiApiKey', 'googleApiKey', 'googleCseId'], (result) => {
        if (result.geminiApiKey) {
            geminiApiKeyInput.value = result.geminiApiKey;
        }
        if (result.googleApiKey) {
            googleApiKeyInput.value = result.googleApiKey;
        }
        if (result.googleCseId) {
            googleCseIdInput.value = result.googleCseId;
        }
        updateStatus(result.geminiApiKey && result.googleApiKey && result.googleCseId);
    });

    saveButton.addEventListener('click', () => {
        const geminiApiKey = geminiApiKeyInput.value.trim();
        const googleApiKey = googleApiKeyInput.value.trim();
        const googleCseId = googleCseIdInput.value.trim();


        let isValid = true;
        if (!geminiApiKey) {
            geminiApiKeyError.textContent = 'Gemini API Keyを入力してください';
            isValid = false;
        }


        if (!isValid) {
            return;
        }


        chrome.storage.sync.set({
            geminiApiKey: geminiApiKey,
            googleApiKey: googleApiKey,
            googleCseId: googleCseId
        }, () => {
            updateStatus(true);
        });
    });
});