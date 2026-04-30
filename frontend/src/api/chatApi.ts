const API_BASE_URL = 'http://localhost:8080/api';

export interface ChatSession {
  id: number;
  userId: number;
  title: string;
  createTime: string;
  updateTime: string;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number;
  createTime: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const chatApi = {
  async createSession(userId?: number): Promise<ApiResponse<ChatSession>> {
    const url = userId 
      ? `${API_BASE_URL}/chat/sessions?userId=${userId}`
      : `${API_BASE_URL}/chat/sessions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`创建会话失败: ${response.status}`);
    }
    return await response.json();
  },

  async getUserSessions(userId?: number): Promise<ApiResponse<ChatSession[]>> {
    const url = userId
      ? `${API_BASE_URL}/chat/sessions?userId=${userId}`
      : `${API_BASE_URL}/chat/sessions`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`获取会话列表失败: ${response.status}`);
    }
    return await response.json();
  },

  async getSession(sessionId: number): Promise<ApiResponse<ChatSession>> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`获取会话详情失败: ${response.status}`);
    }
    return await response.json();
  },

  async deleteSession(sessionId: number, userId?: number): Promise<ApiResponse<boolean>> {
    const url = userId
      ? `${API_BASE_URL}/chat/sessions/${sessionId}?userId=${userId}`
      : `${API_BASE_URL}/chat/sessions/${sessionId}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`删除会话失败: ${response.status}`);
    }
    return await response.json();
  },

  async sendMessage(sessionId: number, content: string, userId?: number): Promise<ApiResponse<ChatMessage>> {
    const url = userId
      ? `${API_BASE_URL}/chat/sessions/${sessionId}/messages?userId=${userId}`
      : `${API_BASE_URL}/chat/sessions/${sessionId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new Error(`发送消息失败: ${response.status}`);
    }
    return await response.json();
  },

  async sendMessageNewSession(content: string, userId?: number): Promise<ApiResponse<ChatMessage>> {
    const url = userId
      ? `${API_BASE_URL}/chat/messages?userId=${userId}`
      : `${API_BASE_URL}/chat/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new Error(`发送消息失败: ${response.status}`);
    }
    return await response.json();
  },

  async getSessionMessages(sessionId: number): Promise<ApiResponse<ChatMessage[]>> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`);
    if (!response.ok) {
      throw new Error(`获取消息列表失败: ${response.status}`);
    }
    return await response.json();
  },

  async clearSessionMessages(sessionId: number, userId?: number): Promise<ApiResponse<boolean>> {
    const url = userId
      ? `${API_BASE_URL}/chat/sessions/${sessionId}/clear?userId=${userId}`
      : `${API_BASE_URL}/chat/sessions/${sessionId}/clear`;
    const response = await fetch(url, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`清空会话消息失败: ${response.status}`);
    }
    return await response.json();
  },
};
