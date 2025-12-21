import React, { useMemo, useState, useRef, useEffect } from 'react';
import { OrbitLevel, Thought } from '../types';
import { ORBIT_CONFIG } from '../constants';
import { FileText, ShoppingCart, Calendar, Target, Activity, Dumbbell, Globe, Film, CheckCircle } from 'lucide-react';

interface OrbitVisualizerProps {
  thoughts: Thought[];
  width: number;
  height: number;
  onHoverThought: (thought: Thought | null) => void;
  activeThought: Thought | null;
  onUpdateLevel: (id: string, level: OrbitLevel) => void;
}

const getIconForThought = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes('resume')) return FileText;
  if (t.includes('grocer')) return ShoppingCart;
  if (t.includes('study')) return Activity;
  if (t.includes('gym') || t.includes('workout')) return Dumbbell;
  if (t.includes('travel')) return Globe;
  return Target;
};

const OrbitVisualizer: React.FC<OrbitVisualizerProps> = ({
  thoughts,
  width,
  height,
  onHoverThought,
  activeThought,
  onUpdateLevel
}) => {
  const cx = width / 2;
  const cy = height / 2;
  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState(0);
  const [draggedThoughtId, setDraggedThoughtId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [targetLevel, setTargetLevel] = useState<OrbitLevel | null>(null);

  // 动画循环：公转系统
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setRotation(prev => prev + 0.15); // 公转角速度
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  const grouped = useMemo(() => ({
    survival: thoughts.filter(t => t.level === OrbitLevel.SURVIVAL),
    growth: thoughts.filter(t => t.level === OrbitLevel.GROWTH),
    vision: thoughts.filter(t => t.level === OrbitLevel.VISION),
  }), [thoughts]);

  const getSVGPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  const handleMouseDown = (e: React.MouseEvent, thoughtId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedThoughtId(thoughtId);
    const pt = getSVGPoint(e.clientX, e.clientY);
    setDragPos(pt);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggedThoughtId) return;
      const pt = getSVGPoint(e.clientX, e.clientY);
      setDragPos(pt);
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 170) setTargetLevel(OrbitLevel.SURVIVAL);
      else if (dist < 270) setTargetLevel(OrbitLevel.GROWTH);
      else setTargetLevel(OrbitLevel.VISION);
    };

    const handleGlobalMouseUp = () => {
      if (draggedThoughtId && targetLevel) {
        onUpdateLevel(draggedThoughtId, targetLevel);
      }
      setDraggedThoughtId(null);
      setTargetLevel(null);
    };

    if (draggedThoughtId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedThoughtId, targetLevel, cx, cy]);

  return (
    <svg ref={svgRef} width={width} height={height} className="overflow-visible select-none touch-none">
      <defs>
        <radialGradient id="orbit-glow">
          <stop offset="60%" stopColor="rgba(59, 130, 246, 0.03)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Orbit Rings */}
      {[ORBIT_CONFIG.SURVIVAL, ORBIT_CONFIG.GROWTH, ORBIT_CONFIG.VISION].map((cfg) => {
        const level = cfg.label.toUpperCase() as OrbitLevel;
        const isTarget = targetLevel === level;
        return (
          <g key={cfg.radius}>
            {isTarget && <circle cx={cx} cy={cy} r={cfg.radius + 35} fill="url(#orbit-glow)" />}
            <circle cx={cx} cy={cy} r={cfg.radius} fill="none" stroke={cfg.color} strokeWidth={isTarget ? "4" : "1"} strokeOpacity={isTarget ? "0.4" : "0.1"} strokeDasharray="8 4" />
          </g>
        );
      })}

      {/* Nodes */}
      {thoughts.map((t) => {
        const isDragging = draggedThoughtId === t.id;
        const isHovered = activeThought?.id === t.id;
        const isActive = isHovered || isDragging;

        let tx, ty;
        if (isDragging) {
          tx = dragPos.x;
          ty = dragPos.y;
        } else {
          const config = ORBIT_CONFIG[t.level];
          if (t.level === OrbitLevel.SURVIVAL) {
            const spacing = 50;
            const sIdx = grouped.survival.findIndex(item => item.id === t.id);
            ty = cy - ((grouped.survival.length - 1) * spacing) / 2 + sIdx * spacing;
            tx = cx - 110;
          } else {
            const arr = t.level === OrbitLevel.GROWTH ? grouped.growth : grouped.vision;
            const idx = arr.findIndex(item => item.id === t.id);
            // 基础角度 + 根据层级速度变化的公转偏移
            const speedFactor = t.level === OrbitLevel.GROWTH ? 1 : 0.6;
            const angle = (idx / arr.length) * 360 - 45 + (rotation * speedFactor);
            const rad = (angle * Math.PI) / 180;
            tx = cx + config.radius * Math.cos(rad);
            ty = cy + config.radius * Math.sin(rad);
          }
        }

        const Icon = t.completed ? CheckCircle : getIconForThought(t.content);
        const color = t.completed ? '#22c55e' : ORBIT_CONFIG[t.level].color;

        return (
          <g
            key={t.id}
            className={`cursor-grab active:cursor-grabbing transition-opacity duration-300 ${activeThought && !isActive ? 'opacity-20' : 'opacity-100'}`}
            onMouseEnter={() => !draggedThoughtId && onHoverThought(t)}
            onMouseLeave={() => !draggedThoughtId && onHoverThought(null)}
            onMouseDown={(e) => handleMouseDown(e, t.id)}
          >
            <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={color} strokeWidth="0.5" strokeOpacity={isActive ? 0.2 : 0.05} />
            <circle cx={tx} cy={ty} r={isActive ? 25 : 19} fill={color} stroke="white" strokeWidth="3" className="shadow-2xl" />
            <foreignObject x={tx - 11} y={ty - 11} width="22" height="22" className="pointer-events-none">
              <Icon size={22} className="text-white" />
            </foreignObject>
            <text x={tx} y={ty + 42} textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="600" className="font-sans pointer-events-none tracking-tight">
              {t.content.length > 20 ? t.content.substring(0, 18) + '...' : t.content}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default OrbitVisualizer;
