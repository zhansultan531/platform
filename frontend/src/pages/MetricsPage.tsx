import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { metricsApi } from '../api';
import { useStore } from '../store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Pt { time: string; value: number; }

const tip = { contentStyle: { background:'#13161b', border:'1px solid #232830', borderRadius:8, color:'#e2e8f0', fontSize:12 } };

function Chart({ data, color, unit }: { data: Pt[]; color: string; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top:4, right:4, left:-20, bottom:0 }}>
        <CartesianGrid stroke="#232830" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize:10, fill:'#4a5568', fontFamily:'JetBrains Mono' }} tickLine={false} axisLine={false} interval="preserveStartEnd" tickFormatter={v => v.slice(11,16)} />
        <YAxis tick={{ fontSize:10, fill:'#4a5568', fontFamily:'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}${unit}`} />
        <Tooltip {...tip} formatter={(v: number) => [`${v}${unit}`]} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} activeDot={{ r:3, fill:color }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MetricsPage() {
  const { metrics, setMetrics } = useStore();
  const [history, setHistory] = useState<{ cpu: Pt[]; memory: Pt[]; latency: Pt[] }>({ cpu:[], memory:[], latency:[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    metricsApi.current()
      .then(d => {
        const toP = (a: any[]): Pt[] => Array.isArray(a) ? a.map((p: any) => ({ time: p.time || new Date().toISOString(), value: Number(p.value) })) : [];
        setHistory({ cpu: toP(d.cpu), memory: toP(d.memory), latency: toP(d.latency) });
        setMetrics(d.summary);
      })
      .catch(() => setError('Не удалось загрузить метрики.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = io('/', { path: '/socket.io' });
    socket.emit('subscribe:metrics');
    socket.on('metrics:update', (m: any) => {
      setMetrics({ cpu: m.cpu, memory: m.memory, latency: m.latency, requestsPerMin: m.requestsPerMin });
      const t = m.timestamp || new Date().toISOString();
      setHistory(prev => ({
        cpu:     [...prev.cpu.slice(-59),     { time:t, value:m.cpu }],
        memory:  [...prev.memory.slice(-59),  { time:t, value:m.memory }],
        latency: [...prev.latency.slice(-59), { time:t, value:m.latency }],
      }));
    });
    return () => { socket.emit('unsubscribe:metrics'); socket.disconnect(); };
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><span className="spinner" style={{ width:28, height:28 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Metrics</div><div className="page-sub">Live · updates every 3s</div></div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="dot running" />
          <span style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--mono)' }}>streaming</span>
        </div>
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'CPU usage',   value: metrics ? `${metrics.cpu}%`          : '—', color: metrics?.cpu > 80       ? 'var(--red)' : '#4f8ef7' },
          { label:'Memory',      value: metrics ? `${metrics.memory} MB`      : '—', color: metrics?.memory > 450   ? 'var(--red)' : '#a78bfa' },
          { label:'Latency',     value: metrics ? `${metrics.latency} ms`     : '—', color: metrics?.latency > 200  ? 'var(--yellow)' : '#22c55e' },
          { label:'Req / min',   value: metrics ? `${metrics.requestsPerMin}` : '—', color: '#f59e0b' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-val" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-3">
        {[
          { title:'CPU %',      data:history.cpu,     color:'#4f8ef7', unit:'%'  },
          { title:'Memory MB',  data:history.memory,  color:'#a78bfa', unit:'MB' },
          { title:'Latency ms', data:history.latency, color:'#22c55e', unit:'ms' },
        ].map(c => (
          <div className="card" key={c.title}>
            <div className="card-title">{c.title}</div>
            <Chart data={c.data} color={c.color} unit={c.unit} />
          </div>
        ))}
      </div>
    </div>
  );
}
