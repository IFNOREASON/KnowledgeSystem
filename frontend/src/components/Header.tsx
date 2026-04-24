import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">HX</div>
        </div>
        <span className="system-name">HXmind</span>
      </div>
      <div className="header-right">
        <div className="user-avatar">
          <img 
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=simple%20user%20avatar%20icon%20minimalist%20design&image_size=square" 
            alt="User Avatar" 
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
