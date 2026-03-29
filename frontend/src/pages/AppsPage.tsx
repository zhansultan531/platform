import { useEffect, useState } from 'react';
import { appsApi, deploysApi } from '../api';
import { useStore, type App } from '../store';

function Modal({ title, onClose, children }: any) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function AppsPage() {
  const { apps, setApps } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deployApp, setDeployApp] = useState<App | null>(null);
  const [form, setForm] = useState({ name: '', description: '', repoUrl: '', branch: 'main', port: '' });
  const [version, setVersion] = useState('v1.0.0');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try { setApps(await appsApi.list()); }
    catch { setError('Не удалось загрузить приложения. Проверьте что бэкенд запущен.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addApp = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await appsApi.create({ ...form, port: form.port ? Number(form.port) : null });
      load(); setShowAdd(false);
      setForm({ name: '', description: '', repoUrl: '', branch: 'main', port: '' });
    } catch (e: any) { alert(e?.response?.data?.error || 'Ошибка создания'); }
    finally { setSaving(false); }
  };

  const deploy = async () => {
    if (!deployApp || !version.trim()) return;
    setSaving(true);
    try { await deploysApi.create({ appId: deployApp.id, version }); load(); setDeployApp(null); }
    catch (e: any) { alert(e?.response?.data?.error || 'Ошибка деплоя'); }
    finally { setSaving(false); }
  };

  const toggle = async (app: App) => {
    try { await (app.status === 'RUNNING' ? appsApi.stop(app.id) : appsApi.restart(app.id)); load(); }
    catch { alert('Ошибка изменения статуса'); }
  };

  const del = async (id: string) => {
    if (!confirm('Удалить приложение?')) return;
    try { await appsApi.delete(id); load(); }
    catch { alert('Ошибка удаления'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Applications</div><div className="page-sub">{apps.length} registered</div></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add app</button>
      </div>

      {error && <div className="error-box">⚠ {error}</div>}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <span className="spinner" style={{ width:28, height:28 }} />
        </div>
      ) : apps.length === 0 && !error ? (
        <div className="empty"><div className="ico">▣</div><p>Нет приложений. Добавьте первое.</p></div>
      ) : (
        <div className="card" style={{ padding:0, overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Название</th><th>Статус</th><th>Ветка</th><th>Порт</th><th>Деплои</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {apps.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span className={`dot ${app.status.toLowerCase()}`} />
                      <div>
                        <div style={{ fontWeight:500 }}>{app.name}</div>
                        {app.description && <div style={{ fontSize:11, color:'var(--text3)' }}>{app.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${app.status}`}>{app.status}</span></td>
                  <td><span className="mono">{app.branch}</span></td>
                  <td><span className="mono">{app.port ?? '—'}</span></td>
                  <td><span className="mono">{app._count?.deploys ?? 0}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeployApp(app)}>Deploy</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggle(app)}>
                        {app.status === 'RUNNING' ? 'Stop' : 'Start'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(app.id)}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Добавить приложение" onClose={() => setShowAdd(false)}>
          {[['name','Название *','my-app'],['description','Описание',''],['repoUrl','Repo URL','https://github.com/...'],['branch','Ветка','main'],['port','Порт','3000']].map(([k,l,p]) => (
            <div className="form-group" key={k}>
              <label className="form-label">{l}</label>
              <input value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={p} onKeyDown={e => e.key==='Enter' && addApp()} />
            </div>
          ))}
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Отмена</button>
            <button className="btn btn-primary" onClick={addApp} disabled={saving || !form.name.trim()}>
              {saving ? <span className="spinner" /> : 'Создать'}
            </button>
          </div>
        </Modal>
      )}

      {deployApp && (
        <Modal title={`Deploy · ${deployApp.name}`} onClose={() => setDeployApp(null)}>
          <div className="form-group">
            <label className="form-label">Версия</label>
            <input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0.0" onKeyDown={e => e.key==='Enter' && deploy()} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setDeployApp(null)}>Отмена</button>
            <button className="btn btn-primary" onClick={deploy} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Deploy'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
