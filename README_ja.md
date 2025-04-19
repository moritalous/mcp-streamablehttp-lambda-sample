# Streamable MCP Lambda Function

このプロジェクトは、AWS Lambda上でModel Context Protocol (MCP)を使用したStreamable HTTP APIを実装したサーバーレスアプリケーションです。

## プロジェクト概要

このアプリケーションは、AWS SAM (Serverless Application Model)を使用して、レスポンスストリーミングをサポートするLambda関数をデプロイします。主な機能は以下の通りです：

- Model Context Protocol (MCP)を使用したツール呼び出し機能
- Lambda Response Streaming機能を活用したリアルタイムレスポンス
- 簡単な挨拶ツールと通知機能の実装例

## 使用ライブラリについて

このプロジェクトはModel Context Protocol (MCP) TypeScriptライブラリを使用しています。

- **リポジトリ**: [github.com/anthropics/model-context-protocol](https://github.com/anthropics/model-context-protocol)

## アーキテクチャ

このアプリケーションは以下のコンポーネントで構成されています：

- **MCPStreamableFunction**: Node.js 22.xランタイムを使用したLambda関数
- **Lambda Adapter Layer**: レスポンスストリーミングをサポートするためのレイヤー
- **Function URL**: 認証なしでLambda関数に直接アクセスするためのエンドポイント

## 前提条件

このプロジェクトを使用するには以下が必要です：

- [AWS CLI](https://aws.amazon.com/cli/)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js 22.x](https://nodejs.org/en/)
- [Docker](https://www.docker.com/products/docker-desktop)

## セットアップと展開

### ローカル開発環境のセットアップ

```bash
# リポジトリをClone
git clone https://github.com/moritalous/mcp-streamablehttp-lambda-sample.git
# プロジェクトディレクトリに移動
cd mcp-streamablehttp-lambda-sample

# 依存関係のインストール
cd mcp-function
npm install
cd ..
```

### ビルドとデプロイ

```bash
# アプリケーションのビルド
sam build

# アプリケーションのデプロイ（初回は対話形式）
sam deploy --guided
```

デプロイ時に以下の情報を入力します：

- **Stack Name**: CloudFormationスタックの名前（例：mcp-server-streamable-http）
- **AWS Region**: デプロイするリージョン
- **Confirm changes before deploy**: 変更を確認するかどうか
- **Allow SAM CLI IAM role creation**: IAMロールの作成を許可するかどうか
- **Save arguments to samconfig.toml**: 設定を保存するかどうか

デプロイが完了すると、Lambda Function URLが出力されます。このURLを使用してAPIにアクセスできます。

## 機能とエンドポイント

このアプリケーションは以下のエンドポイントを提供します：

- **POST /mcp**: MCPリクエストの初期化と送信
- **GET /mcp**: 許可されていないメソッド（405を返す）
- **DELETE /mcp**: 許可されていないメソッド（405を返す）

## 実装されているツール

このサンプルアプリケーションには以下のツールが実装されています：

1. **greet**: シンプルな挨拶ツール
   - パラメータ: `name` (文字列)

2. **multi-greet**: 通知機能付きで複数の挨拶を送信するツール
   - パラメータ: `name` (文字列)

3. **greeting-template**: 挨拶を生成するためのプロンプトテンプレート
   - パラメータ: `name` (文字列)

4. **greeting-resource**: デフォルトの挨拶を提供するリソース

## クライアント実装

クライアント側の実装例は `mcp-function/src/client.ts` にあります。このクライアントは以下の機能を提供する対話型コマンドラインインターフェースを提供します：

1. サーバーへの接続
2. 利用可能なツール、プロンプト、リソースの一覧取得
3. 引数を指定したツールの呼び出し
4. 引数を指定したプロンプトの取得
5. サーバーからの通知の処理
6. セッション終了と再接続の管理

## ローカルからLambdaへの接続テスト

```bash
cd mcp-function

MCP_SERVER_URL=https://*****.lambda-url.us-east-1.on.aws/mcp npm run dev:client
```

## リソースのクリーンアップ

不要になったリソースを削除するには：

```bash
sam delete --stack-name <your-stack-name>
```

## 詳細情報

- [AWS SAM デベロッパーガイド](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [Lambda Response Streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html)
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol)
