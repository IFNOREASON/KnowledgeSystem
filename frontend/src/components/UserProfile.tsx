import { useEffect, useState } from 'react';
import { userApi } from '../api/userApi';
import type { User, ExportData } from '../types/user';
import EditProfileModal from './EditProfileModal';
import './UserProfile.css';

interface UserProfileProps {
  userId: number;
  onClose: () => void;
  onUserUpdated?: () => void;
}

function UserProfile({ userId, onClose, onUserUpdated }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getUserInfo(userId);
      if (response.code === 200) {
        setUser(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, [userId]);

  const handleEditSuccess = () => {
    loadUserInfo();
    onUserUpdated?.();
  };

  const handleExportPreview = async () => {
    try {
      const response = await userApi.getExportPreview(userId);
      if (response.code === 200) {
        setExportData(response.data);
        setShowExportPreview(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '获取导出预览失败');
    }
  };

  const handleExport = async () => {
    try {
      await userApi.exportUserData(userId);
    } catch (err) {
      alert(err instanceof Error ? err.message : '导出数据失败');
    }
  };

  const handleClearData = async () => {
    if (!confirm('确定要清除个人数据吗？此操作将清空您的昵称、邮箱、电话、头像、生日和个人简介，且无法恢复。')) {
      return;
    }
    try {
      const response = await userApi.clearUserData(userId);
      if (response.code === 200) {
        alert('个人数据已清除');
        loadUserInfo();
        onUserUpdated?.();
      } else {
        alert(response.message);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '清除数据失败');
    }
  };

  const getGenderText = (gender?: number) => {
    switch (gender) {
      case 1:
        return '男';
      case 2:
        return '女';
      default:
        return '未设置';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置';
    return dateString.split('T')[0];
  };

  if (loading) {
    return (
      <div className="user-profile-overlay" onClick={onClose}>
        <div className="user-profile-container" onClick={(e) => e.stopPropagation()}>
          <div className="user-profile-loading">加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-profile-overlay" onClick={onClose}>
        <div className="user-profile-container" onClick={(e) => e.stopPropagation()}>
          <div className="user-profile-error">{error || '用户不存在'}</div>
          <button className="user-profile-close-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-container" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <h2 className="user-profile-title">个人中心</h2>
          <button className="user-profile-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="user-profile-content">
          <div className="user-profile-avatar-section">
            <img
              src={user.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=simple%20user%20avatar%20icon%20minimalist%20design&image_size=square'}
              alt="用户头像"
              className="user-profile-avatar"
            />
            <div className="user-profile-basic">
              <h3 className="user-profile-nickname">{user.nickname || user.username}</h3>
              <p className="user-profile-username">@{user.username}</p>
            </div>
          </div>

          <div className="user-profile-info-section">
            <h4 className="user-profile-section-title">基本信息</h4>
            <div className="user-profile-info-list">
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">昵称</span>
                <span className="user-profile-info-value">{user.nickname || '未设置'}</span>
              </div>
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">邮箱</span>
                <span className="user-profile-info-value">{user.email || '未设置'}</span>
              </div>
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">手机号</span>
                <span className="user-profile-info-value">{user.phone || '未设置'}</span>
              </div>
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">性别</span>
                <span className="user-profile-info-value">{getGenderText(user.gender)}</span>
              </div>
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">生日</span>
                <span className="user-profile-info-value">{formatDate(user.birthday)}</span>
              </div>
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">个人简介</span>
                <span className="user-profile-info-value">{user.bio || '未设置'}</span>
              </div>
            </div>
          </div>

          <div className="user-profile-info-section">
            <h4 className="user-profile-section-title">账户信息</h4>
            <div className="user-profile-info-list">
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">注册时间</span>
                <span className="user-profile-info-value">{formatDate(user.createTime)}</span>
              </div>
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">最后登录</span>
                <span className="user-profile-info-value">{formatDate(user.lastLoginTime)}</span>
              </div>
              <div className="user-profile-info-item">
                <span className="user-profile-info-label">账户状态</span>
                <span className={`user-profile-info-value ${user.status === 1 ? 'status-active' : 'status-disabled'}`}>
                  {user.status === 1 ? '正常' : '禁用'}
                </span>
              </div>
            </div>
          </div>

          <div className="user-profile-actions">
            <button
              className="user-profile-action-btn primary"
              onClick={() => setShowEditModal(true)}
            >
              编辑资料
            </button>
            <button
              className="user-profile-action-btn secondary"
              onClick={handleExportPreview}
            >
              预览数据
            </button>
            <button
              className="user-profile-action-btn secondary"
              onClick={handleExport}
            >
              导出数据
            </button>
            <button
              className="user-profile-action-btn danger"
              onClick={handleClearData}
            >
              清除数据
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showExportPreview && exportData && (
        <div className="export-preview-overlay" onClick={() => setShowExportPreview(false)}>
          <div className="export-preview-container" onClick={(e) => e.stopPropagation()}>
            <div className="export-preview-header">
              <h3 className="export-preview-title">数据导出预览</h3>
              <button
                className="export-preview-close-btn"
                onClick={() => setShowExportPreview(false)}
              >
                ×
              </button>
            </div>
            <div className="export-preview-content">
              <pre className="export-preview-json">
                {JSON.stringify(exportData, null, 2)}
              </pre>
            </div>
            <div className="export-preview-footer">
              <button
                className="export-preview-btn secondary"
                onClick={() => setShowExportPreview(false)}
              >
                关闭
              </button>
              <button
                className="export-preview-btn primary"
                onClick={() => {
                  handleExport();
                  setShowExportPreview(false);
                }}
              >
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
