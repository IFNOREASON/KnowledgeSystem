import React, { useState, useCallback, useRef } from 'react';
import GraphView from './GraphView';
import AIChat from './AIChat';
import './Content.css';

interface ExtendedData {
  [key: string]: any;
}

interface GraphNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  cluster?: string;
  extendedData?: ExtendedData;
  [key: string]: any;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  extendedData?: ExtendedData;
  [key: string]: any;
}

function Content() {
  const [chatHeight, setChatHeight] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleNodeClick = (node: GraphNode) => {
    console.log('Node clicked:', node);
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    console.log('Edge clicked:', edge);
  };

  const handleSendMessage = (message: string) => {
    console.log('Message sent:', message);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = chatHeight;
    e.preventDefault();
  }, [chatHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const deltaY = startYRef.current - e.clientY;
    const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 200), 500);
    setChatHeight(newHeight);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <main className="content">
      <div className="content-layout">
        <div className="graph-section">
          <GraphView 
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
          />
        </div>
        
        <div 
          className="resize-handle" 
          onMouseDown={handleMouseDown}
          title="拖拽调整高度"
        >
          <div className="resize-indicator" />
        </div>
        
        <div 
          className="chat-section" 
          style={{ height: `${chatHeight}px` }}
        >
          <AIChat 
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </main>
  );
}

export default Content;
