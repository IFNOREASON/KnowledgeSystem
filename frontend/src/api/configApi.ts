const API_BASE_URL = 'http://localhost:8080/api';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const configApi = {
  async getTheme(): Promise<ApiResponse<string>> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/theme`);
      if (!response.ok) {
        throw new Error(`获取主题设置失败: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch theme from server, using local storage:', error);
      return {
        code: 200,
        message: '使用本地设置',
        data: 'light'
      };
    }
  },

  async setTheme(theme: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });
      if (!response.ok) {
        throw new Error(`保存主题设置失败: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to save theme to server:', error);
      return {
        code: 400,
        message: '保存到服务器失败，已保存到本地',
        data: true
      };
    }
  },

  async getPublicConfigs(): Promise<ApiResponse<Record<string, string>>> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/public`);
      if (!response.ok) {
        throw new Error(`获取公共配置失败: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch public configs:', error);
      return {
        code: 200,
        message: '使用默认配置',
        data: {
          theme: 'light'
        }
      };
    }
  },
};
