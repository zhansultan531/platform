import { useEffect, useState } from 'react';
import { deploysApi } from '../api';
import { useStore, type Deploy } from '../store';

function dur(d: Deploy) {
  if (!d.finishedAt) return d.status === 'RUNNING' ? 'running...' : '—';
  return `${Math.round((new Date(d.finishedAt).getTime() - new Date(d.startedAt).getTime()) / 1000)}s`;
}

export function DeploysPage() {
  const { deploys, setDeploys } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try { setDeploys(await deploysApi.list()); setError(''); }
    catch { setError('Не удалось загрузить деплои.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const rollback = async (id: string) => {
    if (!confirm('Откатить этот деплой?')) return;
    try { await deploysApi.rollback(id); load(); }
    catch { alert('Ошибка отката'); }
  };

  const stats = {
    total:   deploys.length,
    success: deploys.filter(d => d.status === 'SUCCESS').length,
    failed:  deploys.filter(d => d.status === 'FAILED').length,
    running: deploys.filter(d => d.status === 'RUNNING').length,
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Deploys</div><div className="page-sub">Last {deploys.length} deployments</div></div>
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Total',   value:stats.total,   color:'var(--text)'   },
          { label:'Success', value:stats.success, color:'var(--green)'  },
          { label:'Failed',  value:stats.failed,  color:'var(--red)'    },
          { label:'Running', value:stats.running, color:'var(--accent)' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-val" style={{ color:s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {loading && deploys.length === 0 ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><span className="spinner" style={{ width:28, height:28 }} /></div>
      ) : deploys.length === 0 ? (
        <div className="empty"><div className="ico">⬆</div><p>Нет деплоев.</p></div>
      ) : (
        <div className="card" style={{ padding:0, overflowX:'auto' }}>
          <table className="table">
            <thead><tr><th>Приложение</th><th>Версия</th><th>Статус</th><th>Длительность</th><th>Запущен</th><th>Действия</th></tr></thead>
            <tbody>
              {deploys.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight:500 }}>{d.app?.name ?? d.appId}</td>
                  <td><span className="mono">{d.version}</span></td>
                  <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                  <td><span className="mono">{dur(d)}</span></td>
                  <td><span className="mono" style={{ fontSize:11 }}>{new Date(d.startedAt).toLocaleString()}</span></td>
                  <td>
                    {d.status === 'SUCCESS' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => rollback(d.id)}>Rollback</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
