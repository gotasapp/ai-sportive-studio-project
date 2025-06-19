# Engine Webhooks Guide

## Overview

Configure webhooks in Engine to notify your backend server of transaction or backend wallet events.

## Supported Events

### Transactions

Handle when a blockchain transaction is sent and mined onchain.

| Event | Description |
|-------|-------------|
| `sent_transaction` | A transaction is submitted to RPC. A transaction hash is provided, but it may not be mined onchain yet. |
| `mined_transaction` | A transaction is mined on the blockchain. Note: The transaction may have reverted onchain. Check the `onchainStatus` field to confirm if the transaction was successful. |
| `errored_transaction` | A transaction is unable to be submitted. There may be an error in the transaction params, backend wallet, or server. |
| `all_transaction` | All the above events. |

### Wallets

| Event | Description |
|-------|-------------|
| `backend_wallet_balance` | A backend wallet's balance is below `minWalletBalance`. To read or update this value, call GET/POST `/configuration/backend-wallet-balance`. |

## Webhooks Lifecycle

The transaction payload contains a `status` field which is one of: `sent`, `mined`, `errored`

Depending on the transaction, your backend will receive one of these webhook sequences:

| Transaction statuses | Description |
|---------------------|-------------|
| `sent` + `mined` | The transaction was sent and mined onchain. |
| `errored` | The transaction errored before being sent. Common reasons: The transaction failed simulation, the backend wallet is out of funds, the network is down, or another internal error, transaction with a gas ceiling timed out. The `errorMessage` field will contain further details. |
| `sent` + `errored` | The transaction was sent but was not mined onchain after some duration. Common reasons: The transaction was dropped from RPC mempool, another transaction was mined with the same nonce, or the nonce was too far ahead of the onchain nonce. |
| `cancelled` | The transaction was in queue (not sent yet) and cancelled. |
| `sent` + `cancelled` | The transaction was sent and waiting to be mined, but cancelled. |

**Note:** Webhooks may come out of order. Treat later statuses as higher priority than earlier ones. For example if your backend receives a `sent` webhook after a `mined` webhook, treat this transaction as mined.

## Setup

### Create a Webhook

1. Visit the Engine dashboard and select your Engine.
2. Select the **Configuration** tab.
3. Select **Create Webhook**.

**Note:** Webhook URLs must start with `https://`.

### API Endpoints

#### Get All Webhooks
```http
GET /webhooks/get-all
```

#### Create Webhook
```http
POST /webhooks/create
```

**Body:**
```json
{
  "url": "https://example.com/webhook",
  "name": "Notify of transaction updates",
  "eventType": "all_transactions"
}
```

#### Revoke Webhook
```http
POST /webhooks/revoke
```

**Body:**
```json
{
  "id": 1
}
```

#### Test Webhook
```http
POST /webhooks/{webhookId}/test
```

## Payload Format

**Method:** POST

**Headers:**
- `Content-Type: application/json`
- `X-Engine-Signature: <payload signature>`
- `X-Engine-Timestamp: <Unix timestamp in seconds>`

### Example Payloads

#### Sent Transaction
```json
{
  "queueId": "uuid",
  "status": "sent",
  "transactionHash": "0x...",
  "chainId": "80002",
  "contractAddress": "0x...",
  "walletAddress": "0x...",
  "functionName": "mintTo",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Mined Transaction
```json
{
  "queueId": "uuid",
  "status": "mined",
  "transactionHash": "0x...",
  "chainId": "80002",
  "contractAddress": "0x...",
  "walletAddress": "0x...",
  "functionName": "mintTo",
  "onchainStatus": "success",
  "gasUsed": "150000",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Webhook Verification (Recommended)

Since any outside origin can call your webhook endpoint, it is recommended to verify the webhook signature to ensure a request comes from your Engine instance.

### Check the Signature

The payload body is signed with the webhook secret and provided in the `X-Engine-Signature` request header.

Get the webhook secret for your webhook endpoint from the dashboard.

```javascript
const generateSignature = (
  body: string,
  timestamp: string,
  secret: string,
): string => {
  const payload = `${timestamp}.${body}`;
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
};

const isValidSignature = (
  body: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean => {
  const expectedSignature = generateSignature(
    body,
    timestamp,
    secret,
  );
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature),
  );
};
```

### Check the Timestamp

The event timestamp is provided in the `X-Engine-Timestamp` request header.

```javascript
export const isExpired = (
  timestamp: string,
  expirationInSeconds: number,
): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - parseInt(timestamp) > expirationInSeconds;
};
```

## Example Webhook Endpoint

This NodeJS code example listens for event notifications on the `/webhook` endpoint:

```javascript
import express from "express";
import bodyParser from "body-parser";
import { isValidSignature, isExpired } from "./webhookHelper";

const app = express();
const port = 3000;

const WEBHOOK_SECRET = "<your_webhook_auth_secret>";

app.use(bodyParser.text());

app.post("/webhook", (req, res) => {
  const signatureFromHeader = req.header("X-Engine-Signature");
  const timestampFromHeader = req.header("X-Engine-Timestamp");

  if (!signatureFromHeader || !timestampFromHeader) {
    return res
      .status(401)
      .send("Missing signature or timestamp header");
  }

  if (
    !isValidSignature(
      req.body,
      timestampFromHeader,
      signatureFromHeader,
      WEBHOOK_SECRET,
    )
  ) {
    return res.status(401).send("Invalid signature");
  }

  if (isExpired(timestampFromHeader, 300)) {
    // Assuming expiration time is 5 minutes (300 seconds)
    return res.status(401).send("Request has expired");
  }

  // Process the request
  console.log("Webhook received:", JSON.parse(req.body));
  res.status(200).send("Webhook received!");
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
```

## Integration with Next.js

For Next.js API routes, create a webhook handler:

```typescript
// pages/api/webhooks/engine.ts or app/api/webhooks/engine/route.ts

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-engine-signature'] as string;
  const timestamp = req.headers['x-engine-timestamp'] as string;
  const body = JSON.stringify(req.body);

  // Verify signature (implement verification logic)
  const isValid = isValidSignature(body, timestamp, signature, process.env.WEBHOOK_SECRET!);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process the webhook
  const { queueId, status, transactionHash } = req.body;
  
  console.log(`Transaction ${queueId} status: ${status}`);
  
  // Handle different transaction statuses
  switch (status) {
    case 'sent':
      console.log(`Transaction sent: ${transactionHash}`);
      break;
    case 'mined':
      console.log(`Transaction mined: ${transactionHash}`);
      // Update your database, notify users, etc.
      break;
    case 'errored':
      console.log(`Transaction failed: ${queueId}`);
      break;
  }

  res.status(200).json({ success: true });
}
```

## Engine Transaction Lifecycle

### Transaction Statuses

- **Queued:** The transaction was received by Engine and waiting in the transaction queue.
- **Sent:** The transaction was successfully sent to RPC.
- **Mined:** The transaction was successfully mined onchain.
- **Cancelled:** The transaction was cancelled by the user.
- **Errored:** The transaction failed to be sent to RPC or to the chain's nodes.

### Cancelling Transactions

Engine submits transactions to the blockchain within 5-10 seconds of receiving a request. During gas or traffic spikes, transactions may take longer to be mined.

#### Cancel a Transaction from the API

```javascript
// queueId was returned from a previous write request.

const resp = await fetch("<engine_url>/transaction/cancel", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer <access_token>",
  },
  body: JSON.stringify({ queueId }),
});

if (resp.status === 200) {
  console.log(`Transaction ${queueId} was canceled.`);
}
```

## Gasless Transactions

Engine offers multiple options for developers looking to sponsor gas for their users' transactions:

### Use Cases
- Build an NFT checkout where the buyer is sent an NFT upon fiat payment.
- Enable users to transfer an NFT to a friend or list an NFT on a marketplace.
- Minimize friction by seamlessly managing transactions for players in a web3 game.

### Approaches

1. **Send transactions with backend wallets**
   - If a contract method can be called on behalf of a user
   - Examples: NFT contracts that can be claimed and sent to another wallet

2. **Send meta-transactions with relayers**
   - If your contract supports meta-transactions
   - Use Engine as a relayer to send meta-transactions signed by users' wallets

3. **Send transactions with smart accounts**
   - If your users have smart accounts
   - Use Engine backend wallets to transact on behalf of smart accounts

## Best Practices

1. **Always verify webhook signatures** to ensure requests come from your Engine instance
2. **Handle webhook events idempotently** as they may be delivered multiple times
3. **Process webhooks asynchronously** to avoid blocking the webhook endpoint
4. **Store webhook events** for debugging and audit purposes
5. **Implement proper error handling** and respond with appropriate HTTP status codes
6. **Use HTTPS** for all webhook URLs (required by Engine)
7. **Set reasonable timeouts** for webhook processing to avoid delays

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check if the webhook URL is accessible from the internet
   - Verify the webhook is properly configured in Engine dashboard
   - Ensure your server is responding with 200 status codes

2. **Signature verification failing**
   - Check if you're using the correct webhook secret
   - Verify the signature generation algorithm matches Engine's implementation
   - Ensure you're using the raw request body for signature verification

3. **Missing webhook events**
   - Check Engine logs for webhook delivery attempts
   - Verify your endpoint is processing requests quickly enough
   - Consider implementing a retry mechanism for failed webhook deliveries

### Monitoring

- Monitor webhook delivery success rates
- Set up alerts for failed webhook deliveries
- Log all webhook events for debugging
- Track transaction completion rates through webhooks 