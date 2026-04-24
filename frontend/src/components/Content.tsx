import React from 'react';
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
  const handleNodeClick = (node: GraphNode) => {
    console.log('Node clicked:', node);
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    console.log('Edge clicked:', edge);
  };

  const handleSendMessage = (message: string) => {
    console.log('Message sent:', message);
  };

  return (
    <main className="content">
      <div className="content-layout">
        <div className="graph-section">
          <GraphView 
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
          />
        </div>
        
        <div className="chat-section">
          <AIChat 
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </main>
  );
}

export default Content;
