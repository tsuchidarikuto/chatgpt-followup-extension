# Support Chat Chrome拡張機能

## 概要
Support Chatは、ChatGPTの応答に対してフォローアップ質問を簡単に行えるChrome拡張機能です。ChatGPTの会話をより効率的に進めることができ、APIキーを使用して直接質問することも可能です。

## 主な機能
- ChatGPTの最新の応答の表示と更新
- フォローアップ質問の送信（最大500文字）
- OpenAI APIキーを使用した直接の質問機能
- Google検索機能の統合（APIキー設定が必要）
- キーボードショートカット（Ctrl+Shift+Y）でのポップアップ表示

## インストール方法
1. このリポジトリをクローンまたはダウンロードします
2. Chrome拡張機能の管理ページ（chrome://extensions/）を開きます
3. 「デベロッパーモード」を有効にします
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、ダウンロードしたフォルダを選択します

## 初期設定
1. 拡張機能のポップアップから「設定」をクリックします
2. 以下のAPIキーを設定します：
   - OpenAI APIキー
   - Google APIキー
   - Google CSE ID
3. 「保存」をクリックして設定を完了します

## 使用方法
1. ChatGPTのウェブページで拡張機能のアイコンをクリックしてポップアップを開きます
2. 最新の応答が自動的に表示されます
3. 更新ボタン（🔄）をクリックして最新の応答を手動で取得できます
4. テキストエリアにフォローアップ質問を入力します
5. 送信ボタン（➤）をクリックするか、Enterキーを押して質問を送信します

## ファイル構成
```
├── popup/
│   ├── popup.html      # メインのポップアップUI
│   ├── popup.css       # ポップアップのスタイル
│   └── popup.js        # ポップアップの機能実装
├── settings/
│   ├── settings.html   # 設定画面のUI
│   ├── settings.css    # 設定画面のスタイル
│   └── settings.js     # 設定機能の実装
├── scripts/
│   ├── background.js   # バックグラウンドスクリプト
│   └── content.js      # コンテンツスクリプト
├── images/
│   ├── icon-16.png     # 拡張機能アイコン（16px）
│   ├── icon-48.png     # 拡張機能アイコン（48px）
│   └── icon-128.png    # 拡張機能アイコン（128px）
└── manifest.json       # 拡張機能のマニフェストファイル
```


## トラブルシューティング
1. 応答が表示されない場合
   - ChatGPTのページが完全に読み込まれているか確認
   - 更新ボタンをクリックして手動更新を試行
   - 拡張機能を再読み込み

2. APIキーエラーが発生する場合
   - APIキーが正しく入力されているか確認
   - APIキーの有効期限が切れていないか確認
   - 設定ページで再度APIキーを入力

## 開発者向け情報
- コード変更後は必ず拡張機能を再読み込みしてください
- console.logを使用したデバッグ情報が実装されています
- content.jsではDOM操作に関する詳細なログが確認できます

## 制限事項
- チャット履歴は保存されません
- 一度に処理できるメッセージは最新の1件のみです
- チャットの同時進行は制限されています

## ライセンス
このプロジェクトはMITライセンスの下で公開されています。

## 貢献について
バグ報告や機能改善の提案は、Issuesを通じてお願いします。
プルリクエストも歓迎しています。