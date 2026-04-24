import './Content.css';

function Content() {
  return (
    <main className="content">
      <div className="content-header">
        <h1>欢迎使用 HXmind</h1>
        <p>您的智能知识管理系统</p>
      </div>
      <div className="content-body">
        <div className="welcome-card">
          <h2>开始探索</h2>
          <p>这里是您的知识管理中心，您可以：</p>
          <ul>
            <li>📚 创建和管理您的知识库</li>
            <li>🔍 快速搜索和定位知识内容</li>
            <li>📊 查看知识统计和分析</li>
            <li>⚙️ 自定义系统设置</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

export default Content;
