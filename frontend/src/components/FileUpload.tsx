import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fileApi, FileInfo, formatFileSize, getFileIcon } from '../api/fileApi';
import './FileUpload.css';

interface FileUploadProps {}

const FileUpload: React.FC<FileUploadProps> = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fileApi.listFiles();
      if (response.code === 200) {
        setFiles(response.data || []);
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileSelect = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('文件大小不能超过 50MB');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setUploadedFileUrl('');
    setIsUploading(true);
    setUploadingFile(file.name);
    setUploadProgress(0);

    try {
      const response = await fileApi.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.code === 200) {
        setSuccessMessage(`文件 "${file.name}" 上传成功！`);
        setUploadedFileUrl(response.data.accessUrl);
        loadFiles();
      } else {
        setErrorMessage(response.message || '上传失败');
      }
    } catch (error: any) {
      setErrorMessage(error.message || '上传失败，请稍后重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadingFile('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!window.confirm(`确定要删除文件 "${fileName}" 吗？`)) {
      return;
    }

    try {
      const response = await fileApi.deleteFile(fileId);
      if (response.code === 200) {
        loadFiles();
      } else {
        alert('删除失败: ' + response.message);
      }
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handlePreviewFile = (fileInfo: FileInfo) => {
    if (fileInfo.accessUrl) {
      window.open(fileInfo.accessUrl, '_blank');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-header">
        <h2>
          <span>📁</span>
          文件管理
        </h2>
        <div className="file-upload-actions">
          <button
            className="refresh-btn"
            onClick={loadFiles}
            disabled={isRefreshing}
          >
            <svg
              className={isRefreshing ? 'loading' : ''}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.5 2V6.5H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.032 11.5C18.654 15.064 15.646 17.76 12.002 17.76C8.35788 17.76 5.35018 15.064 4.97188 11.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.96875 12.5C5.34695 8.93604 8.35465 6.24 11.9988 6.24C13.6438 6.24 15.1627 6.8703 16.321 7.90002"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            刷新
          </button>
        </div>
      </div>

      <div className="file-upload-content">
        <div className="upload-area">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={false}
              onChange={handleInputChange}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mpeg,.mov,.wmv,.flv,.webm"
            />
            <div className="upload-icon">📤</div>
            <div className="upload-text">
              {isUploading ? '上传中...' : '点击选择文件或拖拽文件到此处'}
            </div>
            <div className="upload-hint">
              支持：文档（PDF/DOC/DOCX/PPT/PPTX/MD/TXT）、图片、视频（最大 50MB）
            </div>
          </div>

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-header">
                <span className="progress-filename">{uploadingFile}</span>
                <span className="progress-percent">{uploadProgress}%</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="file-error">❌ {errorMessage}</div>
          )}

          {successMessage && (
            <div className="file-success">
              <span>✅ {successMessage}</span>
              {uploadedFileUrl && (
                <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">
                  预览文件 →
                </a>
              )}
            </div>
          )}
        </div>

        <div className="file-list-container">
          <div className="file-list-header">
            <span className="file-list-title">已上传文件</span>
            <span className="file-list-count">共 {files.length} 个文件</span>
          </div>

          {files.length === 0 ? (
            <div className="file-list-empty">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 21H17C18.6569 21 20 19.6569 20 18V8L14 2H7C5.34315 2 4 3.34315 4 5V18C4 19.6569 5.34315 21 7 21Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2V8H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 13H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 17H12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>暂无上传的文件</p>
            </div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-icon">
                  {getFileIcon(file.contentType || '', file.fileExtension || '')}
                </div>
                <div className="file-info">
                  <div className="file-name" title={file.originalName}>
                    {file.originalName}
                  </div>
                  <div className="file-meta">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>{formatDate(file.uploadTime)}</span>
                    <span className="file-storage">
                      {file.storageType === 'minio' ? '☁️ MinIO' : '💾 本地'}
                    </span>
                  </div>
                </div>
                <div className="file-actions">
                  {file.accessUrl && (
                    <button
                      className="file-action-btn"
                      onClick={() => handlePreviewFile(file)}
                      title="预览/下载"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    className="file-action-btn delete"
                    onClick={() => handleDeleteFile(file.id, file.originalName)}
                    title="删除"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 6H5H21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
