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

// サーバーの初期化状態を追跡
let isServerInitialized = false;
let currentTransport: StreamableHTTPServerTransport | null = null;

/**
 * サーバーインスタンスを作成する関数
 */
function createServer() {
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

  return {
    server,
    cleanup: async () => {
      console.log('Cleaning up server resources...');
    },
  };
}

// POSTリクエスト処理（初期化とメッセージ送信用）
app.post('/mcp', async (req, res) => {
  console.log('Received POST request');

  try {
    // req.bodyを使用（bodyParserによって解析済み）
    const message = req.body;
    const isInitRequest = Array.isArray(message)
      ? message.some(msg => msg.method === 'initialize')
      : message.method === 'initialize';

    // 初期化リクエストの場合、または初期化されていない場合は新しいサーバーとトランスポートを作成
    if (isInitRequest || !isServerInitialized) {
      console.log('Creating new server instance');
      const { server, cleanup } = createServer();

      // 新しいトランスポートを作成
      currentTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => {
          return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
      });

      // サーバーに接続
      await server.connect(currentTransport);
      isServerInitialized = true;

      // クリーンアップ処理の設定
      server.onclose = async () => {
        await cleanup();
        isServerInitialized = false;
        currentTransport = null;
      };
    }

    // リクエストを処理
    if (currentTransport) {
      await currentTransport.handleRequest(req, res, req.body);
    } else {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Server transport not initialized'
        },
        id: null
      });
    }
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
  if (currentTransport) {
    await currentTransport.handleRequest(req, res);
  } else {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Server transport not initialized'
      },
      id: null
    });
  }
});

// DELETEリクエスト処理（セッション終了用）
app.delete('/mcp', async (req, res) => {
  console.log('Received DELETE request');
  if (currentTransport) {
    await currentTransport.handleRequest(req, res);
  } else {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Server transport not initialized'
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
