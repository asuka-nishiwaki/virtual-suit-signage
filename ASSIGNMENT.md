# 課題指示書 — デジタルフィッティング プロトタイプ

React + Vite で作成したアプリのひな形です。  
`main` ブランチに push すると、レビュー用環境（Azure Static Web Apps）へ自動デプロイされます。

**公開 URL:** https://orange-plant-0b4dcae00.7.azurestaticapps.net

**提出期限:** 2026/5/27 (Wed) 18:00

---

## 課題の概要

- 2026/5/13 の GD で決めたデジタルフィッティングアプリの体験の **コア / Do / Don't** を、実装者として改めて再定義し、プロトタイプとして実装する
- 完成度の高いアプリ自体が目的ではなく、**体験のコアが伝わるプロトタイプ**を目指す
- 実装は Web（React）固定
- AI の利用は自由

---

## 最初にやること

```bash
git clone https://github.com/moe-yamamoto/tdt_de-recruit_2026-B.git
cd tdt_de-recruit_2026-B
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く。最初は「Hello World (B)」と表示されれば OK。

---

## 提出物

1. **GitHub への最終版 push** — `main` に最新コード、デプロイ成功、体験が Web で確認できること
2. **README.md の更新** — 体験のコア / Do / Don't、機能説明、GD との乖離
3. **AI との対話ログ** — `_docs/ai_logs/` に共有リンクまたは Markdown / JSON を配置

---

## プロジェクト構成

```
.
├── .github/workflows/azure-static-web-apps.yml
├── _docs/ai_logs/
├── src/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
├── ASSIGNMENT.md
└── README.md
```

---

## 注意事項

- `.github/workflows/xxx.yml` は基本的に触らない
- 実在する個人名・社名・店舗名・商品名は入れない
- `npm run build` でエラーが出る場合は push 前に修正する

詳細な手順・TIPS は採用側から配布された原本を参照してください。
