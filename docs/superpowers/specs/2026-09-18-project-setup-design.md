# Project setup design — Issue #2

## Goal

React Router Framework Mode（SPA）、NestJS、PostgreSQL、Dockerの開発土台を作る。画面からAPI、APIからDBへの接続を確認でき、両アプリのテストとCIを実行できることを完了条件とする。

## Scope and approach

採用案はnpm workspacesによる単一リポジトリ。`frontend/` と `backend/` を分け、ルートから起動・テスト・型チェック・ビルドを実行する。

別々のpackage管理は設定とコマンドの重複が増える。Nx/Turborepoの導入は現段階の2アプリには不要なので採用しない。

この設計はIssue #2のみを対象とする。資金繰り計算、口座・入出金モデル、認証、企業管理、招待、権限、CSV取り込み、課金、デプロイは対象外。SaaS化を見据えてDBアクセスと業務処理はAPI側に限定するが、ここでは未承認のデータモデルを作らない。

## Components and data flow

- `frontend/`: TypeScript、React Router Framework Mode、`ssr: false`。トップ画面にアプリ名とAPI・DB接続状態、再確認ボタンを表示する。
- `backend/`: TypeScript、NestJS。`GET /api/health` を提供し、PostgreSQLに `SELECT 1` を実行する。DB接続は専用のプロバイダーに分離し、終了時に接続プールを閉じる。ORMはデータモデルを扱うIssue #3で選定する。
- PostgreSQL: Dockerで起動し、開発データを名前付きvolumeに保存する。実在の個人・企業のデータや認証情報を登録しない。
- Frontendは相対URL `/api/health` を呼ぶ。開発サーバーのプロキシとDocker内のWebサーバーがAPIに転送する。ブラウザからDBへ直接接続しない。

DB接続成功時はHTTP 200と `{ "status": "ok", "database": "up" }`、失敗時はHTTP 503と `{ "status": "error", "database": "down" }` を返す。画面では確認中・接続済み・接続失敗を区別する。DB接続文字列や例外の詳細をHTTPレスポンスに含めない。

## Development and Docker

Docker Composeはfrontend、backend、dbの3サービスを起動する。DBにはhealthcheckを設定する。frontendはSPAのルートにフォールバックし、`/api` をbackendに転送する。

ネイティブの開発手順も用意する。DBだけComposeで起動して、frontendとbackendの開発サーバーを起動できる。環境変数の例は `.env.example` に置き、実際の `.env` はGit管理から除外する。依存関係はlockfileをコミットし、CIでは `npm ci` を使う。

## Tests and CI

- Frontend: VitestとTesting Libraryで接続成功・失敗表示、再確認をテストする。
- Backend: Jestでhealth処理をテストし、SupertestでHTTP 200/503の契約を確認する。HTTPテストはNestアプリのインスタンスを使用する。
- DB integration: 実際のPostgreSQLに接続してhealth endpointが成功することを確認する。接続できないDBに対して503となるケースも確認する。
- CI: PostgreSQLサービスを起動し、依存関係のインストール、型チェック、両アプリのテスト、DB統合テスト、両アプリのビルドを実行する。
- README: 前提条件、環境変数、Dockerでの起動、ネイティブ開発、テスト、型チェック、ビルド、停止方法を記載する。volumeを削除する操作はデータ消去として明記する。

## Acceptance criteria

1. frontendとAPIをローカルで起動できる。
2. 画面にAPI・DB接続成功が表示される。
3. DB接続失敗時にAPIは503を返し、画面に失敗が表示される。
4. frontend/backendのテスト、型チェック、ビルドが成功する。
5. 実DBを使う統合テストが成功する。
6. Docker Compose経由でも画面からAPI・DBへの接続を確認できる。
7. READMEに再現可能な主要コマンドがあり、CIのチェック項目が一致する。

利用できないローカルランタイムがある場合は未検証項目を明記し、検証済みと扱わない。IssueのcloseやGitHubへのpushは、実装検証後に別途扱う。
