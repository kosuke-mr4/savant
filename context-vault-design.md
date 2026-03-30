# ContextVault — 設計ドキュメント v0.1

> LLM との協業で生じるコンテキスト断片化を解消する個人用ツール

## 1. 背景と課題

### 解決したい問題

LLM（Claude, Gemini 等）と複数のプロジェクトを並行して進める際に、以下の問題が発生する:

- **「この課題、どのファイルを使うんだっけ？」** — 課題に紐づくリソース（ソースコード、設計メモ、チャット履歴 URL 等）が散在し、再開時に探す手間が生じる
- **「どこまで進めたんだっけ？」** — 進捗が記憶頼みで、LLM に文脈を共有し直すコストが高い

### 既存ツールとのギャップ

| カテゴリ | 代表例 | 強み | 弱み（本課題において） |
|---|---|---|---|
| タスク管理 | Todoist, Things, Linear | タスクの管理・ステータス追跡 | 「この課題にはこのファイルパス群を渡す」という文脈紐付けが不可 |
| LLM コンテキスト管理 | context-llemur, CTX, llm-context | コードベースの LLM 向け整形・収集 | プロジェクト進捗のトラッキングが守備範囲外 |
| ノート / PKM | Obsidian, Notion | 自由度の高いメモ・リンク管理 | 「ステータス × リソース一覧」の専用 UI がない |

**ContextVault は「タスク管理」と「LLM コンテキスト管理」の交差点を狙う。**

---

## 2. コンセプト

### ワンライナー

> プロジェクトごとの「コンテキストカード」を管理し、**何がどこまで進んでいて、何を使うか** を一箇所で把握できるツール。

### スコープの定義（やること / やらないこと）

**やること:**

- プロジェクト → タスクの階層管理
- タスクごとのリソース（ファイルパス、URL、チャットリンク、メモ）紐付け
- ステータス管理（todo / in progress / done）
- リソースの Quick Add（最小摩擦で追加）
- 進捗ログの時系列記録
- コンテキストバンドルのクリップボードコピー（Markdown / XML 形式）

**やらないこと:**

- ガントチャート / 期限管理 / カレンダー連携
- チーム共有 / コラボレーション（v1 は個人用）
- ファイルの中身のプレビューや編集
- LLM API との直接連携

---

## 3. データモデル

```
Project (1) ─── (N) Task (1) ─── (N) Resource
                       │
                       └── (N) ProgressLog
```

### Project

| フィールド | 型 | 説明 |
|---|---|---|
| id | string (UUID) | 一意識別子 |
| name | string | プロジェクト名 |
| description | string | 概要（任意） |
| status | enum | `active` / `archived` |
| order | number | 表示順 |
| createdAt | ISO 8601 | 作成日時 |
| updatedAt | ISO 8601 | 更新日時 |

### Task

| フィールド | 型 | 説明 |
|---|---|---|
| id | string (UUID) | 一意識別子 |
| projectId | string | 親 Project の ID |
| name | string | タスク名 |
| description | string | 概要（任意） |
| status | enum | `todo` / `in_progress` / `done` |
| order | number | 表示順 |
| createdAt | ISO 8601 | 作成日時 |
| updatedAt | ISO 8601 | 更新日時 |

### Resource

| フィールド | 型 | 説明 |
|---|---|---|
| id | string (UUID) | 一意識別子 |
| taskId | string | 親 Task の ID |
| type | enum | `file` / `url` / `chat` / `memo` |
| value | string | パス、URL、またはメモ本文 |
| label | string | 表示ラベル（任意。未設定時は value から自動生成） |
| order | number | 表示順 |
| createdAt | ISO 8601 | 作成日時 |

### ProgressLog

| フィールド | 型 | 説明 |
|---|---|---|
| id | string (UUID) | 一意識別子 |
| taskId | string | 親 Task の ID |
| content | string | ワンラインの進捗メモ |
| createdAt | ISO 8601 | 記録日時 |

### Resource Type ごとのアクション

| type | 主アクション | 副アクション |
|---|---|---|
| `file` | パスをコピー（※1） | — |
| `url` | 新タブで開く | URL をコピー |
| `chat` | 新タブで開く | URL をコピー |
| `memo` | クリップボードにコピー | インライン編集 |

※1: Web UI からローカル Finder を直接開くことはブラウザのセキュリティ制約上不可。v1 ではパスコピーとし、UI に「Finder で `Cmd+Shift+G` → 貼り付け」のヒントを表示。将来的には Tauri ネイティブラッパーまたは CLI コンパニオンでの `open` コマンド連携を検討。

---

## 4. アーキテクチャ

### レイヤー構成

```
┌─────────────────────────────────────┐
│         UI Layer (React SPA)        │
│   Vite + TypeScript + React         │
└────────────────┬────────────────────┘
                 │ import
┌────────────────┴────────────────────┐
│      Storage Interface (abstract)   │
│   getProjects(), saveTask(), ...    │
└──────┬─────────────────────┬────────┘
       │ v1                  │ future
┌──────┴──────┐    ┌─────────┴────────┐
│  IndexedDB  │    │   REST API       │
│  (local)    │    │   (server + DB)  │
└─────────────┘    └──────────────────┘
```

### Storage Interface

```typescript
interface StorageAdapter {
  // Project
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;

  // Task
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  saveTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;

  // Resource
  getResourcesByTask(taskId: string): Promise<Resource[]>;
  saveResource(resource: Resource): Promise<void>;
  deleteResource(id: string): Promise<void>;

  // ProgressLog
  getLogsByTask(taskId: string): Promise<ProgressLog[]>;
  addLog(log: ProgressLog): Promise<void>;

  // Bulk
  exportAll(): Promise<ExportData>;
  importAll(data: ExportData): Promise<void>;
}
```

v1 は `IndexedDBAdapter` を実装。将来 `RestAPIAdapter` に差し替え可能。
`exportAll()` / `importAll()` により JSON ファイルでのバックアップ・移行をサポート。

### なぜ IndexedDB か（localStorage ではなく）

- localStorage: 5MB 制限、同期 API、文字列のみ
- IndexedDB: 実質無制限、非同期 API、構造化データ対応
- インターフェースは同程度にシンプルに抽象化可能
- 将来の REST API 移行時も非同期パターンが一致

### 技術スタック

| レイヤー | 技術 | 理由 |
|---|---|---|
| ビルド | Vite | 高速、TypeScript ネイティブ |
| UI | React + TypeScript | エコシステムの広さ、型安全 |
| スタイリング | CSS Modules or vanilla CSS | 依存最小、エンジニアツール質感の制御 |
| DB | IndexedDB (via idb ライブラリ) | ローカルファースト、容量制約なし |
| ID 生成 | crypto.randomUUID() | ブラウザネイティブ、依存ゼロ |

---

## 5. UI 設計

### 全体レイアウト: Sidebar + Detail

```
┌──────────┬──────────────────────────────────┐
│ Sidebar  │         Detail Panel             │
│          │                                  │
│ Projects │  Task Title        [status pill] │
│  ├ Proj1 │  description...                  │
│  └ Proj2 │                                  │
│    ├ T1  │  ── Resources ──                 │
│    └ T2  │  📁 ~/proj/src/main.ts  [copy]  │
│          │  🔗 github.com/...      [open]  │
│          │  💬 Claude chat: ...    [open]  │
│          │  📝 設計メモ            [copy]  │
│          │                                  │
│          │  ── Progress Log ──              │
│          │  Mar 25  分析完了                 │
│          │  Mar 20  洗い出し開始             │
│          │                                  │
│ [+ Proj] │  [+ Resource]  [+ Log]           │
└──────────┴──────────────────────────────────┘
```

### デザイン方針

**全体のトーン:** GitHub / Obsidian 的なエンジニアツール質感

- **モノクロ基調**: メインカラーは白背景 + グレーテキスト + 細ボーダー。色はステータスピルとリソースタイプアイコンのみ
- **情報密度高め**: 余白は適度に取るが、1画面に多くの情報を表示する。ダッシュボード的な広い余白ではなく、エディタ的な密度
- **0.5px ボーダー**: 主要な区切りはすべて 0.5px の薄いボーダー
- **フォント**: システムフォント（-apple-system, system-ui）。モノスペースはファイルパスとコードにのみ使用
- **角丸**: 控えめ（4-8px）。過度な丸みは AI Slop 感が出るため回避
- **インタラクション**: hover で背景色が微妙に変わる程度。派手なアニメーションは不要
- **ダークモード**: 対応必須（CSS 変数で切り替え）

### Sidebar

- 上部: プロジェクト一覧（折りたたみ可能）
- プロジェクトを展開すると配下のタスクが表示される
- 選択中の項目はサブトルな背景色で示す
- 下部: 「+ New Project」ボタン
- 幅: 240px 固定（リサイズ不要）

### Detail Panel

選択したタスクの詳細を表示。3つのセクションで構成:

1. **Header**: タスク名、ステータスピル（クリックで変更）、説明文
2. **Resources**: タイプ別アイコン付きリスト。各行に主アクション・副アクション。ドラッグで並べ替え。「+ Add Resource」ボタン
3. **Progress Log**: 時系列の進捗メモ。最新が上。「+ Add Log」でワンライン入力

### Quick Add（リソース追加）

- 「+ Add Resource」クリックでインライン入力フォーム表示
- テキスト入力 + タイプ自動判定:
  - `http://` / `https://` で始まる → `url` type
  - `claude.ai/chat/` を含む → `chat` type
  - `/` や `~/` で始まる → `file` type
  - それ以外 → `memo` type
- ラベルは任意（空欄なら value から自動生成）
- `Enter` で追加、`Escape` でキャンセル

### ステータス遷移

```
todo ──→ in_progress ──→ done
  ↑          │              │
  └──────────┘              │
  ↑                         │
  └─────────────────────────┘
```

ステータスピルのクリックでサイクル: `todo → in_progress → done → todo`

### コンテキストバンドルコピー（v1+）

Detail Panel のヘッダーに「Copy context」ボタン。押下で以下をクリップボードにコピー:

```markdown
## [Task Name]

Status: in_progress
Project: [Project Name]

### Resources
- [file] ~/projects/triage/docs/compliance.md
- [url] https://github.com/team/triageAI/issues/42
- [chat] https://claude.ai/chat/abc123
- [memo] Ubie アーキテクチャ比較メモ: ...

### Progress
- 2026-03-25: Ubie BAA 構造の分析完了
- 2026-03-20: ガイドライン要件の洗い出し開始
```

将来的に XML タグ形式（`<context>...</context>`）も選択可能にする。

---

## 6. 機能優先順位

### Phase 1（MVP）

1. **ステータス管理** — Project / Task の CRUD + ステータス（todo / in_progress / done）
2. **リソース管理** — Resource の CRUD + タイプ別アクション（open / copy）
3. **Quick Add** — テキスト入力からのタイプ自動判定 + ワンアクション追加
4. **IndexedDB 永続化** — Storage Interface + IndexedDBAdapter

### Phase 2

5. **進捗ログ** — ProgressLog の追加・表示
6. **コンテキストバンドルコピー** — Markdown 形式でのワンクリックコピー
7. **JSON エクスポート / インポート** — バックアップ・移行用

### Phase 3（将来）

8. **ダークモード** — CSS 変数ベースの切り替え
9. **Tauri ネイティブラッパー** — ファイルの Finder 直接 Open
10. **REST API バックエンド** — サーバー版への移行
11. **認証 / マルチユーザー** — サービス化に向けた基盤

---

## 7. ファイル構成（想定）

```
context-vault/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── index.ts          # Project, Task, Resource, ProgressLog 型定義
│   ├── storage/
│   │   ├── interface.ts       # StorageAdapter インターフェース
│   │   └── indexeddb.ts       # IndexedDBAdapter 実装
│   ├── components/
│   │   ├── Sidebar.tsx        # プロジェクト・タスクツリー
│   │   ├── DetailPanel.tsx    # タスク詳細表示
│   │   ├── ResourceList.tsx   # リソース一覧 + アクション
│   │   ├── ResourceAddForm.tsx # Quick Add フォーム
│   │   ├── ProgressLog.tsx    # 進捗ログ表示・追加
│   │   └── StatusPill.tsx     # ステータスバッジ
│   ├── hooks/
│   │   └── useStorage.ts      # StorageAdapter の React hook ラッパー
│   └── styles/
│       ├── variables.css      # CSS 変数（色、フォント、角丸等）
│       └── global.css         # グローバルスタイル
└── public/
```

---

## 8. ローカルファイルアクセスのロードマップ

Web UI からローカルファイルを Finder で直接開くことはブラウザのセキュリティ制約上不可。段階的に対応する:

| 段階 | 方式 | UX |
|---|---|---|
| v1（Web） | パスコピー | ユーザーが Finder で `Cmd+Shift+G` に貼り付け |
| v2（CLI companion） | ローカル HTTP サーバー | Web UI → `localhost:PORT/open?path=...` → Finder が開く |
| v3（Tauri） | ネイティブアプリ | ボタンクリックで直接 Finder が開く |

v1 の UI では、file タイプのリソースに「パスをコピー」ボタン + ツールチップで「Finder → Cmd+Shift+G で移動」のヒントを表示する。

---

## 9. 設計上の判断記録

| 判断 | 選択 | 理由 |
|---|---|---|
| UI 構成 | Sidebar + Detail | 一覧性と詳細の両立。エンジニアにとって馴染みのあるパターン |
| デザイントーン | GitHub / Obsidian 的 | AI Slop 回避。情報密度重視のエンジニアツール質感 |
| ストレージ | IndexedDB | localStorage の 5MB 制限回避。非同期 API で将来の REST API 移行と整合 |
| ストレージ抽象化 | StorageAdapter interface | ローカル → サーバーへのスムーズな移行を担保 |
| フレームワーク | React + Vite + TypeScript | 型安全、エコシステム、ビルド速度のバランス |
| CSS | CSS Modules or vanilla CSS | UIライブラリ依存を排し、質感を完全にコントロール |
| file タイプの Open | v1 はパスコピー | Web セキュリティ制約。Tauri 化のロードマップで段階対応 |
| ガントチャート等 | 非実装 | タスク管理ツールとの競合回避。LLM コンテキスト復元に特化 |

---

## 付録: 用語

| 用語 | 定義 |
|---|---|
| コンテキストカード | 1 つのタスクに紐づくリソース群 + 進捗ログの総称 |
| コンテキストバンドル | タスクのリソースと進捗をまとめて LLM に渡せる形式に出力したもの |
| Quick Add | 最小ステップでリソースを追加する入力機構 |
