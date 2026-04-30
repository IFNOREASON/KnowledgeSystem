import { useState, useRef, useEffect, useCallback } from 'react';
import { fileApi, FileInfo, formatFileSize, getFileIcon } from '../api/fileApi';
import './LeftSider.css';

function LeftSider() {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');
  const [linkInput, setLinkInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [fileToView, setFileToView] = useState<FileInfo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fileApi.listFiles();
      if (response.code === 200) {
        setUploadedFiles(response.data || []);
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUpload(Array.from(files));
    }
  };

  const processUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setErrorMessage('');
    setSuccessMessage('');

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage(`文件 "${file.name}" 超过 50MB 限制`);
        continue;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const response = await fileApi.uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });

        if (response.code === 200) {
          setSuccessMessage(`文件 "${file.name}" 上传成功！`);
          loadFiles();
        } else {
          setErrorMessage(response.message || '上传失败');
        }
      } catch (error: any) {
        setErrorMessage(error.message || `上传 "${file.name}" 失败`);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLinkUpload = () => {
    if (!linkInput.trim()) return;
    setErrorMessage('链接上传功能暂未实现，请使用文件上传');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUpload(Array.from(files));
    }
  };

  const handleDeleteClick = (file: FileInfo) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      const response = await fileApi.deleteFile(fileToDelete.id);
      if (response.code === 200) {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
        setShowDeleteModal(false);
        setFileToDelete(null);
      } else {
        alert('删除失败: ' + response.message);
      }
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  const handleViewClick = (file: FileInfo) => {
    setFileToView(file);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setFileToView(null);
  };

  const handlePreviewFile = () => {
    if (fileToView?.accessUrl) {
      window.open(fileToView.accessUrl, '_blank');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStorageTypeLabel = (type: string) => {
    return type === 'minio' ? '☁️ MinIO' : '💾 本地';
  };

  return (
    <aside className="left-sider">
      <div className="upload-section">
        <div className="upload-header">
          <span className="upload-title">📤 上传文件</span>
          <div className="upload-method-tabs">
            <button
              className={`tab-btn ${uploadMethod === 'file' ? 'active' : ''}`}
              onClick={() => setUploadMethod('file')}
            >
              文件
            </button>
            <button
              className={`tab-btn ${uploadMethod === 'link' ? 'active' : ''}`}
              onClick={() => setUploadMethod('link')}
            >
              链接
            </button>
          </div>
        </div>

        {uploadMethod === 'file' ? (
          <>
            <div
              className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mov,.wmv,.mkv,.webm"
                className="file-input"
                onChange={handleFileSelect}
              />
              <div className="upload-icon">
                {isUploading ? '⏳' : '📁'}
              </div>
              <div className="upload-text">
                <p className="upload-main-text">
                  {isUploading ? `上传中... ${uploadProgress}%` : '点击或拖拽文件到此处'}
                </p>
                <p className="upload-sub-text">
                  支持 PDF/Word/PPT/Markdown/图片/视频 等（最大 50MB）
                </p>
              </div>
            </div>

            {isUploading && (
              <div className="upload-progress">
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
              <div className="file-success">✅ {successMessage}</div>
            )}
          </>
        ) : (
          <div className="link-upload-area">
            <div className="link-input-wrapper">
              <input
                type="text"
                className="link-input"
                placeholder="请输入链接地址..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLinkUpload()}
              />
              <button
                className="link-upload-btn"
                onClick={handleLinkUpload}
                disabled={!linkInput.trim()}
              >
                添加
              </button>
            </div>
            <p className="link-hint">支持网页链接、网盘链接等</p>
          </div>
        )}
      </div>

      <div className="file-list-section">
        <div className="file-list-header">
          <span className="file-list-title">📋 已上传文件</span>
          <span className="file-stats">
            <span className="file-count">{uploadedFiles.length} 个文件</span>
            <span className="file-size-total">
              {formatTotalSize(uploadedFiles.reduce((total, file) => total + (file.fileSize || 0), 0))}
            </span>
          </span>
        </div>

        <div className="file-list">
          {loading && (
            <div className="loading-more">
              <div className="loading-spinner"></div>
              <span>加载中...</span>
            </div>
          )}

          {!loading && uploadedFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>暂无上传的文件</p>
            </div>
          ) : (
            uploadedFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-icon">
                  {getFileIcon(file.contentType || '', file.fileExtension || '')}
                </div>
                <div className="file-info">
                  <div className="file-name" title={file.originalName}>
                    {file.originalName}
                  </div>
                  <div className="file-meta">
                    <span className="file-type">{getStorageTypeLabel(file.storageType || 'local')}</span>
                    <span className="file-size">{formatFileSize(file.fileSize || 0)}</span>
                    <span className="file-time">{formatDate(file.uploadTime)}</span>
                  </div>
                </div>
                <div className="file-actions">
                  {file.accessUrl && (
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewClick(file)}
                      title="预览/下载"
                    >
                      👁️
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteClick(file)}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⚠️ 确认删除</span>
              <button className="modal-close" onClick={cancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p className="delete-message">
                确定要删除文件 <span className="file-name-highlight">{fileToDelete?.originalName}</span> 吗？
              </p>
              <p className="delete-warning">此操作不可恢复，将同时删除 MinIO 中的文件。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cancelDelete}>取消</button>
              <button className="btn btn-danger" onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && fileToView && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="view-header-info">
                <span className="view-file-icon">
                  {getFileIcon(fileToView.contentType || '', fileToView.fileExtension || '')}
                </span>
                <div>
                  <span className="modal-title">{fileToView.originalName}</span>
                  <div className="view-file-meta">
                    <span>{formatFileSize(fileToView.fileSize || 0)}</span>
                    <span>·</span>
                    <span>{getStorageTypeLabel(fileToView.storageType || 'local')}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={closeViewModal}>×</button>
            </div>
            <div className="modal-body view-body">
              {fileToView.accessUrl ? (
                <div className="file-preview-info">
                  <div className="preview-actions">
                    <button
                      className="btn btn-primary preview-btn"
                      onClick={handlePreviewFile}
                    >
                      🔗 在新窗口打开
                    </button>
                  </div>
                  <div className="access-url-info">
                    <p className="url-label">访问链接：</p>
                    <p className="url-value">{fileToView.accessUrl}</p>
                  </div>
                </div>
              ) : (
                <div className="no-preview">
                  <p>该文件暂无预览链接</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={closeViewModal}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

const formatTotalSize = (bytes: number): string => {
  if (bytes === 0) return '0 MB';

  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;

  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  } else if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  } else if (kb >= 1) {
    return `${kb.toFixed(2)} KB`;
  } else {
    return `${bytes} Bytes`;
  }
};

export default LeftSider;
