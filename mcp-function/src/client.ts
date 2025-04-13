import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Type definitions
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
 * Sample implementation of MCP Streamable HTTP client
 */
async function runClient() {
  // Set the server URL
  const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3001/mcp';
  
  console.log(`Connecting to MCP server at: ${serverUrl}`);
  
  // Create transport
  const transport = new StreamableHTTPClientTransport(
    new URL(serverUrl)
  );

  // Create client
  const client = new Client(
    {
      name: 'mcp-streamablehttp-sample-client',
      version: '1.0.0'
    }
  );

  try {
    // Connect the client
    console.log('Connecting to server...');
    await client.connect(transport);
    console.log('Connected to server');

    // Get list of available tools
    console.log('Fetching available tools...');
    const toolsResult = await client.listTools();
    console.log('Available tools:');
    toolsResult.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // Call echo tool
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

    // Call addition tool
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

    // Disconnect the client
    console.log('\nClosing connection...');
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the client
runClient().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
