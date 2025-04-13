import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// 型定義
interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

type ToolCallContent = TextContent | ImageContent;

/**
 * MCP Streamable HTTP クライアントのサンプル実装
 */
async function runClient() {
  // サーバーのURLを設定
  const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3001/mcp';
  
  console.log(`Connecting to MCP server at: ${serverUrl}`);
  
  // トランスポートの作成
  const transport = new StreamableHTTPClientTransport(
    new URL(serverUrl)
  );

  // クライアントの作成
  const client = new Client(
    {
      name: 'mcp-streamablehttp-sample-client',
      version: '1.0.0'
    }
  );

  try {
    // クライアントの接続
    console.log('Connecting to server...');
    await client.connect(transport);
    console.log('Connected to server');

    // 利用可能なツールの一覧を取得
    console.log('Fetching available tools...');
    const toolsResult = await client.listTools();
    console.log('Available tools:');
    toolsResult.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // エコーツールを呼び出す
    console.log('\nCalling echo tool...');
    const echoResult = await client.callTool({
      name: 'echo',
      arguments: { message: 'Hello, MCP!' }
    });
    console.log('Echo tool result:');
    (echoResult.content as ToolCallContent[]).forEach((item: ToolCallContent) => {
      if (item.type === 'text') {
        console.log(item.text);
      }
    });

    // 足し算ツールを呼び出す
    console.log('\nCalling add tool...');
    const addResult = await client.callTool({
      name: 'add',
      arguments: { a: 5, b: 7 }
    });
    console.log('Add tool result:');
    (addResult.content as ToolCallContent[]).forEach((item: ToolCallContent) => {
      if (item.type === 'text') {
        console.log(item.text);
      }
    });

    // クライアントの切断
    console.log('\nClosing connection...');
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// クライアントを実行
runClient().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
