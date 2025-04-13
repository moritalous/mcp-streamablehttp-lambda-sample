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

// Add JSON body parser
app.use(bodyParser.json());

/**
 * Function to create a completely stateless server instance
 * Creates a new instance for each request
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

  // Set handler for retrieving tool list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Echo tool schema definition
    const EchoSchema = z.object({
      message: z.string().describe('Message to echo'),
    });

    // Addition tool schema definition
    const AddSchema = z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    });

    // Convert to JSON schema
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

  // Set tool call handler
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

  // Create completely stateless transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => undefined,
    enableJsonResponse: true // Enable JSON response (not streaming)
  });

  // Connect to server
  server.connect(transport);

  return { server, transport };
}

// POST request handler (for initialization and message sending)
app.post('/mcp', async (req, res) => {
  console.log('Received POST request');

  try {
    // Check request body
    const message = req.body;
    const isInitRequest = Array.isArray(message)
      ? message.some(msg => msg.method === 'initialize')
      : message.method === 'initialize';

    console.log(`Is initialization request: ${isInitRequest}`);

    // Create new server and transport
    const { transport } = createStatelessServer();

    // For initialization requests, set internal flag
    if (isInitRequest) {
      // @ts-ignore - accessing private property
      transport._initialized = false;
    } else {
      // For non-initialization requests, treat as already initialized
      // @ts-ignore - accessing private property
      transport._initialized = true;
    }

    // Process request
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

// GET request handler (for establishing SSE stream)
app.get('/mcp', async (req, res) => {
  console.log('Received GET request');

  try {
    // Create new server and transport
    const { transport } = createStatelessServer();

    // GET requests are always treated as already initialized
    // @ts-ignore - accessing private property
    transport._initialized = true;

    // Process request
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

// DELETE request handler (for session termination)
app.delete('/mcp', async (req, res) => {
  console.log('Received DELETE request');

  try {
    // Create new server and transport
    const { transport } = createStatelessServer();

    // DELETE requests are always treated as already initialized
    // @ts-ignore - accessing private property
    transport._initialized = true;

    // Process request
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

// Cleanup handler
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
