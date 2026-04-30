import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import UserProfile from './UserProfile';
import './Header.css';

function Header() {
  const [showProfile, setShowProfile] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const CURRENT_USER_ID = 1;

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">HX</div>
          </div>
          <span className="system-name">HXmind</span>
        </div>
        <div className="header-right">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            <span className="theme-icon">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          </button>
          <div 
            className="user-avatar"
            onClick={() => setShowProfile(true)}
            title="点击打开个人中心"
          >
            <img 
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=simple%20user%20avatar%20icon%20minimalist%20design&image_size=square" 
              alt="User Avatar" 
            />
          </div>
        </div>
      </header>

      {showProfile && (
        <UserProfile
          userId={CURRENT_USER_ID}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

export default Header;
