import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { CallToolResult, GetPromptResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

// Create an MCP server with implementation details
const server = new McpServer({
  name: 'stateless-streamable-http-server',
  version: '1.0.0',
}, { capabilities: { logging: {} } });

// Register a simple prompt
server.prompt(
  'greeting-template',
  'A simple greeting prompt template',
  {
    name: z.string().describe('Name to include in greeting'),
  },
  async ({ name }): Promise<GetPromptResult> => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please greet ${name} in a friendly manner.`,
          },
        },
      ],
    };
  }
);

// Register a simple tool that returns a greeting
server.tool(
  'greet',
  'A simple greeting tool',
  {
    name: z.string().describe('Name to greet'),
  },
  async ({ name }): Promise<CallToolResult> => {
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${name}!`,
        },
      ],
    };
  }
);

// Register a tool that sends multiple greetings with notifications
server.tool(
  'multi-greet',
  'A tool that sends different greetings with delays between them',
  {
    name: z.string().describe('Name to greet'),
  },
  async ({ name }, { sendNotification }): Promise<CallToolResult> => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    await sendNotification({
      method: "notifications/message",
      params: { level: "debug", data: `Starting multi-greet for ${name}` }
    });

    await sleep(1000); // Wait 1 second before first greeting

    await sendNotification({
      method: "notifications/message",
      params: { level: "info", data: `Sending first greeting to ${name}` }
    });

    await sleep(1000); // Wait another second before second greeting

    await sendNotification({
      method: "notifications/message",
      params: { level: "info", data: `Sending second greeting to ${name}` }
    });

    return {
      content: [
        {
          type: 'text',
          text: `Good morning, ${name}!`,
        }
      ],
    };
  }
);

// Create a simple resource at a fixed URI
server.resource(
  'greeting-resource',
  'https://example.com/greetings/default',
  { mimeType: 'text/plain' },
  async (): Promise<ReadResourceResult> => {
    return {
      contents: [
        {
          uri: 'https://example.com/greetings/default',
          text: 'Hello, world!',
        },
      ],
    };
  }
);

const app = express();
app.use(express.json());

const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

// Setup routes for the server
const setupServer = async () => {
  await server.connect(transport);
};

app.post('/mcp', async (req: Request, res: Response) => {
  console.log('Received MCP request:', req.body);
  try {
      await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req: Request, res: Response) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('Received DELETE MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

// Start the server
const PORT = 3000;
setupServer().then(() => {
  app.listen(PORT, () => {
    console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to set up the server:', error);
  process.exit(1);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
    try {
      console.log(`Closing transport`);
      await transport.close();
    } catch (error) {
      console.error(`Error closing transport:`, error);
    }
  
  await server.close();
  console.log('Server shutdown complete');
  process.exit(0);
});