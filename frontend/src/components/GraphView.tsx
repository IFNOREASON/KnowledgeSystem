import React, { useEffect, useRef, useState } from 'react';
import { Graph as G6Graph, IGraph } from '@antv/g6';
import './GraphView.css';

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

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphViewProps {
  data?: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

const defaultData: GraphData = {
  nodes: [
    { id: 'node1', label: '概念A', cluster: 'cluster1', extendedData: { type: '核心概念', description: '这是一个核心概念节点', tags: ['基础', '重要'] } },
    { id: 'node2', label: '概念B', cluster: 'cluster1', extendedData: { type: '子概念', description: '与概念A相关的子概念', tags: ['衍生'] } },
    { id: 'node3', label: '概念C', cluster: 'cluster2', extendedData: { type: '实例', description: '概念的具体实例', tags: ['实践'] } },
    { id: 'node4', label: '概念D', cluster: 'cluster2', extendedData: { type: '案例', description: '实际应用案例', tags: ['应用'] } },
    { id: 'node5', label: '概念E', cluster: 'cluster3', extendedData: { type: '扩展', description: '扩展知识节点', tags: ['高级'] } },
  ],
  edges: [
    { source: 'node1', target: 'node2', label: '包含', extendedData: { relation: '父子关系', confidence: 0.95 } },
    { source: 'node1', target: 'node3', label: '关联', extendedData: { relation: '关联关系', confidence: 0.80 } },
    { source: 'node2', target: 'node4', label: '引用', extendedData: { relation: '引用关系', confidence: 0.75 } },
    { source: 'node3', target: 'node5', label: '扩展', extendedData: { relation: '扩展关系', confidence: 0.85 } },
    { source: 'node1', target: 'node5', label: '相关', extendedData: { relation: '相关关系', confidence: 0.70 } },
  ],
};

const GraphView: React.FC<GraphViewProps> = ({ 
  data,
  onNodeClick,
  onEdgeClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<IGraph | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'node' | 'edge'; item: GraphNode | GraphEdge } | null>(null);
  const graphData = data || defaultData;

  useEffect(() => {
    if (!containerRef.current || graphRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const graph = new G6Graph({
      container: containerRef.current,
      data: graphData,
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      plugins: [
        {
          key: 'minimap',
          type: 'minimap',
          position: 'right-bottom',
          size: [200, 140],
        },
      ],
      node: {
        style: {
          labelText: (d: any) => d.label || d.id,
          labelFontSize: 14,
          labelFill: '#000000',
          lineWidth: 2,
        },
        palette: {
          type: 'group',
          field: 'cluster',
        },
      },
      edge: {
        style: {
          labelText: (d: any) => d.label || '',
          labelFontSize: 12,
          labelFill: '#666',
          lineWidth: 2,
          endArrow: true,
        },
      },
      layout: {
        type: 'force',
        linkDistance: 100,
        clustering: true,
        nodeClusterBy: 'cluster',
        clusterNodeStrength: 70,
      },
    });

    graphRef.current = graph;

    graph.render().then(() => {
      console.log('Graph rendered successfully');
    }).catch((error) => {
      console.warn('Graph render error:', error);
    });

    const safeGraphOperation = <T,>(operation: () => T, fallback?: T): T | undefined => {
      try {
        return operation();
      } catch (error) {
        console.warn('Graph operation error:', error);
        return fallback;
      }
    };

    graph.on('node:click', (evt) => {
      const { item } = evt;
      if (!item) return;

      const model = item.getModel() as GraphNode;
      
      safeGraphOperation(() => {
        graph.getNodes().forEach((node) => {
          graph.clearItemStates(node);
        });
        graph.getEdges().forEach((edge) => {
          graph.clearItemStates(edge);
        });
        
        graph.setItemState(item, 'selected', true);
      });
      
      setSelectedItem({ type: 'node', item: model });
      
      if (onNodeClick) {
        onNodeClick(model);
      }
    });

    graph.on('edge:click', (evt) => {
      const { item } = evt;
      if (!item) return;

      const model = item.getModel() as GraphEdge;
      
      safeGraphOperation(() => {
        graph.getNodes().forEach((node) => {
          graph.clearItemStates(node);
        });
        graph.getEdges().forEach((edge) => {
          graph.clearItemStates(edge);
        });
        
        graph.setItemState(item, 'selected', true);
      });
      
      setSelectedItem({ type: 'edge', item: model });
      
      if (onEdgeClick) {
        onEdgeClick(model);
      }
    });

    graph.on('node:mouseenter', (evt) => {
      const { item } = evt;
      if (item) {
        safeGraphOperation(() => {
          graph.setItemState(item, 'hover', true);
        });
      }
    });

    graph.on('node:mouseleave', (evt) => {
      const { item } = evt;
      if (item) {
        safeGraphOperation(() => {
          graph.setItemState(item, 'hover', false);
        });
      }
    });

    graph.on('edge:mouseenter', (evt) => {
      const { item } = evt;
      if (item) {
        safeGraphOperation(() => {
          graph.setItemState(item, 'hover', true);
        });
      }
    });

    graph.on('edge:mouseleave', (evt) => {
      const { item } = evt;
      if (item) {
        safeGraphOperation(() => {
          graph.setItemState(item, 'hover', false);
        });
      }
    });

    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        safeGraphOperation(() => {
          if (typeof graphRef.current?.setSize === 'function') {
            graphRef.current.setSize(newWidth, newHeight);
          }
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [graphData, onNodeClick, onEdgeClick]);

  const renderExtendedData = (extendedData?: ExtendedData) => {
    if (!extendedData || Object.keys(extendedData).length === 0) {
      return <p className="no-data">暂无扩展数据</p>;
    }

    return (
      <div className="extended-data-list">
        {Object.entries(extendedData).map(([key, value], index) => (
          <div key={index} className="extended-data-item">
            <span className="data-key">{key}:</span>
            <span className="data-value">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderLegend = () => {
    return (
      <div className="graph-legend">
        <div className="legend-title">操作说明</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-icon drag-node-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14 6H10L12 2Z" fill="currentColor"/>
                <path d="M12 22L14 18H10L12 22Z" fill="currentColor"/>
                <path d="M2 12L6 14V10L2 12Z" fill="currentColor"/>
                <path d="M22 12L18 14V10L22 12Z" fill="currentColor"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="legend-text">拖动节点</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon drag-canvas-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14 6H10L12 2Z" fill="currentColor"/>
                <path d="M12 22L14 18H10L12 22Z" fill="currentColor"/>
                <path d="M2 12L6 14V10L2 12Z" fill="currentColor"/>
                <path d="M22 12L18 14V10L22 12Z" fill="currentColor"/>
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="legend-text">拖动画布</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon zoom-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M11 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="legend-text">滚轮缩放</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon click-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L12 12M12 12L9 9M12 12L15 9M12 12L9 15M12 12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="legend-text">点击查看详情</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon reset-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 12C3 14.75 4.5 18.5 9 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 12L6 9L3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="legend-text">重置视图</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon fit-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 7H11V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 17H13V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 7H13V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 17H11V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="legend-text">适应视图</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="graph-view-container">
      <div className="graph-header">
        <h3>知识图谱视图</h3>
        <div className="graph-controls">
          <button 
            onClick={() => graphRef.current?.zoomTo(1)}
            className="control-btn"
            title="重置缩放"
          >
            重置
          </button>
          <button 
            onClick={() => graphRef.current?.fitView()}
            className="control-btn"
            title="适应视图"
          >
            适应
          </button>
        </div>
      </div>
      
      {renderLegend()}
      
      <div className="graph-content">
        <div 
          ref={containerRef} 
          className="graph-container"
        />
        
        {selectedItem && (
          <div className="data-panel">
            <div className="panel-header">
              <h4>
                {selectedItem.type === 'node' ? '节点详情' : '边详情'}
              </h4>
              <button 
                className="close-btn"
                onClick={() => setSelectedItem(null)}
              >
                ×
              </button>
            </div>
            
            <div className="panel-body">
              <div className="basic-info">
                <h5>基本信息</h5>
                {selectedItem.type === 'node' ? (
                  <div>
                    <div className="info-item">
                      <span className="info-label">ID:</span>
                      <span className="info-value">{selectedItem.item.id}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">标签:</span>
                      <span className="info-value">{selectedItem.item.label}</span>
                    </div>
                    {selectedItem.item.cluster && (
                      <div className="info-item">
                        <span className="info-label">集群:</span>
                        <span className="info-value">{selectedItem.item.cluster}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="info-item">
                      <span className="info-label">源节点:</span>
                      <span className="info-value">{selectedItem.item.source}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">目标节点:</span>
                      <span className="info-value">{selectedItem.item.target}</span>
                    </div>
                    {selectedItem.item.label && (
                      <div className="info-item">
                        <span className="info-label">关系:</span>
                        <span className="info-value">{selectedItem.item.label}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="extended-info">
                <h5>扩展数据</h5>
                {renderExtendedData(
                  selectedItem.type === 'node' 
                    ? selectedItem.item.extendedData 
                    : selectedItem.item.extendedData
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphView;
