import type { User, ApiResponse, UpdateUserParams, ExportData } from '../types/user';

const API_BASE_URL = 'http://localhost:8080/api';

export const userApi = {
  async getUserInfo(userId: number): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) {
      throw new Error(`获取用户信息失败: ${response.status}`);
    }
    return await response.json();
  },

  async updateUserInfo(userId: number, params: UpdateUserParams): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`更新用户信息失败: ${response.status}`);
    }
    return await response.json();
  },

  async clearUserData(userId: number): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/clear-data`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`清理用户数据失败: ${response.status}`);
    }
    return await response.json();
  },

  async getExportPreview(userId: number): Promise<ApiResponse<ExportData>> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/export-preview`);
    if (!response.ok) {
      throw new Error(`获取导出预览失败: ${response.status}`);
    }
    return await response.json();
  },

  async exportUserData(userId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/export`);
    if (!response.ok) {
      throw new Error(`导出用户数据失败: ${response.status}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = Date.now();
    a.download = `user-data-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
