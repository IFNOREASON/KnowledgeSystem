import Header from './components/Header';
import LeftSider from './components/LeftSider';
import Content from './components/Content';
import AIChat from './components/AIChat';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Header />
      <LeftSider />
      <Content />
      <AIChat />
    </div>
  );
}

export default App;
