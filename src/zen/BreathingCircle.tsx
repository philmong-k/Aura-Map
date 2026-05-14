import React from 'react';
import './ZenApp.css';
import type { BreathingPhase } from './useBreathingCycle';

interface Props {
  scale: number;
  phase: BreathingPhase;
}

export default function BreathingCircle({ scale, phase }: Props) {
  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return '들숨 (Inhale)';
      case 'hold': return '멈춤 (Hold)';
      case 'exhale': return '날숨 (Exhale)';
      default: return '준비 (Ready)';
    }
  };

  return (
    <div className="breathing-circle-container">
      <div 
        className="breathing-circle" 
        style={{ transform: `scale(${scale})` }}
      >
        {/* 중앙에 배꼽같은 포인트를 주어 시선 고정 유도 */}
        <div style={{ width: '4px', height: '4px', background: 'white', borderRadius: '50%', opacity: 0.5 }}></div>
      </div>
      <div className="zen-phase-text" style={{ position: 'absolute', bottom: '-80px' }}>
        {getPhaseText()}
      </div>
    </div>
  );
}
