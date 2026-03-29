import { create } from 'zustand';

export interface App {
  id: string; name: string; description?: string;
  repoUrl?: string; branch: string; status: string;
  port?: number; createdAt: string; updatedAt: string;
  _count?: { deploys: number; pipelines: number };
}
export interface Deploy {
  id: string; appId: string; version: string; status: string;
  startedAt: string; finishedAt?: string; triggeredBy: string;
  app?: { name: string };
}
export interface Pipeline {
  id: string; appId: string; branch: string; status: string;
  stages: Array<{ name: string; status: string; duration: number | null }>;
  startedAt: string; finishedAt?: string; app?: { name: string };
}
export interface LogEntry {
  id: string; timestamp: string; level: string; service: string; message: string;
}

interface Store {
  apps: App[]; deploys: Deploy[]; pipelines: Pipeline[];
  logs: LogEntry[]; metrics: any;
  setApps: (a: App[]) => void; setDeploys: (d: Deploy[]) => void;
  setPipelines: (p: Pipeline[]) => void; setLogs: (l: LogEntry[]) => void;
  addLog: (l: LogEntry) => void; setMetrics: (m: any) => void;
}

export const useStore = create<Store>(set => ({
  apps: [], deploys: [], pipelines: [], logs: [], metrics: null,
  setApps: apps => set({ apps }),
  setDeploys: deploys => set({ deploys }),
  setPipelines: pipelines => set({ pipelines }),
  setLogs: logs => set({ logs }),
  addLog: log => set(s => ({ logs: [log, ...s.logs].slice(0, 300) })),
  setMetrics: metrics => set({ metrics }),
}));
