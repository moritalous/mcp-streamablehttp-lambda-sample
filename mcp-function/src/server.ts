import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import bodyParser from 'body-parser';
import express from 'express';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const app = express();
const PORT = process.env.PORT || 3001;

// JSON ボディパーサーを追加
app.use(bodyParser.json());

/**
 * 完全にステートレスなサーバーインスタンスを作成する関数
 * 各リクエストごとに新しいインスタンスを作成
 */
function createStatelessServer() {
  console.log('Creating new stateless server instance');

  const server = new Server(
    {
      name: 'mcp-streamablehttp-sample-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // ツール一覧を取得するハンドラを設定
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // エコーツールのスキーマ定義
    const EchoSchema = z.object({
      message: z.string().describe('Message to echo'),
    });

    // 足し算ツールのスキーマ定義
    const AddSchema = z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    });

    // JSONスキーマに変換
    const echoJsonSchema = zodToJsonSchema(EchoSchema);
    const addJsonSchema = zodToJsonSchema(AddSchema);

    const tools: Tool[] = [
      {
        name: 'echo',
        description: 'Echoes back the input',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to echo' }
          }
        },
      },
      {
        name: 'add',
        description: 'Adds two numbers',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' }
          }
        },
      },
    ];

    return { tools };
  });

  // ツール呼び出しハンドラを設定
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'echo' && args) {
      const message = args.message as string;
      return {
        content: [{ type: 'text', text: `Echo: ${message}` }],
      };
    }

    if (name === 'add' && args) {
      const a = args.a as number;
      const b = args.b as number;
      const sum = a + b;
      return {
        content: [
          {
            type: 'text',
            text: `The sum of ${a} and ${b} is ${sum}.`,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // 完全にステートレスなトランスポートを作成
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => undefined,
    enableJsonResponse: true // JSON応答を有効化（ストリーミングではなく）
  });

  // サーバーに接続
  server.connect(transport);

  return { server, transport };
}

// POSTリクエスト処理（初期化とメッセージ送信用）
app.post('/mcp', async (req, res) => {
  console.log('Received POST request');

  try {
    // リクエストボディを確認
    const message = req.body;
    const isInitRequest = Array.isArray(message)
      ? message.some(msg => msg.method === 'initialize')
      : message.method === 'initialize';

    console.log(`Is initialization request: ${isInitRequest}`);

    // 新しいサーバーとトランスポートを作成
    const { transport } = createStatelessServer();

    // 初期化リクエストの場合、内部フラグを設定
    if (isInitRequest) {
      // @ts-ignore - プライベートプロパティにアクセス
      transport._initialized = false;
    } else {
      // 初期化以外のリクエストの場合、既に初期化済みとして扱う
      // @ts-ignore - プライベートプロパティにアクセス
      transport._initialized = true;
    }

    // リクエストを処理
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: String(error)
      },
      id: null
    });
  }
});

// GETリクエスト処理（SSEストリーム確立用）
app.get('/mcp', async (req, res) => {
  console.log('Received GET request');

  try {
    // 新しいサーバーとトランスポートを作成
    const { transport } = createStatelessServer();

    // GETリクエストは常に初期化済みとして扱う
    // @ts-ignore - プライベートプロパティにアクセス
    transport._initialized = true;

    // リクエストを処理
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: String(error)
      },
      id: null
    });
  }
});

// DELETEリクエスト処理（セッション終了用）
app.delete('/mcp', async (req, res) => {
  console.log('Received DELETE request');

  try {
    // 新しいサーバーとトランスポートを作成
    const { transport } = createStatelessServer();

    // DELETEリクエストは常に初期化済みとして扱う
    // @ts-ignore - プライベートプロパティにアクセス
    transport._initialized = true;

    // リクエストを処理
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
        data: String(error)
      },
      id: null
    });
  }
});

// クリーンアップ処理
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  process.exit(0);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
