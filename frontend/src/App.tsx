import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AppsPage } from './pages/AppsPage';
import { PipelinePage } from './pages/PipelinePage';
import { MetricsPage } from './pages/MetricsPage';
import { LogsPage } from './pages/LogsPage';
import { DeploysPage } from './pages/DeploysPage';
import './styles.css';

const links = [
  { to: '/apps',      label: 'Applications', icon: '▣' },
  { to: '/pipelines', label: 'CI/CD',         icon: '⟳' },
  { to: '/metrics',   label: 'Metrics',       icon: '◈' },
  { to: '/logs',      label: 'Logs',          icon: '≡' },
  { to: '/deploys',   label: 'Deploys',       icon: '⬆' },
];

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <BrowserRouter>
      <div className="layout">
        <button className="menu-btn" onClick={() => setOpen(v => !v)}>☰</button>
        {open && <div className="overlay" onClick={() => setOpen(false)} />}
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <div className="sidebar-logo"><span style={{color:'var(--accent)'}}>◈</span> DeployHub</div>
          <nav className="sidebar-nav">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span>{l.icon}</span><span>{l.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer"><span className="dot running" /> Platform online</div>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/apps" replace />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/pipelines" element={<PipelinePage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/deploys" element={<DeploysPage />} />
            <Route path="*" element={
              <div className="not-found">
                <div style={{fontSize:80,opacity:.1}}>404</div>
                <div style={{fontSize:18,fontWeight:600}}>Страница не найдена</div>
                <NavLink to="/apps" className="btn btn-primary" style={{marginTop:16}}>← На главную</NavLink>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
