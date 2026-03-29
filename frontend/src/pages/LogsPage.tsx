import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { logsApi } from '../api';
import { useStore, type LogEntry } from '../store';

export function LogsPage() {
  const { logs, addLog, setLogs } = useStore();
  const [level, setLevel] = useState('');
  const [live, setLive] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    logsApi.list({ limit: 100 }).then(setLogs).catch(() => setError('Не удалось загрузить логи.'));
  }, []);

  useEffect(() => {
    if (!live) { socketRef.current?.disconnect(); socketRef.current = null; return; }
    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;
    socket.emit('subscribe:logs');
    socket.on('log:entry', (entry: LogEntry) => addLog(entry));
    socket.on('connect_error', () => setError('WebSocket недоступен.'));
    return () => { socket.emit('unsubscribe:logs'); socket.disconnect(); };
  }, [live]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const filtered = level ? logs.filter(l => l.level === level) : logs;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Logs</div><div className="page-sub">{filtered.length} entries</div></div>
        {live && <div style={{ display:'flex', alignItems:'center', gap:8 }}><span className="dot running" /><span style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--mono)' }}>live</span></div>}
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <select value={level} onChange={e => setLevel(e.target.value)} style={{ width:140 }}>
          <option value="">Все уровни</option>
          {['INFO','WARN','ERROR','DEBUG'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button className={`btn btn-sm ${live ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLive(v => !v)}>
          {live ? '⏸ Пауза' : '▶ Live'}
        </button>
        <button className={`btn btn-sm ${autoScroll ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAutoScroll(v => !v)}>
          Авто-прокрутка
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setLogs([])}>Очистить</button>
      </div>

      <div className="card" style={{ padding:'12px 16px', maxHeight:'65vh', overflowY:'auto' }}>
        {filtered.length === 0 ? (
          <div className="empty"><div className="ico">≡</div><p>Нет записей.</p></div>
        ) : filtered.map(log => (
          <div className="log-entry" key={log.id}>
            <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`log-lv ${log.level}`}>{log.level}</span>
            <span className="log-svc">{log.service}</span>
            <span className="log-msg">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
