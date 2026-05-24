# Souta Yamaguchi — Works Portal

山口さんが作ったサイト・作品のリンクをまとめたポータルサイト。

## 構成

- 純粋な静的サイト（HTML + CSS + Vanilla JS）
- `data/sites.json` が SSoT — サイトを追加・編集したらここを書き換えるだけ
- サムネイル画像は `static/img/` に配置（同名の PNG/JPG）
- サムネがなければ自動でグラデーション + 絵文字アイコンを表示

## ローカル動作確認

純静的なので、簡易サーバーを立てるだけで動きます。

```powershell
cd C:\Users\yamaguchi\portal
python -m http.server 8080
```

Chrome で `http://localhost:8080` を開く。

## サイトを追加する

`data/sites.json` の `sites` 配列に 1 件追加するだけ：

```json
{
  "id": "新しいID",
  "title": "サイトタイトル",
  "tagline": "短い一文",
  "description": "詳細説明",
  "url": "https://...",
  "thumbnail": "static/img/new-site.png",
  "tags": ["タグ1", "タグ2"],
  "stack": "技術スタック",
  "color": "#色コード"
}
```

サムネ画像を用意する場合は `static/img/` に置く。なければ自動でカラーグラデーション。

## Render デプロイ手順

1. GitHub に新規リポジトリ `portal` を作成し push
2. [Render](https://render.com) にログイン、New → **Static Site**
3. リポジトリ接続、`render.yaml` を自動検出（Build Command 空、Publish Directory `./`）
4. デプロイ完了で `https://souta-portal.onrender.com/` で公開

**Static Site プランは無料・スリープなし**（Web Service と違って常時稼働）。確信度 85%。

## ファイル構成

```
portal/
├── index.html          # 骨組み
├── data/
│   └── sites.json      # サイト一覧データ (SSoT)
├── static/
│   ├── style.css
│   ├── script.js
│   └── img/            # サムネ画像置き場
├── render.yaml         # Render Static Site 設定
└── README.md
```
