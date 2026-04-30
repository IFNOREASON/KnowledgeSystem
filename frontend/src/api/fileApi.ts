const API_BASE_URL = '/api';

export interface FileInfo {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  fileExtension: string;
  md5: string;
  storageType: string;
  bucketName: string;
  objectName: string;
  accessUrl: string;
  uploadTime: string;
  updateTime: string;
  deleted: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const fileApi = {
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<FileInfo>> {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.open('POST', `${API_BASE_URL}/files/upload`);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('解析响应失败'));
          }
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('上传被取消'));
      });

      xhr.send(formData);
    });
  },

  async getFileInfo(fileId: number): Promise<ApiResponse<FileInfo>> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`);
    if (!response.ok) {
      throw new Error(`获取文件详情失败: ${response.status}`);
    }
    return await response.json();
  },

  async deleteFile(fileId: number): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`删除文件失败: ${response.status}`);
    }
    return await response.json();
  },

  async listFiles(): Promise<ApiResponse<FileInfo[]>> {
    const response = await fetch(`${API_BASE_URL}/files`);
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.status}`);
    }
    return await response.json();
  },

  async renameFile(fileId: number, newName: string): Promise<ApiResponse<FileInfo>> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newName }),
    });
    if (!response.ok) {
      throw new Error(`重命名文件失败: ${response.status}`);
    }
    return await response.json();
  },
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (contentType: string, extension: string): string => {
  const ext = extension.toLowerCase().replace('.', '');
  
  if (contentType?.startsWith('image/')) {
    return '🖼️';
  }
  if (contentType?.startsWith('video/')) {
    return '🎬';
  }
  
  const docTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'md', 'txt'];
  if (docTypes.includes(ext)) {
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'md': return '📋';
      case 'txt': return '📃';
      default: return '📁';
    }
  }
  
  return '📁';
};

export enum PreviewType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  TEXT = 'text',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export const getPreviewType = (contentType: string, extension: string): PreviewType => {
  const ext = extension.toLowerCase().replace('.', '');
  
  if (contentType?.startsWith('image/')) {
    return PreviewType.IMAGE;
  }
  if (contentType?.startsWith('video/')) {
    return PreviewType.VIDEO;
  }
  if (contentType === 'application/pdf' || ext === 'pdf') {
    return PreviewType.PDF;
  }
  
  const docTypes = ['doc', 'docx'];
  if (docTypes.includes(ext)) {
    return PreviewType.DOCUMENT;
  }
  
  const textTypes = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx'];
  if (textTypes.includes(ext)) {
    return PreviewType.TEXT;
  }
  
  return PreviewType.OTHER;
};
