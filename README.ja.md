<p align="center">
  <img src="assets/branding/dsh-banner-en.webp" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **DeepSeek Harness でアーカイブされたセッションを安全に管理**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [更新履歴](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![ライセンス: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![npm ダウンロード数](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![DSH 対応バージョン 0.2.2-rc.2](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.2-2563eb.svg)](#インストール)
</div>

> DSH Archive Manager はコミュニティによって保守されている DeepSeek Harness（DSH）向けプラグインであり、DeepSeek AI 公式の製品ではありません。

本文書は **1.3.2** を対象としています。過去の変更履歴は [CHANGELOG.md](CHANGELOG.md) をご覧ください。

## 機能概要

一時的に使わない会話を整理して保管し、必要な時にいつでも復元して、日常のタスクリストをすっきり保ちます。

- **2つの入り口と広い管理画面**：「設定 → アーカイブされたセッション」から操作できるほか、左のメインサイドバーにアイコンを表示してワークスペース中央に管理パネルを展開できます。
- **アーカイブと復元**：個別セッション、ワークスペース全体、プロジェクト横断の一括アーカイブ、および復元・復元して開く操作に対応。
- **全文検索とクイックプレビュー**：タイトルと会話本文をまとめて検索でき、プロジェクト・お気に入り・日付範囲で絞り込みや並び替えが可能。復元せずに Markdown 表示やハイライト付き原文で文脈を確認できます。
- **お気に入りとアイドル整理**：スターでお気に入り登録し「お気に入りのみ」で絞り込み可能。未操作日数を指定して非アクティブな会話をプレビュー＆一括アーカイブでき、実行中・承認待ち・お気に入りは自動保護され、一括アーカイブの取り消しも可能です。
- **サイドバー右クリックとワークスペース間移動**：サイドバーのワークスペース行やセッション行を右クリックして、お気に入り、アーカイブ、通常セッションの別ワークスペースへの移動、フォルダパスのコピーやフォルダを開く操作を実行できます。
- **孤立サブエージェント整理と完全削除**：親セッションが外部で削除されて残ったサブエージェントを検出してワンクリック削除。不要なセッションは確認後に物理削除できます。
- **多言語とリバースプロキシ対応**：DeepSeek Harness 公式 8 言語に対応し、ライト／ダークテーマに追従。パスプレフィックス付きのリバースプロキシ環境でも動作します。

## スクリーンショット

### 1. アーカイブ管理パネル

**設定 → アーカイブされたセッション → アーカイブ済み** で検索、お気に入り、プレビュー、復元、削除を実行できます：

![アーカイブ済み：検索フィルター、お気に入り、コンパクトリスト](assets/screenshots/archived-sessions.webp)

**未アーカイブ** に切り替えると、アイドル整理の候補確認やプロジェクト単位の一括アーカイブを行えます：

![未アーカイブ：スマートアイドル整理とプロジェクト一括アーカイブ](assets/screenshots/unarchived-sessions.webp)

### 2. メインワークスペースパネル（サイドバー直通）

サイドバー入口を有効にすると、左ナビゲーションからメインワークスペースに管理パネルを直接展開できます：

![メインワークスペースパネル：サイドバーからの直接表示](assets/screenshots/main-view-panel.webp)

### 3. サイドバー右クリック＆移動メニュー

サイドバーのワークスペース行またはセッション行を右クリックして、クイック操作やワークスペース間移動を実行できます：

| ワークスペース操作（コピー / フォルダを開く） | ワークスペース間のセッション移動 |
| :---: | :---: |
| <img src="assets/screenshots/workspace-context-menu.webp" alt="Workspace Actions Menu" width="100%"> | <img src="assets/screenshots/session-move-menu.webp" alt="Move Session Menu" width="100%"> |

## インストール

動作する DeepSeek Harness 環境が必要です。以下の例では `web` プロファイルを使用していますので、環境に合わせて読み替えてください。

- **ホスト対応範囲**：DeepSeek Harness `0.2.x` 全シリーズ（`>=0.2.0-rc.1 <0.3.0-0`）。`0.2.0-rc.1`〜`0.2.2-rc.2` の全 RC で検証済みです（中間の alpha 版は対象外）。
- `0.2.0-rc.1` 未満の旧ホストはサポート対象外となり、`0.3.0` の破壊的変更はバージョンゲートで遮断されます。`0.1.x` をご利用の場合はプラグイン `1.0.20` をインストールしてください。
- **リバースプロキシ対応**：パスプレフィックス付きリバースプロキシ（例：`/app/dsh/`）配下での運用に対応しています。

### エージェントに依頼してインストール（推奨）

ターミナル操作が可能なエージェントに以下を送信してください：

```text
公式 npm レジストリから最新の @michengai/dsh-archive-manager を DSH の web プロファイルにインストールし、有効化を確認してリロード手順を説明してください。
```

### 手動インストールと更新

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

インストール後に DSH Web を再起動し、ブラウザをハードリロード（`Ctrl+Shift+R`）して「設定 → アーカイブされたセッション」を開いてください。更新時は同じコマンドを再実行します。

## プラグイン設定

**サイドバー → プラグイン → `Archive Manager`** を開くと、以下の設定を変更できます：

- **入口の表示位置 (`entryLocation`)**
  - **両方表示 (`both`)**：左サイドバーと「設定 → アーカイブされたセッション」の両方に表示します。
  - **サイドバーのみ (`sidebar`)**：左サイドバーのみに表示し、設定内の項目を非表示にします。
  - **設定のみ (`settings`)**（デフォルト）：「設定 → アーカイブされたセッション」のみに表示します。
- **サイドバーのお気に入り星標 (`sidebarFavoriteStar`)**
  - **すべて表示 (`all`)**（デフォルト）：ホバー時およびお気に入り登録済みの行に星標を表示します。
  - **お気に入りのみ (`favorites`)**：お気に入り登録済みのセッションにのみ常時表示し、未登録行のホバー星標を隠します。
  - **完全に非表示 (`none`)**：サイドバー行の星標を隠します（右クリックメニューからのお気に入り登録や「お気に入りのみ」絞り込みは引き続き利用可能）。

## 使用ガイド

| 操作 | 手順 |
| --- | --- |
| **セッションをアーカイブ** | サイドバーのセッションメニューから「アーカイブ」を選ぶか、**未アーカイブ** タブで選択して一括アーカイブ |
| **ワークスペース / グループ一括アーカイブ** | サイドバーのワークスペースメニューから「ワークスペースをアーカイブ」を選ぶか、**未アーカイブ** のグループ横 **…** メニューから実行（検索条件を無視） |
| **検索と絞り込み** | 検索欄でタイトルと本文を一括検索。「お気に入りのみ」、並び替え、プロジェクト、日付範囲（プリセットとキーボード操作対応）を組み合わせて絞り込み可能 |
| **クイックプレビュー** | 一致スニペットまたは **その他 → クイックプレビュー** をクリックし、復元せずにハイライト付きで内容を確認 |
| **会話の閲覧と復元** | タイトルをクリックするとアーカイブ状態のまま閲覧・継続可能。復元アイコンまたは **その他 → 復元して開く** でワークスペースへ戻せます |
| **お気に入り登録** | 各行の星標またはサイドバー右クリックメニューで登録し、表示メニューの「お気に入りのみ」で抽出 |
| **アイドルセッション整理** | **未アーカイブ** で未操作日数（1〜36,500）を指定して候補を確認・アーカイブ。ページを閉じる／更新する前なら「このアーカイブを取り消す」で戻せます |
| **ワークスペース間移動** | サイドバーの通常セッションを右クリックし、**ワークスペースへ移動** から移動先を選択 |
| **孤立サブエージェント整理** | 親セッションが外部削除されて残ったサブエージェントを検出すると、整理エリアに容量が表示されワンクリックで削除可能 |
| **リストキャッシュ再構築** | 公式キャッシュが欠落しているセッションが検出された場合、整理エリアに「リストキャッシュを再構築」カードが表示され、ログを読み取り専用で確認してタイトル等を修復できます |
| **完全削除** | セッションを選択して **削除**（またはサイドバー右クリックメニュー）を選び、確認後にログとキャッシュを完全消去 |
| **セッション ID をコピー** | **その他** メニューから **セッション ID をコピー** を選択 |

### 注意事項

- **お気に入りとアイドル保護**：お気に入りはホスト側に保存され、アーカイブや復元でも失われません。アイドル整理ではお気に入り・現在開いている会話・実行中セッション・応答待ちタスクを自動除外します（お気に入りでも手動アーカイブは可能です）。バックグラウンドでの自動定期アーカイブはありません。
- **検索対象**：本文検索はユーザーとアシスタントのメッセージのみを対象とし、ツール出力・添付・推論・システムメッセージは含みません。永続的な全文インデックスは持たないため、件数が多い場合はプロジェクトや日付・お気に入りで先に絞り込むのがおすすめです。
- **一括操作と取り消し**：一括処理中に一部が失敗しても残りを続行し、失敗項目のみ再試行できます。「このアーカイブを取り消す」は現在の管理画面を開いている間のみ有効です。完全削除は取り消せません。

## よくある質問

### インストール後にメニューが見つかりません

DSH Web を再起動し、ブラウザをハードリロード（`Ctrl+Shift+R`）して、使用中のプロファイルにインストールされたか確認してください。それでも表示されない場合は以下のコマンドで `ui-workspace-archive-manager` が有効になっているか、プロファイルの `cordis.patch.yml` で `workspace`・`session-projection-cache`・`ui-workspace` が無効化されていないか確認してください：

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh --profile web --dump-config
```

### アーカイブと完全削除の違いは何ですか？

アーカイブは会話を一時的に片付けるだけで、いつでも復元できます。**完全削除は元に戻せず**、ログ・キャッシュ・添付ファイルが完全に消去されます（プロジェクトの作業ディレクトリは削除されません）。削除前には必ず確認が入ります。

### Codex UI や他のアーカイブプラグインと併用できますか？

はい。[Codex UI](https://github.com/MichengAI/dsh-codex-ui) と問題なく併用できます。他のアーカイブプラグインを同時に入れても、設定画面にはそれぞれ独立した項目として表示されます。

その他の問題は、DSH とプラグインのバージョン・再現手順・エラー内容を添えて [Issue](https://github.com/MichengAI/dsh-archive-manager/issues) へご報告ください。

## ソースコードからのインストール

<details>
<summary>未公開の変更をテスト・開発する場合に展開</summary>

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

インストール後は DSH Web を再起動し、ブラウザをハードリロードしてください。[src](src) 配下を変更した場合はコミット前に `pnpm build` を実行してください（検証コマンド：`pnpm typecheck`、`pnpm test`、`pnpm verify`）。

</details>

## DSH 製品エコシステム

デスクトップ作業環境には [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) をご利用ください。既存の [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 環境には、各プラグインの README に従って個別に追加できます：

| プラグイン | 主な機能 |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | プロジェクトと会話の整理、タスク検索、メッセージナビゲーション |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | 各種専門家エージェントの選択と召喚 |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | ローカルスキルの検索、有効化、作成、インポート |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | アーカイブされた会話の検索、復元、物理クリーンアップ |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | 各種メッセージングアプリを介したタスクの送信と受信 |
| [Automation](https://github.com/MichengAI/dsh-automation) | 定期タスクのスケジュール管理と実行結果の確認 |
| [BTW](https://github.com/MichengAI/dsh-btw) | メインタスクを中断せずに横から質問できるサイドチャット |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | `/simplify` で Git の変更内容に基づきコードをリファクタリング |
| [PUA](https://github.com/MichengAI/dsh-pua) | エージェントに失敗原因の調査と完了前検証を促す |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | `/review` で独立したコードレビューを依頼し、現在のチャットでレポートを受信 |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | デスクトップペットを通じて会話通知を確認し、ツールの承認や質問に応答 |

## ライセンス

[Apache License 2.0](LICENSE) の下で提供されています。
