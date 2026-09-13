'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MindmapData, MindmapNode } from '@/types/feynman';
import { Network, ZoomIn, ZoomOut, RotateCcw, X, Info, Maximize2, Minimize2, LayoutGrid, ArrowDown, ArrowRightLeft, Sparkles, Loader2, FolderOpen, FolderMinus, Eye } from 'lucide-react';
import MindElixir from 'mind-elixir';
import 'mind-elixir/style.css';

interface FeynmanMindmapProps {
  data: MindmapData;
  structuredNote?: any;
  onUpdateMindmap?: (newMindmap: MindmapData) => void;
}

function getNodeIcon(label: string, category?: string): string {
  if (
    label.startsWith('🎯') ||
    label.startsWith('💡') ||
    label.startsWith('🔍') ||
    label.startsWith('⚡') ||
    label.startsWith('🛠️') ||
    label.startsWith('🌟') ||
    label.startsWith('⚠️')
  ) {
    return '';
  }
  const lower = label.toLowerCase();
  if (category === 'root') return '🎯 ';
  if (category === 'core') return '💡 ';
  if (lower.includes('mẹo') || lower.includes('kỹ thuật') || lower.includes('tính nhẩm')) return '⚡ ';
  if (lower.includes('lỗi') || lower.includes('bẫy') || lower.includes('lưu ý') || lower.includes('tránh')) return '⚠️ ';
  if (category === 'application' || lower.includes('ứng dụng') || lower.includes('thực tế') || lower.includes('bài tập')) return '🛠️ ';
  return '🔍 ';
}

export const FeynmanMindmap: React.FC<FeynmanMindmapProps> = ({ data, structuredNote, onUpdateMindmap }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindElixirInstanceRef = useRef<MindElixir | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [directionMode, setDirectionMode] = useState<number>(2); // 2: MindElixir.SIDE (Tỏa 2 bên), 3: MindElixir.DOWN (Dọc)
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState<boolean>(false); // false: Level 1 + Level 2 (huge crisp text), true: All 75+ nodes
  const [currentScale, setCurrentScale] = useState<number>(0.85);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let isUnmounted = false;

    let rootObj: any = null;
    let arrowsList: any[] = [];

    // Check if data is already in MindElixir hierarchical nodeData format
    if ((data as any).nodeData && (data as any).nodeData.topic) {
      rootObj = JSON.parse(JSON.stringify((data as any).nodeData));
      arrowsList = (data as any).arrows || [];

      // Smart Level Expansion:
      // When showAllDetails is false:
      // If root has >= 5 branches (e.g. 12 tenses at level 1), only root is expanded (depth === 0).
      // The 12 tenses are visible, and their detail formulas are folded with (+) badge!
      // If root has <= 4 branches (e.g. 3-4 groups), expand root and level 1 (depth <= 1),
      // so the 12 tenses are visible, and their detail formulas are folded with (+) badge!
      // This guarantees that in ALL cases, only 10-16 concept nodes are visible on screen,
      // allowing the view to render at 100% full scale with huge, crisp 17-24px fonts!
      const rootBranchesCount = (rootObj.children && Array.isArray(rootObj.children)) ? rootObj.children.length : 0;
      const maxExpandedDepth = rootBranchesCount >= 5 ? 0 : 1;

      const prepareTree = (node: any, depth: number = 0) => {
        if (!node) return;
        node.expanded = showAllDetails ? true : depth <= maxExpandedDepth;
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => prepareTree(child, depth + 1));
        }
      };
      prepareTree(rootObj, 0);
    } else if (data.nodes && data.nodes.length > 0) {
      // Legacy conversion: Convert MindmapData { nodes, edges } into MindElixir hierarchical tree format
      const rootNode = data.nodes.find((n) => n.category === 'root' || n.id === 'node-root') || data.nodes[0];
      if (!rootNode) return;

      const nodeMap = new Map<string, MindmapNode>();
      data.nodes.forEach((n) => nodeMap.set(n.id, n));

      const childrenMap = new Map<string, string[]>();
      data.edges.forEach((e) => {
        if (!childrenMap.has(e.from)) childrenMap.set(e.from, []);
        childrenMap.get(e.from)!.push(e.to);
      });

      const rootNodeChildCount = childrenMap.get(rootNode.id)?.length || 0;
      const maxLegacyExpandedDepth = rootNodeChildCount >= 5 ? 0 : 1;

      const visited = new Set<string>();

      function buildTree(nodeId: string, depth: number = 0): any {
        visited.add(nodeId);
        const rawNode = nodeMap.get(nodeId);
        const childIds = childrenMap.get(nodeId) || [];

        const childrenNodes: any[] = [];
        childIds.forEach((cid) => {
          if (!visited.has(cid) && nodeMap.has(cid)) {
            childrenNodes.push(buildTree(cid, depth + 1));
          }
        });

        const icon = getNodeIcon(rawNode?.label || '', rawNode?.category);
        const displayLabel = `${icon}${rawNode?.label || 'Khái niệm'}`;

        return {
          id: nodeId,
          topic: displayLabel,
          expanded: showAllDetails ? true : depth <= maxLegacyExpandedDepth,
          children: childrenNodes.length > 0 ? childrenNodes : undefined,
          feynmanExplanation: rawNode?.feynmanExplanation || '',
          category: rawNode?.category || 'detail'
        };
      }

      rootObj = buildTree(rootNode.id, 0);

      // Attach any unvisited nodes under root
      data.nodes.forEach((n) => {
        if (!visited.has(n.id)) {
          if (!rootObj.children) rootObj.children = [];
          const icon = getNodeIcon(n.label, n.category);
          rootObj.children.push({
            id: n.id,
            topic: `${icon}${n.label}`,
            expanded: showAllDetails,
            feynmanExplanation: n.feynmanExplanation,
            category: n.category
          });
        }
      });
    }

    if (!rootObj) return;

    // Buzan Mindmap Vibrant Palette (Mỗi nhánh chính 1 màu riêng biệt, tương phản cao, dễ phân biệt và dễ đọc)
    const BUZAN_BRANCH_COLORS = [
      '#C2410C', // Cam cháy đậm đà (Buzan Deep Warm Orange)
      '#1D4ED8', // Xanh dương đậm hoàng gia (Buzan Royal Blue)
      '#BE185D', // Hồng cánh sen đậm (Buzan Deep Magenta)
      '#047857', // Xanh lục ngọc bảo đậm (Buzan Emerald Green)
      '#6D28D9', // Tím thạch anh đậm (Buzan Deep Violet)
      '#B91C1C', // Đỏ san hô đậm (Buzan Crimson Red)
      '#0E7490', // Xanh mòng két đậm (Buzan Deep Teal/Cyan)
      '#B45309', // Vàng hổ phách đậm (Buzan Deep Amber Gold)
    ];

    // Apply Buzan Color Inheritance: Mỗi nhánh chính 1 màu, các node con kế thừa cùng tông màu
    if (rootObj.children && Array.isArray(rootObj.children)) {
      rootObj.children.forEach((childNode: any, idx: number) => {
        const branchColor = BUZAN_BRANCH_COLORS[idx % BUZAN_BRANCH_COLORS.length];
        childNode.branchColor = branchColor;
        childNode.style = {
          color: branchColor,
          fontWeight: '800'
        };

        function applySubTreeColor(subNode: any, depth: number = 2) {
          if (!subNode) return;
          subNode.branchColor = branchColor;
          subNode.style = {
            color: branchColor,
            fontWeight: depth === 2 ? '700' : '600'
          };
          if (subNode.children && Array.isArray(subNode.children)) {
            subNode.children.forEach((child: any) => applySubTreeColor(child, depth + 1));
          }
        }

        if (childNode.children && Array.isArray(childNode.children)) {
          childNode.children.forEach((child: any) => applySubTreeColor(child, 2));
        }
      });
    }

    // Clear previous DOM container content before initializing
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const vibrantOrganicTheme = {
      name: 'Feynman Buzan Organic',
      palette: BUZAN_BRANCH_COLORS,
      cssVar: {
        '--node-gap-x': '22px',
        '--node-gap-y': '12px',
        '--main-gap-x': '42px',
        '--main-gap-y': '30px',
        '--main-color': '#0F172A',
        '--main-bgcolor': '#FFFFFF',
        '--main-bgcolor-transparent': 'rgba(255, 255, 255, 0.85)',
        '--color': '#0F172A',
        '--bgcolor': '#FAFAFA',
        '--selected': '#2563EB',
        '--accent-color': '#2563EB',
        '--panel-color': '#0F172A',
        '--panel-bgcolor': '#FFFFFF',
        '--panel-border-color': '#E2E8F0',
        '--map-padding': '16px 20px',
      }
    };

    let me: MindElixir | null = null;
    try {
      me = new MindElixir({
        el: containerRef.current,
        direction: directionMode as any,
        alignment: 'nodes' as any,
        contextMenu: true,
        toolBar: true,
        keypress: true,
        compact: false, // Spaced out layout
        theme: vibrantOrganicTheme as any,
      });
      (me as any).alignment = 'nodes';

      // Dummy DIV element to safely capture async operations
      const dummyDiv = document.createElement('div');
      (me as any)._isUnmounted = false;

      let realContainer = (me as any).container || dummyDiv;
      Object.defineProperty(me, 'container', {
        get() {
          return (me as any)._isUnmounted ? dummyDiv : (realContainer || dummyDiv);
        },
        set(val) {
          if (val) realContainer = val;
        },
        configurable: true,
      });

      let realMap = (me as any).map || dummyDiv;
      Object.defineProperty(me, 'map', {
        get() {
          return (me as any)._isUnmounted ? dummyDiv : (realMap || dummyDiv);
        },
        set(val) {
          if (val) realMap = val;
        },
        configurable: true,
      });

      let realEl = (me as any).el || dummyDiv;
      Object.defineProperty(me, 'el', {
        get() {
          return (me as any)._isUnmounted ? dummyDiv : (realEl || dummyDiv);
        },
        set(val) {
          if (val) realEl = val;
        },
        configurable: true,
      });

      let realDisposable = (me as any).disposable || [];
      Object.defineProperty(me, 'disposable', {
        get() {
          return realDisposable;
        },
        set(val) {
          if (val) realDisposable = val;
        },
        configurable: true,
      });

      const origDestroy = me.destroy;
      me.destroy = function () {
        (me as any)._isUnmounted = true;
        try {
          if (typeof origDestroy === 'function') origDestroy.call(this);
        } catch (e) {}
      };

      const origInit = me.init;
      me.init = async function (initData: any) {
        try {
          return await origInit.call(this, initData);
        } catch (err) {}
      };

      me.init({
        nodeData: rootObj,
        arrows: arrowsList.map((arr, i) => ({
          id: arr.id || `arrow_${i + 1}`,
          label: arr.label || '',
          from: arr.from,
          to: arr.to
        }))
      });

      mindElixirInstanceRef.current = me;
    } catch (err) {
      console.warn('MindElixir initialization error:', err);
    }

    // Fit and center mindmap gracefully inside container frame with perfect bounding box
    const fitToView = (animated: boolean = false) => {
      if (isUnmounted || !me || (me as any)._isUnmounted || !containerRef.current) return;
      applyOptimalFit(me, animated);
    };

    const timer1 = setTimeout(() => fitToView(false), 120);
    const timer2 = setTimeout(() => fitToView(true), 360);

    const handleResize = () => {
      fitToView(false);
    };
    window.addEventListener('resize', handleResize);

    // Listen for node selection to show Feynman explanation card
    if (me && me.bus) {
      me.bus.addListener('selectNodes', (selectedNodes: any[]) => {
        if (isUnmounted) return;
        if (selectedNodes && selectedNodes.length > 0) {
          const nodeObj = selectedNodes[0];
          const cleanLabel = (nodeObj.topic || '').replace(/^[🎯💡🔍⚡🛠️🌟⚠️\s]+/, '');
          const found = data.nodes.find((n) => n.id === nodeObj.id || n.label === cleanLabel || n.label === nodeObj.topic);
          if (found) {
            setSelectedNode(found);
          } else {
            setSelectedNode({
              id: nodeObj.id || `node_${Date.now()}`,
              label: cleanLabel || nodeObj.topic || 'Khái niệm',
              feynmanExplanation: nodeObj.feynmanExplanation || `Phân tích bản chất cho khái niệm ${cleanLabel || nodeObj.topic}`,
              category: nodeObj.category || 'detail'
            });
          }
        }
      });

      me.bus.addListener('unselectNodes', () => {
        if (!isUnmounted) setSelectedNode(null);
      });

      me.bus.addListener('scale', (s: number) => {
        if (typeof s === 'number' && !isNaN(s) && s > 0) {
          setCurrentScale(s);
        }
      });
    }

    return () => {
      isUnmounted = true;
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      if (mindElixirInstanceRef.current) {
        try {
          mindElixirInstanceRef.current.destroy();
        } catch (e) {}
        mindElixirInstanceRef.current = null;
      }
    };
  }, [data, directionMode, showAllDetails]);

  const applyOptimalFit = (targetMe?: any, animated: boolean = true) => {
    const me = targetMe || (mindElixirInstanceRef.current as any);
    if (!me || me._isUnmounted || !containerRef.current) return;
    try {
      const container = containerRef.current;
      const nodes = me.nodes;
      const map = me.map;
      if (!container || !nodes || !map) return;

      const cW = container.offsetWidth || container.clientWidth;
      const cH = container.offsetHeight || container.clientHeight;
      if (cW <= 0 || cH <= 0) return;

      // Ensure nodes dimensions are fully calculated, taking both offsetWidth and scrollWidth
      const nW = Math.max(nodes.offsetWidth || 0, nodes.scrollWidth || 0);
      const nH = Math.max(nodes.offsetHeight || 0, nodes.scrollHeight || 0);
      if (nW <= 0 || nH <= 0) return;

      // Tight padding buffer so mindmap nicely fills container
      const padX = 24;
      const padY = 16;

      const availableW = Math.max(100, cW - padX * 2);
      const availableH = Math.max(100, cH - padY * 2);

      const scaleX = availableW / nW;
      const scaleY = availableH / nH;

      // Smart Readability Scale Protection:
      // If in compact view (showAllDetails = false): scale between 0.85 and 1.15 (text is 18-24px, huge & clear)
      // If in full detail view (showAllDetails = true): clamp to at least 0.60 so text is never smaller than 10-12px!
      let targetScale = Math.min(scaleX, scaleY);
      const minReadableScale = showAllDetails ? 0.60 : 0.85;
      targetScale = Math.max(minReadableScale, Math.min(1.15, targetScale));

      // Calculate translation offsets to place the geometric center of nodes in the exact center of container
      const dx = (cW - nW) / 2;
      const dy = (cH - nH) / 2;

      map.style.transformOrigin = '50% 50%';
      if (animated) {
        map.style.transition = 'transform 0.28s cubic-bezier(0.2, 0, 0, 1)';
      } else {
        map.style.transition = 'none';
      }

      map.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${targetScale})`;
      me.scaleVal = targetScale;
      setCurrentScale(targetScale);

      if (me.bus && typeof me.bus.fire === 'function') {
        me.bus.fire('scale', targetScale);
      }

      if (animated) {
        setTimeout(() => {
          if (map) map.style.transition = '';
        }, 300);
      }
    } catch (err) {
      console.warn('applyOptimalFit error:', err);
    }
  };

  // Fits entire canvas unconditionally (down to 0.15) for an eagle-eye overview
  const handleOverviewFit = () => {
    const me = mindElixirInstanceRef.current as any;
    if (!me || me._isUnmounted || !containerRef.current) return;
    try {
      const container = containerRef.current;
      const nodes = me.nodes;
      const map = me.map;
      if (!container || !nodes || !map) return;

      const cW = container.offsetWidth || container.clientWidth;
      const cH = container.offsetHeight || container.clientHeight;
      const nW = Math.max(nodes.offsetWidth || 0, nodes.scrollWidth || 0);
      const nH = Math.max(nodes.offsetHeight || 0, nodes.scrollHeight || 0);
      if (nW <= 0 || nH <= 0) return;

      const padX = 40;
      const padY = 30;
      const scaleX = (cW - padX * 2) / nW;
      const scaleY = (cH - padY * 2) / nH;
      const targetScale = Math.min(1.0, Math.max(0.15, Math.min(scaleX, scaleY)));

      const dx = (cW - nW) / 2;
      const dy = (cH - nH) / 2;

      map.style.transformOrigin = '50% 50%';
      map.style.transition = 'transform 0.28s cubic-bezier(0.2, 0, 0, 1)';
      map.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${targetScale})`;
      me.scaleVal = targetScale;
      setCurrentScale(targetScale);
      if (me.bus && typeof me.bus.fire === 'function') {
        me.bus.fire('scale', targetScale);
      }
      setTimeout(() => {
        if (map) map.style.transition = '';
      }, 300);
    } catch (err) {}
  };

  // Re-fit view when entering or exiting fullscreen mode
  useEffect(() => {
    const timer = setTimeout(() => {
      applyOptimalFit(mindElixirInstanceRef.current, true);
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  const handleZoomIn = () => {
    const me = mindElixirInstanceRef.current as any;
    if (me && me.map && typeof me.scale === 'function') {
      try {
        const nextScale = Math.min(2.5, (me.scaleVal || 1.0) + 0.15);
        me.scale(nextScale);
        setCurrentScale(nextScale);
      } catch (e) {}
    }
  };

  const handleZoomOut = () => {
    const me = mindElixirInstanceRef.current as any;
    if (me && me.map && typeof me.scale === 'function') {
      try {
        const nextScale = Math.max(0.12, (me.scaleVal || 1.0) - 0.15);
        me.scale(nextScale);
        setCurrentScale(nextScale);
      } catch (e) {}
    }
  };

  const handleZoom100 = () => {
    const me = mindElixirInstanceRef.current as any;
    if (!me || me._isUnmounted || !containerRef.current) return;
    try {
      const container = containerRef.current;
      const nodes = me.nodes;
      const map = me.map;
      if (!container || !nodes || !map) return;

      const cW = container.offsetWidth || container.clientWidth;
      const cH = container.offsetHeight || container.clientHeight;
      const nW = Math.max(nodes.offsetWidth || 0, nodes.scrollWidth || 0);
      const nH = Math.max(nodes.offsetHeight || 0, nodes.scrollHeight || 0);

      const targetScale = 1.0;
      const dx = (cW - nW) / 2;
      const dy = (cH - nH) / 2;

      map.style.transformOrigin = '50% 50%';
      map.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)';
      map.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${targetScale})`;
      me.scaleVal = targetScale;
      setCurrentScale(targetScale);
      if (me.bus && typeof me.bus.fire === 'function') {
        me.bus.fire('scale', targetScale);
      }
      setTimeout(() => {
        if (map) map.style.transition = '';
      }, 260);
    } catch (err) {
      console.warn('handleZoom100 error:', err);
    }
  };

  const handleResetZoom = () => {
    applyOptimalFit(mindElixirInstanceRef.current, true);
  };

  const handleScaleFit = () => {
    applyOptimalFit(mindElixirInstanceRef.current, true);
  };

  const handleRegenerateBuzanMindmap = async () => {
    if (!structuredNote || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key_v1') || '' : '';
      const res = await fetch('/api/ai/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredNote,
          apiKey
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Không thể tạo lại mindmap');
      }
      const newMindmap = await res.json();
      if (newMindmap && newMindmap.nodeData && onUpdateMindmap) {
        onUpdateMindmap(newMindmap);
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi tạo lại mindmap');
    } finally {
      setIsRegenerating(false);
    }
  };

  const mainContainerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white p-3 space-y-2 flex flex-col overflow-hidden'
    : 'sharp-card p-3 sm:p-4 space-y-2';

  const canvasHeightClasses = isFullscreen
    ? 'flex-1 w-full min-h-[500px]'
    : 'relative w-full h-[540px] sm:h-[580px] md:h-[620px]';

  return (
    <div className={mainContainerClasses}>
      {/* Sleek, Modern 1-Line Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 pb-2 gap-2 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <Network className="w-4 h-4 text-blue-600 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-zinc-950 whitespace-nowrap">
            Mindmap Feynman
          </h2>
          <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[9.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Buzan
          </span>
        </div>

        {/* Action Buttons & Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Fold / Unfold Details Toggle */}
          <button
            onClick={() => setShowAllDetails((prev) => !prev)}
            className={`px-2.5 py-1 text-[11px] font-bold flex items-center gap-1.5 transition-all border shadow-2xs ${
              showAllDetails
                ? 'bg-zinc-800 text-white border-zinc-900'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title={showAllDetails ? 'Thu gọn các nhánh công thức để chữ to rõ' : 'Mở bung toàn bộ các nhánh công thức'}
          >
            {showAllDetails ? (
              <>
                <FolderMinus className="w-3.5 h-3.5 text-amber-300" />
                <span>Xem gọn (Chữ to)</span>
              </>
            ) : (
              <>
                <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mở hết ({data.nodes?.length || '90'}+)</span>
              </>
            )}
          </button>

          {/* AI Buzan Regenerate Button */}
          {structuredNote && onUpdateMindmap && (
            <button
              onClick={handleRegenerateBuzanMindmap}
              disabled={isRegenerating}
              className="px-2.5 py-1 text-[11px] font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all shadow-xs disabled:opacity-50"
              title="Dùng AI sinh lại Mindmap phong cách Tony Buzan"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Đang sinh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-100 fill-amber-100" />
                  <span>Tái tạo AI</span>
                </>
              )}
            </button>
          )}

          {/* Layout Direction Selector */}
          <div className="flex items-center border border-zinc-300 bg-zinc-100 p-0.5 gap-0.5">
            <button
              onClick={() => setDirectionMode(2)}
              className={`px-2 py-1 text-[10.5px] font-bold flex items-center gap-1 transition-colors ${
                directionMode === 2 ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-700 hover:bg-white'
              }`}
              title="Sơ đồ tỏa đều hai bên quanh tâm (Phong cách Tony Buzan)"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Tỏa 2 bên</span>
            </button>
            <button
              onClick={() => setDirectionMode(3)}
              className={`px-2 py-1 text-[10.5px] font-bold flex items-center gap-1 transition-colors ${
                directionMode === 3 ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-700 hover:bg-white'
              }`}
              title="Sơ đồ phân cấp dọc từ trên xuống"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Dọc</span>
            </button>
          </div>

          {/* Zoom & Fullscreen Toolbar */}
          <div className="flex items-center border border-zinc-300 bg-zinc-100 p-0.5 gap-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 text-zinc-700 hover:text-zinc-950 hover:bg-white transition-colors"
              title="Thu nhỏ (-15%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10.5px] font-mono font-bold text-zinc-700 px-1 select-none min-w-[34px] text-center">
              {Math.round(currentScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-zinc-700 hover:text-zinc-950 hover:bg-white transition-colors"
              title="Phóng to (+15%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleZoom100}
              className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 transition-colors font-extrabold text-[10.5px] flex items-center gap-1 border-l border-zinc-300 shadow-2xs"
              title="Phóng to 100% cỡ chữ chuẩn to rõ nhất"
            >
              <span>100% Chuẩn</span>
            </button>

            <button
              onClick={handleScaleFit}
              className="px-2 py-1 text-zinc-700 hover:text-blue-700 hover:bg-white transition-colors font-bold text-[10.5px] flex items-center gap-1 border-l border-zinc-300"
              title="Tự động căn vừa khung hình"
            >
              <LayoutGrid className="w-3 h-3 text-blue-600" />
              <span>Vừa khung</span>
            </button>

            <button
              onClick={handleOverviewFit}
              className="px-2 py-1 text-zinc-700 hover:text-zinc-950 hover:bg-white transition-colors font-bold text-[10.5px] flex items-center gap-1 border-l border-zinc-300"
              title="Thu nhỏ toàn cảnh"
            >
              <Eye className="w-3 h-3 text-zinc-500" />
              <span className="hidden sm:inline">Toàn cảnh</span>
            </button>

            <button
              onClick={handleResetZoom}
              className="p-1 text-zinc-700 hover:text-zinc-950 hover:bg-white transition-colors border-l border-zinc-300"
              title="Căn lại vị trí trung tâm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-zinc-300 mx-0.5" />

            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1 text-zinc-700 hover:text-blue-600 hover:bg-white transition-colors"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mind-Elixir Canvas Workspace */}
      <div className={`${canvasHeightClasses} bg-zinc-50 border border-zinc-300 overflow-hidden relative sharp-card`}>
        <div ref={containerRef} className="w-full h-full" id="mind-elixir-container" />
      </div>

      {/* Subtle 1-line guidance footer (Zero wasted space) */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 pt-0.5 shrink-0">
        <span>💡 Bấm <b>(+)</b> trên mỗi nhánh để mở công thức • Giữ chuột kéo để lướt bản đồ</span>
        <span className="hidden sm:inline text-blue-600 font-medium">Bấm [100% Chuẩn] để chữ to rõ nhất</span>
      </div>

      {/* Selected Node Feynman Explanation Card */}
      {selectedNode && (
        <div className="bg-zinc-950 text-white p-4 sm:p-5 space-y-2.5 relative border border-zinc-950 shrink-0 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9.5px] font-extrabold uppercase bg-blue-600 text-white">
              Giải thích Feynman
            </span>
            <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">{selectedNode.label}</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium pt-1">
            {selectedNode.feynmanExplanation}
          </p>
        </div>
      )}
    </div>
  );
};

