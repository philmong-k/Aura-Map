import React, { useState } from 'react';
import './ZenApp.css';
import { useBreathingCycle } from './useBreathingCycle';
import BreathingCircle from './BreathingCircle';
import { useZenStore } from './store';

interface Props {
  onClose: () => void;
}

type AppStage = 'start' | 'breathing' | 'result';

export default function ZenApp({ onClose }: Props) {
  const { phase, scale, isStarted, start, stop } = useBreathingCycle();
  const [stage, setStage] = useState<AppStage>('start');
  const [serenity, setSerenity] = useState(5);
  const addSessionLog = useZenStore((state) => state.addSessionLog);

  const handleStart = () => {
    setStage('breathing');
    start();
  };

  const handleStop = () => {
    stop();
    setStage('result');
  };

  const handleSave = () => {
    addSessionLog(serenity);
    onClose();
  };

  return (
    <div className={`zen-overlay ${isStarted ? phase : ''}`}>
      <button 
        className="zen-close-btn" 
        onClick={onClose}
        style={{
          background: 'rgba(255, 23, 68, 0.1)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 82, 82, 0.5)',
          color: '#ff5252',
          fontWeight: 'bold',
          letterSpacing: '2px',
          boxShadow: '0 0 15px rgba(255, 23, 68, 0.3)'
        }}
      >
        ⏏ EXIT ZEN MODE
      </button>

      {stage === 'start' && (
        <div className="zen-session-ui">
          <h1 style={{ letterSpacing: '8px', marginBottom: '40px' }}>ZEN MODE</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>
            깊은 호흡을 통해 마음의 평화를 찾으세요.<br/>
            (4초 들숨 - 2초 멈춤 - 4초 날숨)
          </p>
          <button 
            onClick={handleStart}
            style={{ 
              padding: '16px 40px', background: '#00e5ff', color: '#000', 
              border: 'none', borderRadius: '40px', fontWeight: 'bold', cursor: 'pointer',
              fontSize: '18px', boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)'
            }}
          >
            BEGIN SESSION
          </button>
        </div>
      )}

      {stage === 'breathing' && (
        <div className="zen-session-ui">
          <BreathingCircle scale={scale} phase={phase} />
          <button 
            onClick={handleStop}
            style={{ 
              marginTop: '150px', background: 'none', border: '1px solid rgba(255,255,255,0.3)', 
              color: 'white', padding: '10px 30px', borderRadius: '20px', cursor: 'pointer' 
            }}
          >
            END SESSION
          </button>
        </div>
      )}

      {stage === 'result' && (
        <div className="zen-session-ui">
          <h2 style={{ marginBottom: '30px' }}>세션을 마쳤습니다</h2>
          <p style={{ marginBottom: '20px' }}>지금 현재의 평온도는 어느 정도인가요?</p>
          
          <div style={{ margin: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input 
              type="range" min="1" max="10" step="1" 
              value={serenity} 
              onChange={(e) => setSerenity(parseInt(e.target.value))}
              style={{ width: '300px', cursor: 'pointer' }}
            />
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00e5ff', marginTop: '20px' }}>
              {serenity}
            </div>
          </div>

          <button 
            onClick={handleSave}
            style={{ 
              padding: '16px 40px', background: '#00e5ff', color: '#000', 
              border: 'none', borderRadius: '40px', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            SAVE & CLOSE
          </button>
        </div>
      )}
    </div>
  );
}
