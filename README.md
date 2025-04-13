# Streamable MCP Lambda Function

> [!WARNING]
> While we have confirmed that this can be deployed to Lambda and called from the MCP TypeScript library, the implementation is tricky, including accessing private properties, and may not always work as expected. This remains as a proof of concept.

This project is a serverless application that implements a Streamable HTTP API using the Model Context Protocol (MCP) on AWS Lambda.

## Project Overview

This application deploys a Lambda function that supports response streaming using AWS SAM (Serverless Application Model). The main features include:

- Tool invocation functionality using the Model Context Protocol (MCP)
- Real-time responses utilizing Lambda Response Streaming
- Implementation examples of simple echo and calculation tools

## About the Libraries Used

This project uses an unreleased version (main branch) of the Model Context Protocol (MCP) TypeScript library.

- **Repository**: [github.com/anthropics/model-context-protocol](https://github.com/anthropics/model-context-protocol)
- **Branch**: main
- **Commit Hash**: 56b042795729dcdbf12a2c7be47955fbeafc6bc5 (2025-04-13)

> [!NOTE]
> Since we are using an unreleased version, compatibility may be lost due to future API changes.

## Architecture

This application consists of the following components:

- **MCPStreamableFunction**: Lambda function using Node.js 22.x runtime
- **Lambda Adapter Layer**: Layer to support response streaming
- **Function URL**: Endpoint for direct access to the Lambda function without authentication

## Prerequisites

To use this project, you need:

- [AWS CLI](https://aws.amazon.com/cli/)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js 22.x](https://nodejs.org/en/)
- [Docker](https://www.docker.com/products/docker-desktop)

## Setup and Deployment

### Setting up the Local Development Environment

```bash
# Clone the repository. The `--recursive` flag is required as it includes Git submodules
git clone --recursive https://github.com/moritalous/mcp-streamablehttp-lambda-sample.git
# Navigate to the project directory
cd mcp-streamablehttp-lambda-sample

# Install dependencies
cd mcp-function
npm install
npm run setup
cd ..
```

### Build and Deploy

```bash
# Build the application
sam build

# Deploy the application (interactive for the first time)
sam deploy --guided
```

During deployment, you will be prompted to enter the following information:

- **Stack Name**: Name of the CloudFormation stack (e.g., mcp-server-streamable-http)
- **AWS Region**: Region to deploy to
- **Confirm changes before deploy**: Whether to confirm changes
- **Allow SAM CLI IAM role creation**: Whether to allow IAM role creation
- **Save arguments to samconfig.toml**: Whether to save the configuration

After deployment completes, the Lambda Function URL will be output. You can use this URL to access the API.

## Features and Endpoints

This application provides the following endpoints:

- **POST /mcp**: Initialize and send MCP requests
- **GET /mcp**: Establish Server-Sent Events (SSE) stream
- **DELETE /mcp**: End the session

## Implemented Tools

This sample application implements the following tools:

1. **echo**: A tool that returns the input message as is
   - Parameter: `message` (string)

2. **add**: A tool that adds two numbers
   - Parameters: `a` (number), `b` (number)

## Client Implementation

A client implementation example is available in `mcp-function/src/client.ts`. This client performs the following functions:

1. Connect to the server
2. Get a list of available tools
3. Call the echo tool
4. Call the add tool
5. End the connection

## Testing Connection from Local to Lambda

```bash
cd mcp-function

MCP_SERVER_URL=https://*****.lambda-url.us-east-1.on.aws/mcp npm run dev:client
```

## Resource Cleanup

To remove resources when no longer needed:

```bash
sam delete --stack-name <your-stack-name>
```

## Additional Information

- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [Lambda Response Streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html)
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol)
