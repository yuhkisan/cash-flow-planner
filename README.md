# Cash Flow Planner

個人の家計・借金返済と、小規模事業・企業の資金繰りを、同じ「将来キャッシュフロー管理」の仕組みで扱うアプリ。

会計処理そのものではなく、現在残高と将来の入出金予定から今後の資金残高を予測し、意思決定に使える状態にすることを目的とする。

## できるようにしたいこと

- このまま返済すると、いつ借金を完済できるか
- 毎月追加返済したら、完済時期や総支払額はどう変わるか
- 数か月後の現金残高はいくらか
- どの時点で資金不足になるか
- 社員を増やしたら資金は持つか
- 設備投資や大きな支出をしても問題ないか

## 技術構成

### フロントエンド

- React Router Framework Mode
- TypeScript
- SPA

### バックエンド

- NestJS
- TypeScript
- REST API

### データベース

- PostgreSQL

### 開発環境

- Docker / Docker Compose

## 基本方針

個人用と事業用で別アプリを作らず、共通のドメインモデルを使う。

画面上では「個人」「事業」で入力項目やプリセットを変えてもよいが、内部では以下の共通概念で扱う。

- `Account`: お金が存在する口座・現金
- `CashFlow`: 入金・出金
- `RecurringRule`: 繰り返し入出金のルール
- `Obligation`: 将来の支払い義務
- `Scenario`: 仮定した意思決定
- `Forecast`: 将来残高予測

`Employee`、`BusinessLoan`、`PersonalLoan` などをシステムの根本概念にしない。必要に応じて上位の用途・表示名として扱う。

## MVP

### 1. 資金口座

現在保有している資金口座を登録する。

例:

- 銀行口座
- 現金
- 事業用口座

主な情報:

- 名称
- 種別
- 現在残高
- 通貨

複数口座を登録可能にし、全口座の合算残高も表示する。

### 2. 単発の入出金予定

将来発生する単発の入出金を登録する。

例:

- 給与
- 売上入金
- 税金
- 引っ越し費用
- 設備投資
- 賞与

状態は以下を想定する。

- `SCHEDULED`: 予定
- `ACTUAL`: 実績
- `CANCELLED`: 中止

予定を実績に変えるときに、同じ取引を再入力させない。

### 3. 繰り返し入出金

毎月・毎年など定期的に発生する入出金をルールとして登録し、予測期間内のキャッシュフローを自動生成する。

例:

- 給与
- 家賃
- 人件費
- サブスク
- 保険料
- 毎月の固定売上

MVPでは以下に対応する。

- 毎月
- 毎年
- 開始日
- 終了日（任意）

営業日調整や祝日補正は初版では扱わない。

### 4. 債務・返済予定

個人の借金と法人融資を同じ `Obligation` として扱う。

例:

- カードローン
- 銀行ローン
- 住宅ローン
- 事業融資
- 分割払い
- リース

MVPでは `LOAN` タイプと元金均等返済を実装する。

保持する主な情報:

- 名称
- 元本
- 年利
- 返済開始日
- 返済回数
- 返済頻度
- 返済方式
- 引落口座

登録条件から以下を自動生成する。

- 各返済日の元金
- 各返済日の利息
- 総返済額
- 返済後残高
- 完済予定日
- 将来の出金予定

将来は元利均等返済、繰上返済、変動金利などを追加する。

### 5. 将来残高予測

現在残高と、将来発生するすべてのキャッシュフローを日付順に集計する。

```text
予測残高 = 現在残高 + 累計入金 - 累計出金
```

表示する情報:

- 日別残高
- 月末残高
- 最低残高
- 最低残高の日付
- 資金ショート予定日
- 入金合計
- 出金合計

標準予測期間は12か月とする。

### 6. シナリオ比較

確定した予定データを変更せず、仮の入出金を追加して将来残高を比較する。

個人の例:

- 毎月5万円追加返済する
- 引っ越す
- 転職して収入が変わる

事業の例:

- 社員を2人採用する
- 設備投資をする
- 追加融資を受ける
- 売上が10%下がる

MVPでは以下を比較する。

- ベースケースの12か月後残高
- シナリオ適用後の12か月後残高
- 最低残高の差
- 資金ショート日の有無・差

## 画面構成

### ダッシュボード

- 現在残高
- 1か月後 / 3か月後 / 6か月後 / 12か月後残高
- 最低残高
- 資金ショート警告
- 将来残高グラフ
- 直近の大きな入出金

### 入出金予定

- 単発予定の一覧
- 繰り返し予定の一覧
- 予定追加
- 予定から実績への変更

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

予測計算時に対象期間内のキャッシュフローを展開する。

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

## バックエンドのモジュール案

```text
AccountsModule
CashFlowsModule
RecurringRulesModule
ObligationsModule
ForecastsModule
ScenariosModule
```

予測・返済計算などの業務ロジックはフロントエンドではなくバックエンドに置く。

## 主なデータフロー

### 借入登録

```text
借入条件を登録
    ↓
Obligation を保存
    ↓
返済スケジュールを生成
    ↓
返済予定を将来 CashFlow として扱う
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

MVPで最低限検証する。

- 金額は0より大きい
- 元本は0より大きい
- 金利は0以上
- 返済回数は1以上
- 終了日は開始日以降
- 存在しない口座への登録は禁止
- 実績済みデータを予測用に二重計上しない
- 同じ返済予定を二重生成しない

金額計算は浮動小数点誤差を避けるため、DBの `numeric` 型または整数の最小通貨単位を利用する。

## テスト方針

業務ロジックを重点的にテストする。

### 単体テスト

- 元金均等返済の返済スケジュール
- 利息計算
- 最終回の端数処理
- 繰り返し入出金の展開
- 将来残高計算
- 資金ショート日の判定
- シナリオ適用時の差分計算

### APIテスト

- 口座登録
- 入出金登録
- 借入登録
- 予測取得
- シナリオ取得

## MVPではやらないこと

- 複式簿記
- 決算書作成
- 税務計算
- 銀行API連携
- freee / 弥生など会計ソフトとの連携
- クレジットカード自動取得
- 認証・複数ユーザー
- 組織・権限管理
- 複数通貨換算
- AIによる予測
- 高度な売上予測
- 元利均等・変動金利・複雑な繰上返済

まず「未来の現金が見える」ことを成立させる。

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

必要になった場合は、CashFlowと会計仕訳を直接同一視せず、取引・契約を起点に別々の表現を生成する。

例: 融資実行時

```text
借入契約
  ├─ 会計: 普通預金 / 借入金
  └─ 資金予測: 将来の返済 CashFlow
```

同じ情報を二度入力させない設計を目指す。

### 人員計画

社員を独立したコアモデルにはせず、人員計画機能から給与・社会保険・採用費などのシナリオ用キャッシュフローを生成する。

### 意思決定支援

最終的には単なる資金繰り表ではなく、以下の問いに直接答えられる状態を目指す。

- あと何人雇えるか
- この投資をしても安全か
- 何月までに資金調達が必要か
- 毎月いくら追加返済できるか
- どの返済案が最も安全か

## ディレクトリ構成（予定）

```text
cash-flow-planner/
├─ README.md
├─ frontend/
├─ backend/
└─ docker-compose.yml
```

## MVPの成功条件

架空データを使って以下ができれば初版完成とする。

1. 現在残高を登録する
2. 給与・売上・家賃などの予定を登録する
3. 借入条件から返済予定を自動生成する
4. 12か月先までの残高推移を見る
5. 資金ショート日を確認する
6. 仮の支出・収入を追加してシナリオ比較する
7. 同じ仕組みを個人データと事業データの両方で使える
