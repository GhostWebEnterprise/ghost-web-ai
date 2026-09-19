# AI Gateway + VLY Integrations

First-order integrations for AI, email, and payments with automatic usage billing through VLY integration keys.

## Environment Variables

The following environment variables are automatically set during project creation:

- `AI_GATEWAY_API_KEY`: Server-side key for the OpenAI-compatible AI gateway
- `AI_GATEWAY_BASE_URL`: Gateway base URL (default: `https://ai-gateway.vercel.sh/v1`)
- `VLY_INTEGRATION_KEY`: Legacy/other VLY integration key, only where the VLY integration package is still used
- `VLY_INTEGRATION_BASE_URL`: Legacy VLY integration gateway URL

## Verified AI Gateway

GhostWeb AI now uses the Vercel AI Gateway as its model-routing endpoint. The live catalogue is discovered from `GET /v1/models`; the application does not treat the curated model list as authoritative. A model is shown as verified only when its exact ID is present in the live catalogue.

```text
https://ai-gateway.vercel.sh/v1/models
https://ai-gateway.vercel.sh/v1/chat/completions
https://ai-gateway.vercel.sh/v1/responses
```

The curated IDs in `src/lib/ai-gateway.ts` include verified OpenAI, Anthropic, Google, Alibaba/Qwen, DeepSeek and Meta/Llama entries. The runtime filters this list against the live catalogue before exposing it.

**Security:** `AI_GATEWAY_API_KEY` is server-side only and must never be placed in a `VITE_*` variable or committed to source control.

## Installation

The `@vly-ai/integrations` package is already included in package.json.

## Usage in Convex Actions

```typescript
"use node";

import { vly } from '../lib/vly-integrations';
import { action } from "./_generated/server";

export const generateAIResponse = action({
  handler: async (ctx, args) => {
    // AI Completions
    const completion = await freebuff.com.completion({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' }
      ],
      temperature: 0.7,
      maxTokens: 150
    });
    
    return completion;
  }
});
```

## Available Features

### AI Integration
```typescript
// Create completion
const completion = await freebuff.com.completion({
  model: 'gpt-4o-mini', // or 'gpt-4o', 'claude-3-haiku', etc.
  messages: [...],
  temperature: 0.7,
  maxTokens: 150
});

// Stream completion
await freebuff.com.streamCompletion(
  request,
  (chunk: string) => console.log(chunk)
);

// Generate embeddings
const embeddings = await freebuff.com.embeddings("Your text here");
```

### Email Integration
```typescript
// Send email
const emailResult = await vly.email.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our service!</h1>',
  text: 'Welcome to our service!'
});

// Send batch emails
const batchResult = await vly.email.sendBatch([...emails]);
```

### Payments Integration
```typescript
// Create payment intent
const paymentIntent = await vly.payments.createPaymentIntent({
  amount: 2000, // $20.00 in cents
  currency: 'usd',
  description: 'Premium subscription',
  customer: {
    email: 'customer@example.com'
  }
});

// Create subscription
const subscription = await vly.payments.createSubscription({...});

// Create checkout session
const session = await vly.payments.createCheckoutSession({...});
```

## Error Handling

All methods return an ApiResponse object:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    credits: number;
    operation: string;
  };
}
```

Example error handling:

```typescript
const result = await freebuff.com.completion({ ... });

if (result.success) {
  console.log('Response:', result.data);
  console.log('Credits used:', result.usage?.credits);
} else {
  console.error('Error:', result.error);
}
```

## Important Notes

1. The AI gateway key (`AI_GATEWAY_API_KEY`) must be configured server-side
2. All API calls are automatically billed to your deployment based on usage
3. Must be used in Convex actions with `"use node"` directive
4. The integration key should never be exposed to the client

## Checking Integration Status

To verify the integration is properly configured:

```typescript
const hasIntegration = !!process.env.VLY_INTEGRATION_KEY;
if (!hasIntegration) {
  console.error("VLY integration key not found");
}
```
