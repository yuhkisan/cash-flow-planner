# Cash Flow Planner

個人・副業・個人事業主向けに、資産形成・借金返済・事業計画をまとめて将来シミュレーションするアプリ。

## 主な機能

- 現在残高と将来の入出金予定を管理
- 借入条件から返済予定を自動生成
- 積立投資などの資産形成を反映
- 個人事業の売上・経費予測を反映
- 将来の現金残高・純資産を予測
- 資金ショート予定日を表示
- 返済・投資・事業計画のシナリオ比較

## 技術構成

- React Router
- TypeScript
- NestJS
- PostgreSQL
- Docker

## 開発

現段階はAPIとDBまで。フロントエンドは後続のPRで追加する。

前提: Node.js 24.15+ / Docker

```bash
npm install
docker compose up -d postgres
```

APIを起動する。

```bash
npm run dev:backend
```

- API health check: http://localhost:3000/health

PostgreSQLに接続できない場合、APIは起動できない。DBへの `SELECT 1` は統合テストで確認する。

確認コマンド:

```bash
npm run typecheck
npm test
npm run test:integration --workspace=backend
npm run build
```

## 方針

個人のお金と個人事業のお金を分けて管理しつつ、全体では一つの将来財務として確認できるようにする。

実績・確定予定・予測・シナリオを分けて扱い、MVPでは個人と個人事業主までを対象にする。複式簿記、銀行連携、法人管理は後回しにする。
