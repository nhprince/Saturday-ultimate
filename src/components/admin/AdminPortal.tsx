import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Cpu,
  Layers,
  Settings,
  Shield,
  Activity,
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Key,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Radio,
  Sliders
} from 'lucide-react';
import { api } from '../../lib/api';
import { AIModel, ProviderInfo, AdminCMSConfig } from '../../types';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAllData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose, onRefreshAllData }) => {
  const [tab, setTab] = useState<'overview' | 'providers' | 'models' | 'routing' | 'cms' | 'logs'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [routingConfig, setRoutingConfig] = useState<any>(null);
  const [cmsConfig, setCmsConfig] = useState<AdminCMSConfig | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, any>>({});
  const [checkingModel, setCheckingModel] = useState<string | null>(null);

  // Load Admin Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ov, prov, mod, rout, cms, lg] = await Promise.all([
        api.admin.getOverview(),
        api.admin.getProviders(),
        api.admin.getModels(),
        api.admin.getRouting(),
        api.admin.getCMS(),
        api.admin.getLogs(50),
      ]);
      setOverview(ov);
      setProviders(prov);
      setModels(mod);
      setRoutingConfig(rout);
      setCmsConfig(cms);
      setLogs(lg);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAdminData();
    }
  }, [isOpen]);

  const notifySaved = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3000);
    onRefreshAllData();
  };

  // Provider Updates
  const handleUpdateProvider = async (id: string, updates: any) => {
    try {
      await api.admin.updateProvider(id, updates);
      notifySaved(`Provider ${id} settings updated`);
      loadAdminData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // Provider Live Test
  const handleTestProvider = async (id: string) => {
    setTestingProvider(id);
    try {
      const res = await api.admin.testProvider(id);
      setTestResult(prev => ({ ...prev, [id]: res.data }));
      notifySaved(`Live ping test completed for ${id}`);
    } catch (err: any) {
      setTestResult(prev => ({ ...prev, [id]: { status: 'ERROR', message: err.message } }));
    } finally {
      setTestingProvider(null);
    }
  };

  // Model Updates
  const handleToggleModel = async (model: AIModel) => {
    try {
      const newEnabled = model.enabled === false ? true : false;
      await api.admin.updateModel(model.id, { enabled: newEnabled });
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, enabled: newEnabled } : m));
      notifySaved(`Model ${model.id} ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      alert(`Failed to update model: ${err.message}`);
    }
  };

  // Model Health Check Runner
  const handleCheckModelHealth = async (modelId: string) => {
    setCheckingModel(modelId);
    try {
      const res = await api.admin.checkModelHealth(modelId);
      notifySaved(`Health check for ${modelId}: ${res.data?.status || 'DONE'}`);
      loadAdminData();
    } catch (err: any) {
      alert(`Check failed: ${err.message}`);
    } finally {
      setCheckingModel(null);
    }
  };

  // Save Routing Config
  const handleSaveRouting = async () => {
    try {
      await api.admin.updateRouting(routingConfig);
      notifySaved('Routing policies successfully updated');
    } catch (err: any) {
      alert(`Failed to save routing: ${err.message}`);
    }
  };

  // Save CMS Config
  const handleSaveCMS = async () => {
    if (!cmsConfig) return;
    try {
      await api.admin.updateCMS(cmsConfig);
      notifySaved('CMS configuration saved');
    } catch (err: any) {
      alert(`Failed to save CMS: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in text-neutral-800 dark:text-neutral-200">
      <div className="w-full max-w-5xl h-[90vh] rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Admin Navigation Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#18181c]/70">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                  Saturday Control Center
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  ADMIN / CMS
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Enterprise AI routing, dynamic discovery, credentials & content management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 animate-fade-in font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{savedSuccess}</span>
              </span>
            )}

            <button
              onClick={loadAdminData}
              disabled={loading}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh telemetry"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Sub-tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-white dark:bg-[#141417] overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'providers', label: 'AI Providers & Keys', icon: Server },
            { id: 'models', label: 'Model Catalog & Health', icon: Cpu },
            { id: 'routing', label: 'Smart Routing Policies', icon: Sliders },
            { id: 'cms', label: 'CMS & Suggestions', icon: FileText },
            { id: 'logs', label: 'Telemetry & Logs', icon: Layers },
          ].map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-medium transition-all ${
                  isActive
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafafc] dark:bg-[#0f0f12]">
          {/* 1. Overview Tab */}
          {tab === 'overview' && overview && (
            <div className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                  <span className="text-xs text-neutral-400 font-medium">Discovered Models</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {overview.totalModels}
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
                    {overview.workingModels} Verified Working
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                  <span className="text-xs text-neutral-400 font-medium">Active Providers</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {overview.totalProviders}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1 inline-block font-mono">
                    NVIDIA · CF · OpenRouter
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                  <span className="text-xs text-neutral-400 font-medium">Total Conversations</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {overview.totalConversations}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1 inline-block">
                    {overview.totalMessages} Messages Processed
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
                  <span className="text-xs text-neutral-400 font-medium">System Uptime</span>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                    {Math.floor(overview.uptimeSeconds / 60)}m {overview.uptimeSeconds % 60}s
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
                    ● Operational 100%
                  </span>
                </div>
              </div>

              {/* Quick actions box */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Zero-Cost Edge Infrastructure
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Saturday operates without expensive SaaS infrastructure. Upstream LLM calls connect to free-tier allocations on NVIDIA NIM, OpenRouter free models, and Cloudflare Edge GPU workers. If external keys are not provided, Saturday's internal neural reasoning engine serves requests with zero latency.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setTab('providers')}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Configure Custom API Keys
                  </button>
                  <button
                    onClick={() => setTab('models')}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    Inspect Discovered Models
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Providers Tab */}
          {tab === 'providers' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  External AI Providers & Key Vault
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Configure your own provider credentials securely. Keys are never shipped to the browser.
                </p>
              </div>

              <div className="space-y-4">
                {providers.map(p => {
                  const result = testResult[p.id];
                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 space-y-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                              {p.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              {p.id}
                            </span>
                            {p.hasKey && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                                Key Saved
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {p.description}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateProvider(p.id, { enabled: !p.enabled })}
                            className={`p-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              p.enabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
                            }`}
                          >
                            {p.enabled ? 'Enabled' : 'Disabled'}
                          </button>

                          <button
                            onClick={() => handleTestProvider(p.id)}
                            disabled={testingProvider === p.id}
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-200 transition-colors flex items-center space-x-1.5"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${testingProvider === p.id ? 'animate-spin' : ''}`} />
                            <span>Test Ping</span>
                          </button>
                        </div>
                      </div>

                      {/* Credentials Input Row */}
                      {p.id !== 'saturday' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                          <div>
                            <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                              API Key / Secret Token
                            </label>
                            <div className="relative">
                              <input
                                type="password"
                                placeholder={p.hasKey ? p.maskedKey : `Enter ${p.name} API key...`}
                                onBlur={e => {
                                  if (e.target.value.trim()) {
                                    handleUpdateProvider(p.id, { apiKey: e.target.value.trim() });
                                    e.target.value = '';
                                  }
                                }}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-neutral-400 text-neutral-900 dark:text-white placeholder:text-neutral-400"
                              />
                            </div>
                            <span className="text-[10px] text-neutral-400 mt-0.5 block">
                              Unfocus/blur field to save securely.
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                              Base API URL Endpoint
                            </label>
                            <input
                              type="text"
                              defaultValue={p.baseUrl || ''}
                              onBlur={e => handleUpdateProvider(p.id, { baseUrl: e.target.value.trim() })}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-neutral-400 text-neutral-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Live Ping Test Feedback */}
                      {result && (
                        <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                          result.status === 'WORKING'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <span>Status: {result.status}</span>
                            <span>·</span>
                            <span>{result.message}</span>
                          </div>
                          {result.latencyMs !== undefined && <span>{result.latencyMs}ms</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Models Tab */}
          {tab === 'models' && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Dynamic Model Registry & Health Controls
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Toggle model availability, inspect latency, and run live verification tests without modifying code.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    await api.runBatchHealthCheck();
                    notifySaved('Batch model health verification finished');
                    loadAdminData();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Verify All Models
                </button>
              </div>

              <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden bg-white dark:bg-[#161619] shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {models.map(model => (
                  <div key={model.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                          {model.displayName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          model.health === 'WORKING'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {model.health}
                        </span>
                        {model.isFree && (
                          <span className="text-[10px] px-1.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                            Free Tier
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutral-400 font-mono">
                        <span>ID: {model.id}</span>
                        <span>·</span>
                        <span>Provider: {model.providerName}</span>
                        <span>·</span>
                        <span>Latency: {model.latencyMs || 0}ms</span>
                        <span>·</span>
                        <span className="capitalize text-neutral-500 dark:text-neutral-400">
                          {model.capabilities.reasoning ? 'Reasoning Engine' : model.capabilities.vision ? 'Multimodal Vision' : 'Standard LLM'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCheckModelHealth(model.id)}
                        disabled={checkingModel === model.id}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Force check health"
                      >
                        {checkingModel === model.id ? 'Checking...' : 'Check Health'}
                      </button>

                      <button
                        onClick={() => handleToggleModel(model)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          model.enabled !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {model.enabled !== false ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Routing Tab */}
          {tab === 'routing' && routingConfig && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Autonomous Routing Configuration
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Adjust task classifier priorities, fallback policies, and provider scoring weights.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Default User Router Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['smart', 'free'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setRoutingConfig({ ...routingConfig, defaultRouter: mode })}
                        className={`p-3 rounded-xl border text-left capitalize text-xs font-medium transition-all ${
                          routingConfig.defaultRouter === mode
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/80'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/50'
                        }`}
                      >
                        {mode === 'smart' ? 'Smart Router (Autonomous Classification)' : 'Free Router (Strict Zero Cost)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-xs text-neutral-900 dark:text-white">Enable Automatic Edge Fallback</span>
                      <p className="text-[11px] text-neutral-400">If primary upstream model returns 5xx or rate limit, fail over to next healthy provider.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={routingConfig.enableFallback}
                      onChange={e => setRoutingConfig({ ...routingConfig, enableFallback: e.target.checked })}
                      className="rounded border-neutral-300 text-neutral-900 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-2">
                    Scoring Weights
                  </label>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-neutral-500 mb-1">
                        <span>Health & Uptime Weight</span>
                        <span className="font-mono">{routingConfig.priorityWeights.health * 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={routingConfig.priorityWeights.health}
                        onChange={e => setRoutingConfig({
                          ...routingConfig,
                          priorityWeights: { ...routingConfig.priorityWeights, health: parseFloat(e.target.value) }
                        })}
                        className="w-full accent-neutral-900 dark:accent-white"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-500 mb-1">
                        <span>Latency & Speed Weight</span>
                        <span className="font-mono">{routingConfig.priorityWeights.latency * 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={routingConfig.priorityWeights.latency}
                        onChange={e => setRoutingConfig({
                          ...routingConfig,
                          priorityWeights: { ...routingConfig.priorityWeights, latency: parseFloat(e.target.value) }
                        })}
                        className="w-full accent-neutral-900 dark:accent-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveRouting}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Routing Policies</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. CMS Tab */}
          {tab === 'cms' && cmsConfig && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  Content Management & Landing Experience
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Update product copy, prompt suggestions, and feature flags without touching source code.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#161619] border border-neutral-200/80 dark:border-neutral-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Welcome Headline
                    </label>
                    <input
                      type="text"
                      value={cmsConfig.welcomeHeadline}
                      onChange={e => setCmsConfig({ ...cmsConfig, welcomeHeadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Subheadline Prompt
                    </label>
                    <input
                      type="text"
                      value={cmsConfig.welcomeSubheadline}
                      onChange={e => setCmsConfig({ ...cmsConfig, welcomeSubheadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Prompt Suggestions CRUD */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Curated Prompt Suggestions
                    </span>
                    <button
                      onClick={() => {
                        const newSug = {
                          id: 'sug_' + Date.now(),
                          title: 'New Idea',
                          prompt: 'Explore creative concepts for my product...',
                          category: 'productivity' as const,
                        };
                        setCmsConfig({
                          ...cmsConfig,
                          promptSuggestions: [...cmsConfig.promptSuggestions, newSug],
                        });
                      }}
                      className="flex items-center space-x-1 text-xs text-neutral-700 dark:text-neutral-300 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Suggestion</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cmsConfig.promptSuggestions.map((sug, idx) => (
                      <div key={sug.id || idx} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-start space-x-3 bg-neutral-50/50 dark:bg-neutral-900/40">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={sug.title}
                            onChange={e => {
                              const updated = [...cmsConfig.promptSuggestions];
                              updated[idx].title = e.target.value;
                              setCmsConfig({ ...cmsConfig, promptSuggestions: updated });
                            }}
                            className="w-full px-2 py-1 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800"
                            placeholder="Title..."
                          />
                          <textarea
                            value={sug.prompt}
                            onChange={e => {
                              const updated = [...cmsConfig.promptSuggestions];
                              updated[idx].prompt = e.target.value;
                              setCmsConfig({ ...cmsConfig, promptSuggestions: updated });
                            }}
                            rows={2}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800"
                            placeholder="Prompt text..."
                          />
                        </div>

                        <button
                          onClick={() => {
                            const updated = cmsConfig.promptSuggestions.filter((_, i) => i !== idx);
                            setCmsConfig({ ...cmsConfig, promptSuggestions: updated });
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-rose-500"
                          title="Delete suggestion"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveCMS}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save CMS Updates</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. Logs Tab */}
          {tab === 'logs' && (
            <div className="space-y-4 max-w-4xl">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  System Audit Telemetry
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Live streaming telemetry, provider routing events, and failover traces.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden bg-white dark:bg-[#161619] shadow-sm font-mono text-xs divide-y divide-neutral-100 dark:divide-neutral-800/80">
                {logs.map((log: any) => (
                  <div key={log.id} className="p-3 flex items-start space-x-3">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${
                      log.level === 'error' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      log.level === 'warn' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-neutral-400 text-[11px] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-neutral-800 dark:text-neutral-200 flex-1">
                      {log.event}
                    </span>
                    {log.details && (
                      <span className="text-neutral-400 text-[10px] truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="p-6 text-center text-neutral-400">No logs recorded yet.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#18181c]/50 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>Role: System Administrator</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-sans text-xs font-medium"
          >
            Close Admin
          </button>
        </div>
      </div>
    </div>
  );
};
