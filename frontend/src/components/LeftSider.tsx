import { useState, useRef, useEffect, useCallback } from 'react';
import './LeftSider.css';

interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadTime: string;
  icon: string;
  isFavorite: boolean;
}

const generateMockFiles = (page: number, pageSize: number): FileItem[] => {
  const files: FileItem[] = [];
  const fileTypes = [
    { ext: 'docx', icon: '📄', type: 'Word文档' },
    { ext: 'pdf', icon: '📕', type: 'PDF文档' },
    { ext: 'txt', icon: '📝', type: '文本文件' },
    { ext: 'jpg', icon: '🖼️', type: '图片' },
    { ext: 'png', icon: '🖼️', type: '图片' },
    { ext: 'mp4', icon: '🎥', type: '视频' },
    { ext: 'link', icon: '🔗', type: '链接' },
  ];

  const startIndex = (page - 1) * pageSize;
  for (let i = 0; i < pageSize; i++) {
    const index = startIndex + i + 1;
    const fileType = fileTypes[index % fileTypes.length];
    const names = ['项目计划书', '技术文档', '用户手册', '产品需求', '设计规范', '会议记录', '培训资料', '数据分析', '市场报告', '竞品分析'];
    const name = names[index % names.length];

    files.push({
      id: index,
      name: `${name}_${index}.${fileType.ext}`,
      type: fileType.type,
      size: `${(Math.random() * 10 + 0.1).toFixed(2)} MB`,
      uploadTime: `2026-04-${(23 - (index % 23)).toString().padStart(2, '0')}`,
      icon: fileType.icon,
      isFavorite: index % 5 === 0,
    });
  }
  return files;
};

const parseFileSize = (sizeStr: string): number => {
  if (sizeStr === '-') return 0;
  const match = sizeStr.match(/^([\d.]+)\s*(MB|KB|GB|Bytes?)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case 'KB':
      return value * 1024;
    case 'MB':
      return value * 1024 * 1024;
    case 'GB':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
};

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

const generateFileContent = (file: FileItem): string => {
  if (file.type === '图片') {
    return '这是一张图片文件的预览内容。图片显示区域将在这里展示实际图片。';
  }
  if (file.type === '视频') {
    return '这是一个视频文件。视频播放器将在这里展示视频内容。';
  }
  if (file.type === '链接') {
    return `链接地址：${file.name}\n\n点击链接可以在新窗口打开网页。`;
  }
  if (file.type === 'PDF文档') {
    return `# ${file.name.replace('.pdf', '')}\n\n## 文档概述\n\n这是一份 PDF 文档的预览内容。\n\n## 主要内容\n\n1. 项目背景介绍\n2. 技术方案设计\n3. 实施计划安排\n4. 预期效果评估\n\n---\n\n*文档大小：${file.size}*\n*上传时间：${file.uploadTime}*`;
  }
  if (file.type === 'Word文档') {
    return `# ${file.name.replace('.docx', '').replace('.doc', '')}\n\n## 前言\n\n本文档详细描述了项目的整体规划和技术实现方案。\n\n## 第一章：项目概述\n\n### 1.1 项目背景\n\n随着业务的不断发展，我们需要建立一个高效的知识管理系统。\n\n### 1.2 项目目标\n\n- 实现文件的统一管理\n- 支持多种文件格式\n- 提供便捷的搜索功能\n\n## 第二章：技术架构\n\n采用前后端分离架构，前端使用 React，后端使用 RESTful API。`;
  }
  return `# ${file.name}\n\n这是一个文本文件的内容预览。\n\n## 内容摘要\n\n文件类型：${file.type}\n文件大小：${file.size}\n上传时间：${file.uploadTime}\n\n---\n\n这里是文件的具体内容...\n\n第一行内容\n第二行内容\n第三行内容\n...`;
};

function LeftSider() {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>('file');
  const [linkInput, setLinkInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [fileToView, setFileToView] = useState<FileItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;
  const totalPages = 5;

  useEffect(() => {
    loadFiles(1, true);
  }, []);

  const loadFiles = useCallback((page: number, isInitial: boolean = false) => {
    if (loading || (!hasMore && !isInitial)) return;

    setLoading(true);
    setTimeout(() => {
      const newFiles = generateMockFiles(page, pageSize);
      if (isInitial) {
        setUploadedFiles(newFiles);
      } else {
        setUploadedFiles(prev => [...prev, ...newFiles]);
      }
      setCurrentPage(page);
      setHasMore(page < totalPages);
      setLoading(false);
    }, 500);
  }, [loading, hasMore]);

  const handleScroll = useCallback(() => {
    if (!fileListRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = fileListRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      loadFiles(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, loadFiles]);

  useEffect(() => {
    const listElement = fileListRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUpload(Array.from(files));
    }
  };

  const processUpload = (files: File[]) => {
    const newFiles: FileItem[] = files.map((file, index) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let icon = '📄';
      let type = '文件';

      if (['docx', 'doc'].includes(ext)) {
        icon = '📄';
        type = 'Word文档';
      } else if (ext === 'pdf') {
        icon = '📕';
        type = 'PDF文档';
      } else if (ext === 'txt') {
        icon = '📝';
        type = '文本文件';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
        icon = '🖼️';
        type = '图片';
      } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(ext)) {
        icon = '🎥';
        type = '视频';
      }

      return {
        id: Date.now() + index,
        name: file.name,
        type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadTime: new Date().toISOString().split('T')[0],
        icon,
        isFavorite: false,
      };
    });

    setUploadedFiles(prev => [...newFiles, ...prev]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLinkUpload = () => {
    if (!linkInput.trim()) return;

    const newFile: FileItem = {
      id: Date.now(),
      name: linkInput.length > 30 ? linkInput.substring(0, 30) + '...' : linkInput,
      type: '链接',
      size: '-',
      uploadTime: new Date().toISOString().split('T')[0],
      icon: '🔗',
      isFavorite: false,
    };

    setUploadedFiles(prev => [newFile, ...prev]);
    setLinkInput('');
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

  const handleDeleteClick = (file: FileItem) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      setUploadedFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  const handleViewClick = (file: FileItem) => {
    setFileToView(file);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setFileToView(null);
  };

  const handleFavoriteClick = (fileId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f
      )
    );
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
              accept=".docx,.doc,.pdf,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.avi,.mov,.wmv,.mkv,.webm"
              className="file-input"
              onChange={handleFileSelect}
            />
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <p className="upload-main-text">点击或拖拽文件到此处</p>
              <p className="upload-sub-text">支持 docx、pdf、txt、图片、视频等</p>
            </div>
          </div>
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
              {formatTotalSize(uploadedFiles.reduce((total, file) => total + parseFileSize(file.size), 0))}
            </span>
          </span>
        </div>

        <div className="file-list" ref={fileListRef}>
          {uploadedFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>暂无上传的文件</p>
            </div>
          ) : (
            <>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-icon">{file.icon}</div>
                  <div className="file-info">
                    <div className="file-name" title={file.name}>
                      {file.isFavorite && <span className="favorite-indicator">⭐</span>}
                      {file.name}
                    </div>
                    <div className="file-meta">
                      <span className="file-type">{file.type}</span>
                      <span className="file-size">{file.size}</span>
                      <span className="file-time">{file.uploadTime}</span>
                    </div>
                  </div>
                  <div className="file-actions">
                    <button
                      className={`action-btn favorite-btn ${file.isFavorite ? 'active' : ''}`}
                      onClick={(e) => handleFavoriteClick(file.id, e)}
                      title={file.isFavorite ? '取消收藏' : '收藏'}
                    >
                      {file.isFavorite ? '⭐' : '☆'}
                    </button>
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewClick(file)}
                      title="查看"
                    >
                      👁️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteClick(file)}
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="loading-more">
                  <div className="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
              )}
              {!hasMore && uploadedFiles.length > 0 && (
                <div className="no-more">没有更多了</div>
              )}
            </>
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
                确定要删除文件 <span className="file-name-highlight">{fileToDelete?.name}</span> 吗？
              </p>
              <p className="delete-warning">此操作不可恢复，请谨慎操作。</p>
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
                <span className="view-file-icon">{fileToView.icon}</span>
                <div>
                  <span className="modal-title">{fileToView.name}</span>
                  <div className="view-file-meta">
                    <span>{fileToView.type}</span>
                    <span>·</span>
                    <span>{fileToView.size}</span>
                    <span>·</span>
                    <span>{fileToView.uploadTime}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={closeViewModal}>×</button>
            </div>
            <div className="modal-body view-body">
              <pre className="file-content">{generateFileContent(fileToView)}</pre>
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

export default LeftSider;
