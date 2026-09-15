# Cash Flow Planner 設計書

## 目的

個人の家計・借金返済と、小規模事業・企業の資金繰りを、同じ「将来キャッシュフロー管理」の考え方で扱えるアプリを作る。

このアプリの中心価値は、会計処理そのものではなく、現在残高と将来の入出金予定から、今後の資金残高を予測し、意思決定に使える状態にすること。

主な問いに答えられることを目標とする。

- このまま返済すると、いつ借金を完済できるか
- 毎月追加返済したら、完済時期や総支払額はどう変わるか
- 数か月後の現金残高はいくらか
- どの時点で資金不足になるか
- 社員を増やしたら資金は持つか
- 設備投資や大きな支出をしても問題ないか

## 基本方針

個人用と事業用で別アプリを作らず、共通のドメインモデルを使う。

画面上では「個人」「事業」で入力項目やプリセットを変えてもよいが、内部では以下の共通概念で扱う。

- Account: お金が存在する口座・現金
- CashFlow: 入金・出金
- RecurringRule: 繰り返し入出金のルール
- Obligation: 将来の支払い義務
- Scenario: 仮定した意思決定
- Forecast: 将来残高予測

`Employee`、`BusinessLoan`、`PersonalLoan` などをシステムの根本概念にしない。必要に応じて上位の用途・表示名として扱う。

## MVP の範囲

### 1. 資金口座

利用者は現在保有している資金口座を登録できる。

例:

- 銀行口座
- 現金
- 事業用口座

保持する主な情報:

- 名称
- 種別
- 現在残高
- 通貨

MVP では複数口座を登録可能にするが、予測上は全口座合算残高も表示する。

### 2. 単発の入出金予定

将来発生する単発の入出金を登録できる。

例:

- 給与
- 売上入金
- 税金
- 引っ越し費用
- 設備投資
- 賞与

保持する主な情報:

- 日付
- 金額
- 入金 / 出金
- 名称
- 対象口座
- 状態

状態は MVP では以下を想定する。

- scheduled: 予定
- actual: 実績
- cancelled: 中止

予定を実績に変えるときに、同じ取引を再入力させない。

### 3. 繰り返し入出金

毎月・毎年など定期的に発生する入出金をルールとして登録し、予測期間内の CashFlow を自動生成する。

例:

- 給与
- 家賃
- 人件費
- サブスク
- 保険料
- 毎月の固定売上

MVP の繰り返し条件:

- 毎月
- 毎年
- 開始日
- 終了日（任意）

複雑な営業日調整や祝日補正は MVP では行わない。

### 4. 債務・返済予定

個人の借金と法人融資を同じ `Obligation` として扱う。

例:

- カードローン
- 銀行ローン
- 住宅ローン
- 事業融資
- 分割払い
- リース

MVP では LOAN タイプを実装する。

保持する主な情報:

- 名称
- 元本
- 年利
- 返済開始日
- 返済回数
- 返済頻度
- 返済方式
- 引落口座

初期対応する返済方式:

- 元金均等

登録された条件から以下を自動生成する。

- 各返済日の元金
- 各返済日の利息
- 総返済額
- 返済後残高
- 完済予定日
- 将来 CashFlow

将来は元利均等返済、繰上返済、変動金利などを追加可能にする。

### 5. 将来残高予測

現在残高と、将来発生するすべての CashFlow を日付順に集計し、予測残高を算出する。

基本式:

```text
予測残高 = 現在残高 + 累計入金 - 累計出金
```

出力する情報:

- 日別残高
- 月末残高
- 最低残高
- 最低残高の日付
- 資金ショート予定日
- 入金合計
- 出金合計

MVP では 12 か月先までを標準予測期間とする。

### 6. シナリオ比較

確定した予定データを変更せず、仮の入出金を追加して将来残高を比較できる。

例:

個人:

- 毎月 5 万円追加返済する
- 引っ越す
- 転職して収入が変わる

事業:

- 社員を 2 人採用する
- 設備投資をする
- 追加融資を受ける
- 売上が 10% 下がる

シナリオはベースデータとの差分のみ保持する。

MVP では以下を表示する。

- ベースケースの 12 か月後残高
- シナリオ適用後の 12 か月後残高
- 最低残高の差
- 資金ショート日の有無・差

## 画面構成

### ダッシュボード

最初に開く画面。

表示内容:

- 現在残高
- 1 か月後 / 3 か月後 / 6 か月後 / 12 か月後残高
- 最低残高
- 資金ショート警告
- 将来残高グラフ
- 直近の大きな入出金

### 入出金予定

- 単発予定の一覧
- 繰り返し予定の一覧
- 予定追加
- 予定を実績に変更

### 債務

- 債務一覧
- 残元本
- 月々の返済予定
- 完済予定日
- 返済スケジュール

### シナリオ

- シナリオ作成
- 仮の入出金追加
- ベースケースとの比較

### 設定

- 口座管理
- 予測期間

## データモデル案

### Account

```text
id
name
type
currentBalance
currency
createdAt
updatedAt
```

### CashFlow

```text
id
accountId
name
date
amount
direction: INFLOW | OUTFLOW
status: SCHEDULED | ACTUAL | CANCELLED
sourceType: MANUAL | RECURRING | OBLIGATION | SCENARIO
sourceId
createdAt
updatedAt
```

金額自体は正数で保持し、入出金方向は `direction` で表す。

### RecurringRule

```text
id
accountId
name
amount
direction
frequency: MONTHLY | YEARLY
startDate
endDate
createdAt
updatedAt
```

予測計算時に対象期間内の CashFlow を展開する。

### Obligation

```text
id
name
type: LOAN
principal
annualInterestRate
repaymentMethod: EQUAL_PRINCIPAL
repaymentCount
repaymentFrequency
startDate
accountId
createdAt
updatedAt
```

### RepaymentSchedule

```text
id
obligationId
dueDate
principalAmount
interestAmount
totalAmount
remainingPrincipal
status
```

返済予定は Obligation の条件から生成する。

### Scenario

```text
id
name
description
createdAt
updatedAt
```

### ScenarioCashFlow

```text
id
scenarioId
name
date
amount
direction
recurringRuleId (optional)
```

## アーキテクチャ

### フロントエンド

- React Router Framework Mode
- TypeScript
- SPA 構成

責務:

- ダッシュボード表示
- 入力フォーム
- 一覧・詳細表示
- シナリオ比較
- グラフ表示
- API 呼び出し

### バックエンド

- NestJS
- TypeScript
- REST API

想定モジュール:

```text
AccountsModule
CashFlowsModule
RecurringRulesModule
ObligationsModule
ForecastsModule
ScenariosModule
```

予測・返済計算などの業務ロジックはフロントエンドではなくバックエンドに置く。

### データベース

- PostgreSQL

### 開発環境

- Docker / Docker Compose

想定構成:

```text
cash-flow-planner/
├─ frontend/
├─ backend/
├─ docs/
└─ docker-compose.yml
```

## 主なデータフロー

### 借入登録

```text
利用者が借入条件を登録
        ↓
Obligation を保存
        ↓
返済スケジュールを生成
        ↓
返済予定 CashFlow を生成・取得可能にする
        ↓
Forecast に反映
        ↓
将来残高を再計算
```

### 将来予測

```text
現在の Account 残高
        +
単発 CashFlow
        +
RecurringRule から展開した CashFlow
        +
Obligation の返済予定
        +
任意の Scenario
        ↓
日付順に集計
        ↓
Forecast
```

## エラー・制約

MVP で最低限検証する内容:

- 金額は 0 より大きい
- 元本は 0 より大きい
- 金利は 0 以上
- 返済回数は 1 以上
- 終了日は開始日以降
- 存在しない口座への登録は禁止
- 実績済みデータを予測用に二重計上しない
- 同じ返済予定を二重生成しない

計算は浮動小数点誤差を避けるため、金額を JavaScript の通常の小数計算だけに依存しない。DB の `numeric` 型または整数の最小通貨単位を利用する。

## テスト方針

特に業務ロジックを重点的にテストする。

### 単体テスト

- 元金均等返済の返済スケジュール
- 利息計算
- 最終回の端数処理
- 繰り返し入出金の展開
- 将来残高計算
- 資金ショート日の判定
- シナリオ適用時の差分計算

### API テスト

- 口座登録
- 入出金登録
- 借入登録
- 予測取得
- シナリオ取得

### フロントエンドテスト

MVP では重要な入力・表示フローを中心にする。

## MVP ではやらないこと

初版では以下を実装しない。

- 複式簿記
- 決算書作成
- 税務計算
- 銀行 API 連携
- freee / 弥生など会計ソフトとの連携
- クレジットカード自動取得
- 認証・複数ユーザー
- 組織・権限管理
- 複数通貨換算
- AI による予測
- 高度な売上予測
- 元利均等・変動金利・複雑な繰上返済

これらはコア価値である「未来の現金が見える」が成立した後に追加する。

## 将来拡張

### 会計連携

会計ソフトから実績を取得し、手入力を減らす。

```text
会計ソフト → 実績
利用者     → 未来の前提
                ↓
          将来キャッシュフロー
```

### 複式簿記

必要になった場合は、CashFlow と会計仕訳を直接同一視せず、取引・契約を起点に別々の表現を生成する。

例: 融資実行時

```text
借入契約
  ├─ 会計: 普通預金 / 借入金
  └─ 資金予測: 将来の返済 CashFlow
```

利用者に同じ情報を二度入力させない設計を目指す。

### 人員計画

社員を独立したコアモデルにはせず、人員計画機能から給与・社会保険・採用費などの Scenario CashFlow を生成する。

### 意思決定支援

最終的には単なる資金繰り表ではなく、以下の問いに直接答える。

- あと何人雇えるか
- この投資をしても安全か
- 何月までに資金調達が必要か
- 毎月いくら追加返済できるか
- どの返済案が最も安全か

## 成功条件

MVP 完成時点で、架空データを使って以下ができれば成功とする。

1. 現在残高を登録する
2. 給与・売上・家賃などの予定を登録する
3. 借入条件から返済予定を自動生成する
4. 12 か月先までの残高推移を見る
5. 資金ショート日を確認する
6. 仮の支出・収入を追加してシナリオ比較する
7. 同じ仕組みを個人データと事業データの両方で使える
