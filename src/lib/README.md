# API Client Usage Guide

This guide shows how to use the API client in your React components.

## Setup

The API client automatically handles authentication using Supabase sessions. Make sure you have:

1. Supabase client initialized
2. User signed in via Supabase Auth
3. Environment variables set (`VITE_API_URL`, `VITE_SUPABASE_URL`, etc.)

## Basic Usage

```typescript
import { apiClient } from '@/lib/api-client';

// Sign up
const signUp = async () => {
  try {
    const result = await apiClient.signUp('user@example.com', 'password123', 'John Doe');
    console.log('User created:', result);
  } catch (error) {
    console.error('Sign up failed:', error);
  }
};

// Sign in
const signIn = async () => {
  try {
    const result = await apiClient.signIn('user@example.com', 'password123');
    // Store the access token if needed
    localStorage.setItem('access_token', result.access_token);
  } catch (error) {
    console.error('Sign in failed:', error);
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    const user = await apiClient.getCurrentUser();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Failed to get user:', error);
  }
};
```

## Evaluation

```typescript
// Complete evaluation
const evaluateTask = async (taskId: string) => {
  try {
    const result = await apiClient.evaluateTask(taskId);
    console.log('Evaluation preview:', result.preview);
  } catch (error) {
    console.error('Evaluation failed:', error);
  }
};

// Streaming evaluation
const evaluateTaskStream = async (taskId: string) => {
  try {
    let fullResponse = '';
    
    await apiClient.evaluateTaskStream(taskId, (chunk) => {
      fullResponse += chunk;
      // Update UI with streaming content
      console.log('Chunk received:', chunk);
    });
    
    console.log('Full response:', fullResponse);
  } catch (error) {
    console.error('Streaming failed:', error);
  }
};

// Get evaluation preview
const getPreview = async (evaluationId: string) => {
  try {
    const preview = await apiClient.getEvaluationPreview(evaluationId);
    console.log('Preview:', preview);
  } catch (error) {
    console.error('Failed to get preview:', error);
  }
};

// Get full evaluation (requires unlock)
const getFullEvaluation = async (evaluationId: string) => {
  try {
    const full = await apiClient.getEvaluationFull(evaluationId);
    console.log('Full evaluation:', full);
  } catch (error) {
    if (error.message.includes('locked')) {
      // Redirect to payment
      console.log('Evaluation is locked, payment required');
    }
  }
};
```

## Payment (Demo)

```typescript
// Create payment order
const createPayment = async (evaluationId: string) => {
  try {
    const order = await apiClient.createPaymentOrder(evaluationId, 99.00);
    console.log('Order created:', order);
    
    // In a real app, you would redirect to payment gateway
    // For demo, we can verify immediately
    return order;
  } catch (error) {
    console.error('Payment creation failed:', error);
  }
};

// Verify payment (demo - no actual charge)
const verifyPayment = async (orderId: string, paymentId: string) => {
  try {
    const result = await apiClient.verifyPayment(orderId, paymentId);
    console.log('Payment verified:', result);
    
    if (result.evaluation_unlocked) {
      // Now you can fetch the full evaluation
      console.log('Evaluation unlocked!');
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
};
```

## React Hook Example

```typescript
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function useEvaluation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const evaluate = async (taskId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.evaluateTask(taskId);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { evaluate, loading, error, result };
}
```

## Error Handling

All API methods throw errors that you should catch:

```typescript
try {
  await apiClient.evaluateTask(taskId);
} catch (error: any) {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
  } else if (error.message.includes('404')) {
    // Not found
  } else {
    // Other error
  }
}
```

