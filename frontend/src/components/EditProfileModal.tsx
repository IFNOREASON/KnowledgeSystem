import { useState } from 'react';
import { userApi } from '../api/userApi';
import type { User, UpdateUserParams } from '../types/user';
import './EditProfileModal.css';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProfileModal({ user, onClose, onSuccess }: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateUserParams>({
    nickname: user.nickname || '',
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
    gender: user.gender || 0,
    birthday: user.birthday || '',
    bio: user.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof UpdateUserParams, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateParams: UpdateUserParams = {};
      
      if (formData.nickname !== undefined && formData.nickname !== (user.nickname || '')) {
        updateParams.nickname = formData.nickname;
      }
      if (formData.email !== undefined && formData.email !== (user.email || '')) {
        updateParams.email = formData.email;
      }
      if (formData.phone !== undefined && formData.phone !== (user.phone || '')) {
        updateParams.phone = formData.phone;
      }
      if (formData.avatar !== undefined && formData.avatar !== (user.avatar || '')) {
        updateParams.avatar = formData.avatar;
      }
      if (formData.gender !== undefined && formData.gender !== (user.gender || 0)) {
        updateParams.gender = formData.gender;
      }
      if (formData.birthday !== undefined && formData.birthday !== (user.birthday || '')) {
        updateParams.birthday = formData.birthday;
      }
      if (formData.bio !== undefined && formData.bio !== (user.bio || '')) {
        updateParams.bio = formData.bio;
      }

      if (Object.keys(updateParams).length === 0) {
        alert('没有需要更新的内容');
        setLoading(false);
        return;
      }

      const response = await userApi.updateUserInfo(user.id, updateParams);
      
      if (response.code === 200) {
        alert('资料更新成功');
        onSuccess();
        onClose();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新资料失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3 className="edit-modal-title">编辑资料</h3>
          <button className="edit-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="edit-modal-form" onSubmit={handleSubmit}>
          <div className="edit-modal-content">
            {error && (
              <div className="edit-modal-error">
                {error}
              </div>
            )}

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">昵称</label>
              <input
                type="text"
                className="edit-modal-input"
                value={formData.nickname || ''}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                placeholder="请输入昵称"
                maxLength={50}
              />
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">邮箱</label>
              <input
                type="email"
                className="edit-modal-input"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="请输入邮箱"
                maxLength={100}
              />
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">手机号</label>
              <input
                type="tel"
                className="edit-modal-input"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="请输入手机号"
                maxLength={20}
              />
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">头像URL</label>
              <input
                type="url"
                className="edit-modal-input"
                value={formData.avatar || ''}
                onChange={(e) => handleInputChange('avatar', e.target.value)}
                placeholder="请输入头像URL"
                maxLength={500}
              />
              {formData.avatar && (
                <div className="edit-modal-avatar-preview">
                  <img
                    src={formData.avatar}
                    alt="头像预览"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">性别</label>
              <select
                className="edit-modal-select"
                value={formData.gender || 0}
                onChange={(e) => handleInputChange('gender', parseInt(e.target.value))}
              >
                <option value={0}>未设置</option>
                <option value={1}>男</option>
                <option value={2}>女</option>
              </select>
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">生日</label>
              <input
                type="date"
                className="edit-modal-input"
                value={formData.birthday || ''}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
              />
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">个人简介</label>
              <textarea
                className="edit-modal-textarea"
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="介绍一下自己..."
                maxLength={500}
                rows={4}
              />
              <span className="edit-modal-char-count">
                {(formData.bio || '').length}/500
              </span>
            </div>
          </div>

          <div className="edit-modal-footer">
            <button
              type="button"
              className="edit-modal-btn secondary"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="edit-modal-btn primary"
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
