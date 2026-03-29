import { useEffect, useState } from 'react';
import { pipelinesApi } from '../api';
import { useStore, type Pipeline } from '../store';

export function PipelinePage() {
  const { pipelines, setPipelines, apps } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRun, setShowRun] = useState(false);
  const [appId, setAppId] = useState('');
  const [branch, setBranch] = useState('main');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setPipelines(await pipelinesApi.list()); setError(''); }
    catch { setError('Не удалось загрузить пайплайны.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, []);

  const run = async () => {
    if (!appId) return;
    setSaving(true);
    try { await pipelinesApi.create({ appId, branch }); load(); setShowRun(false); setAppId(''); setBranch('main'); }
    catch (e: any) { alert(e?.response?.data?.error || 'Ошибка запуска'); }
    finally { setSaving(false); }
  };

  const cancel = async (id: string) => {
    try { await pipelinesApi.cancel(id); load(); }
    catch { alert('Ошибка отмены'); }
  };

  const dur = (p: Pipeline) => {
    if (!p.finishedAt) return p.status === 'RUNNING' ? 'running...' : '—';
    return `${Math.round((new Date(p.finishedAt).getTime() - new Date(p.startedAt).getTime()) / 1000)}s`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">CI/CD Pipelines</div>
          <div className="page-sub">{pipelines.filter(p => p.status === 'RUNNING').length} running · auto-refresh 3s</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRun(true)}>▶ Run pipeline</button>
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      {loading && pipelines.length === 0 ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><span className="spinner" style={{ width:28, height:28 }} /></div>
      ) : pipelines.length === 0 ? (
        <div className="empty"><div className="ico">⟳</div><p>Нет пайплайнов.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {pipelines.map(p => (
            <div className="card" key={p.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:600 }}>{p.app?.name ?? p.appId}</span>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                    <span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{p.branch}</span>
                  </div>
                  <div className="stages">
                    {Array.isArray(p.stages) && p.stages.map((s, i) => (
                      <span key={i} className={`stage ${s.status}`}>
                        {s.status==='success'?'✓':s.status==='running'?'◉':s.status==='failed'?'✗':'○'} {s.name}
                        {s.duration ? ` ${s.duration}s` : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0, flexWrap:'wrap' }}>
                  <span className="mono" style={{ fontSize:12, color:'var(--text3)' }}>{dur(p)}</span>
                  <span className="mono" style={{ fontSize:11, color:'var(--text3)' }}>{new Date(p.startedAt).toLocaleString()}</span>
                  {p.status === 'RUNNING' && (
                    <button className="btn btn-danger btn-sm" onClick={() => cancel(p.id)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRun && (
        <div className="modal-overlay" onClick={() => setShowRun(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Run pipeline</div>
            <div className="form-group">
              <label className="form-label">Приложение</label>
              <select value={appId} onChange={e => setAppId(e.target.value)}>
                <option value="">Выберите...</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ветка</label>
              <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowRun(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={run} disabled={saving || !appId}>
                {saving ? <span className="spinner" /> : 'Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
