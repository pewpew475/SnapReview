/**
 * API Client for the SnapReview backend
 * Handles all API requests with authentication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiError {
  error: string;
  details?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    // Use the existing Supabase client to avoid multiple instances
    const { supabaseClient } = await import('./supabase-client');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session) {
      console.warn('No active session found');
      return null;
    }
    
    // Check if token is expired (with 5 minute buffer)
    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const buffer = 5 * 60 * 1000; // 5 minutes
      
      if (now >= expiresAt - buffer) {
        // Token is expired or about to expire
        // Supabase should auto-refresh, but let's get a fresh session
        const { data: { session: freshSession } } = await supabaseClient.auth.getSession();
        return freshSession?.access_token || session.access_token;
      }
    }
    
    return session.access_token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints (don't require auth token)
  async signUp(email: string, password: string, fullName?: string) {
    const response = await fetch(`${this.baseURL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async signIn(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async signOut() {
    return this.request('/api/auth/signout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/user');
  }

  // Evaluation endpoints
  async evaluateTask(taskId: string) {
    return this.request('/api/evaluate', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId }),
    });
  }

  async evaluateTaskStream(
    taskId: string, 
    callbacks: {
      onChunk?: (chunk: string) => void;
      onProgress?: (progress: number, message: string) => void;
      onStatus?: (status: string, message: string) => void;
      onComplete?: (evaluationId?: string, elapsed?: number) => void;
      onError?: (error: string) => void;
    }
  ) {
    const token = await this.getAuthToken();
    
    if (!token) {
      const errorMsg = 'No authentication token found. Please sign in again.';
      callbacks.onError?.(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Debug: Log token presence (don't log the actual token for security)
    console.log('[API] Making streaming request with token:', token ? `Token present (${token.length} chars)` : 'No token');
    
    const response = await fetch(`${this.baseURL}/api/evaluate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ task_id: taskId }),
    });
    
    console.log('[API] Streaming response status:', response.status, response.statusText);

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = '';
      
      // Set default message based on status code
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Your session may have expired. Please sign in again.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. You may not have permission to perform this action.';
      } else if (response.status === 404) {
        errorMessage = 'Task not found.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
      
      // Try to read error from response body if it's JSON
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Clone the response to read it without consuming the original
          const clonedResponse = response.clone();
          const errorData = await clonedResponse.json().catch(() => null);
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } else {
          // Try to read as text if not JSON
          const clonedResponse = response.clone();
          const text = await clonedResponse.text().catch(() => null);
          if (text && text.trim()) {
            try {
              const parsed = JSON.parse(text);
              if (parsed.error) {
                errorMessage = parsed.error;
              }
            } catch {
              // Not JSON, use status-based message
            }
          }
        }
      } catch (e) {
        // If we can't parse, use the status-based message we already set
        console.warn('Could not parse error response:', e);
      }
      
      // Call error callback and throw
      callbacks.onError?.(errorMessage);
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[API] Stream ended');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue; // Skip empty lines
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue; // Skip empty data lines
              
              const data = JSON.parse(jsonStr);
              console.log('[API] Received SSE event:', data.type || 'data', data);
              
              // Handle different event types
              if (data.type === 'status') {
                callbacks.onStatus?.(data.status, data.message);
                callbacks.onProgress?.(data.progress || 0, data.message);
              } else if (data.type === 'progress') {
                callbacks.onProgress?.(data.progress || 0, data.message || 'Processing...');
                if (data.content) {
                  callbacks.onChunk?.(data.content);
                }
              } else if (data.type === 'complete') {
                callbacks.onComplete?.(data.evaluation_id, data.elapsed);
                return;
              } else if (data.type === 'error' || data.error) {
                // Error event in the stream
                const errorMsg = data.error || data.message || 'An error occurred during evaluation';
                console.error('[API] Error event in stream:', errorMsg);
                callbacks.onError?.(errorMsg);
                throw new Error(errorMsg);
              } else if (data.content) {
                callbacks.onChunk?.(data.content);
              } else if (data.done) {
                callbacks.onComplete?.();
                return;
              }
            } catch (e) {
              // If it's a JSON parse error, log it but continue
              if (e instanceof SyntaxError) {
                console.warn('[API] Failed to parse SSE data:', line.substring(0, 100), e);
                continue;
              }
              // If it's an error we threw, re-throw it
              if (e instanceof Error) {
                throw e;
              }
            }
          }
        }
      }
    } catch (streamError: any) {
      // Handle stream reading errors
      const errorMsg = streamError.message || 'Failed to read evaluation stream';
      console.error('[API] Stream error:', errorMsg, streamError);
      callbacks.onError?.(errorMsg);
      throw new Error(errorMsg);
    }
  }

  async getEvaluationPreview(evaluationId: string) {
    return this.request(`/api/evaluations/${evaluationId}/preview`);
  }

  async getEvaluationFull(evaluationId: string) {
    return this.request(`/api/evaluations/${evaluationId}/full`);
  }

  async getEvaluations() {
    return this.request('/api/evaluations');
  }

  // Task endpoints
  async createTask(data: {
    title: string;
    code: string;
    language: string;
    description?: string;
    category?: string;
    difficulty_level?: string;
  }) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTasks() {
    return this.request('/api/tasks');
  }

  // Payment endpoints
  async createPaymentOrder(evaluationId: string, amount?: number) {
    return this.request('/api/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ evaluation_id: evaluationId, amount }),
    });
  }

  async verifyPayment(orderId: string, paymentId: string, signature?: string) {
    return this.request('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, payment_id: paymentId, signature }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

