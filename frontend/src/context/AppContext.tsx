import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '@/services/api';
import { getCampaigns as fetchCampaigns, getMyCampaigns, createCampaign as apiCreateCampaign, applyToCampaign as apiApply } from '@/services/campaignService';
import { getLeads as fetchLeads, createLead as apiCreateLead, updateLead as apiUpdateLead, deleteLead as apiDeleteLead } from '@/services/leadService';
import type { Campaign as APICampaign } from '@/services/campaignService';
import type { Lead as APILead } from '@/services/leadService';

// ─── Legacy local types (kept for backwards compat with non-migrated pages) ───
interface ContentItem {
  id: string; title: string; platform: string; type: string; status: string; date: string; image?: string;
}
interface AutomationRule { id: string; condition: string; action: string; }
interface Integration { id: string; name: string; category: string; connected: boolean; icon: string; }
interface TeamMember { id: string; name: string; email: string; role: string; status: 'Active' | 'Invited'; }
interface Activity {
  id: string; type: 'system' | 'campaign' | 'message' | 'billing' | 'integration' | 'team'; message: string; timestamp: string; read: boolean;
}

interface AppContextType {
  // ── API-backed ──
  campaigns: APICampaign[];
  leads: APILead[];
  campaignsLoading: boolean;
  leadsLoading: boolean;
  addCampaign: (campaign: { title: string; description: string; budget: string; niche?: string; image?: string }) => Promise<void>;
  applyToCampaign: (id: string, message?: string) => Promise<void>;
  addLead: (lead: { name: string; email?: string; phone?: string; company?: string; status?: 'Hot' | 'Warm' | 'Cold'; value?: string }) => Promise<void>;
  updateLead: (id: string, updates: Partial<APILead>) => Promise<void>;
  removeLead: (id: string) => Promise<void>;
  refreshCampaigns: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  // ── Still local ──
  content: ContentItem[];
  rules: AutomationRule[];
  subscriptions: any[];
  users: any[];
  activities: Activity[];
  integrations: Integration[];
  team: TeamMember[];
  connections: { instagram: string; youtube: string; tiktok: string; linkedin: string; slack: string };
  isAnyConnected: boolean;
  addContent: (item: Omit<ContentItem, 'id' | 'date'>) => void;
  addRule: (rule: Omit<AutomationRule, 'id'>) => void;
  addSubscription: (sub: any) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'read'>) => void;
  markActivitiesRead: () => void;
  toggleIntegration: (id: string) => void;
  inviteTeamMember: (email: string, role: string) => void;
  deleteUser: (email: string) => void;
  updateUser: (email: string, updates: any) => void;
  addUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: '1', name: 'Instagram', category: 'Social', connected: false, icon: 'Instagram' },
  { id: '2', name: 'YouTube', category: 'Social', connected: false, icon: 'Youtube' },
  { id: '3', name: 'TikTok', category: 'Social', connected: false, icon: 'Music2' },
  { id: '4', name: 'LinkedIn', category: 'Professional', connected: false, icon: 'Linkedin' },
  { id: '5', name: 'Slack', category: 'Communication', connected: false, icon: 'Slack' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── API-backed state ──────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<APICampaign[]>([]);
  const [leads, setLeads] = useState<APILead[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // ── Local state (non-critical, still persisted in localStorage) ───────────
  const [content, setContent] = useState<ContentItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('creatorshq_content') || '[]'); } catch { return []; }
  });
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    try { return JSON.parse(localStorage.getItem('creatorshq_rules') || '[]'); } catch { return []; }
  });
  const [subscriptions, setSubscriptions] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('creatorshq_subscriptions') || '[]'); } catch { return []; }
  });
  const [users, setUsers] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('creatorshq_users') || '[]'); } catch { return []; }
  });
  const [activities, setActivities] = useState<Activity[]>(() => {
    try { return JSON.parse(localStorage.getItem('creatorshq_activities') || '[]'); } catch { return []; }
  });
  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    try {
      const stored = localStorage.getItem('creatorshq_integrations');
      return stored ? JSON.parse(stored) : INITIAL_INTEGRATIONS;
    } catch { return INITIAL_INTEGRATIONS; }
  });
  const [team, setTeam] = useState<TeamMember[]>(() => {
    try { return JSON.parse(localStorage.getItem('creatorshq_team') || '[]'); } catch { return []; }
  });

  // Persist local state
  useEffect(() => { localStorage.setItem('creatorshq_content', JSON.stringify(content)); }, [content]);
  useEffect(() => { localStorage.setItem('creatorshq_rules', JSON.stringify(rules)); }, [rules]);
  useEffect(() => { localStorage.setItem('creatorshq_subscriptions', JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { localStorage.setItem('creatorshq_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('creatorshq_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('creatorshq_integrations', JSON.stringify(integrations)); }, [integrations]);
  useEffect(() => { localStorage.setItem('creatorshq_team', JSON.stringify(team)); }, [team]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const connections = {
    instagram: integrations.find(i => i.name === 'Instagram')?.connected ? 'connected' : 'offline',
    youtube: integrations.find(i => i.name === 'YouTube')?.connected ? 'connected' : 'offline',
    tiktok: integrations.find(i => i.name === 'TikTok')?.connected ? 'connected' : 'offline',
    linkedin: integrations.find(i => i.name === 'LinkedIn')?.connected ? 'connected' : 'offline',
    slack: integrations.find(i => i.name === 'Slack')?.connected ? 'connected' : 'offline',
  };
  const isAnyConnected = integrations.some(i => i.connected);

  // ── Load campaigns from API ───────────────────────────────────────────────
  const refreshCampaigns = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setCampaignsLoading(true);
    try {
      // Brands see their own; everyone else sees open marketplace
      const role = localStorage.getItem('role');
      const res = role === 'brand' ? await getMyCampaigns() : await fetchCampaigns();
      setCampaigns(res.data || []);
    } catch (err) {
      console.error('[AppContext] Failed to load campaigns', err);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  // ── Load leads from API ───────────────────────────────────────────────────
  const refreshLeads = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLeadsLoading(true);
    try {
      const res = await fetchLeads();
      setLeads(res.data || []);
    } catch (err) {
      console.error('[AppContext] Failed to load leads', err);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCampaigns();
    refreshLeads();
  }, [refreshCampaigns, refreshLeads]);

  // Sync integrations from backend on mount
  useEffect(() => {
    const syncIntegrations = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await API.get('/api/integrations');
        if (res.data.success) {
          const connectedMap = res.data.data;
          setIntegrations(prev => prev.map(i => ({
            ...i,
            connected: !!connectedMap[i.name.toLowerCase()]
          })));
        }
      } catch (err) {
        console.error('[AppContext] Failed to sync integrations', err);
      }
    };
    syncIntegrations();
  }, []);

  // ── Campaign actions ──────────────────────────────────────────────────────
  const addCampaign = async (campaign: { title: string; description: string; budget: string; niche?: string; image?: string }) => {
    await apiCreateCampaign({ ...campaign, description: campaign.description || '' });
    addActivity({ type: 'campaign', message: `New campaign launched: ${campaign.title}` });
    await refreshCampaigns();
  };

  const applyToCampaign = async (id: string, message?: string) => {
    await apiApply(id, message);
    addActivity({ type: 'campaign', message: 'Campaign application submitted' });
    await refreshCampaigns();
  };

  // ── Lead actions ──────────────────────────────────────────────────────────
  const addLead = async (lead: { name: string; email?: string; phone?: string; company?: string; status?: 'Hot' | 'Warm' | 'Cold'; value?: string }) => {
    await apiCreateLead(lead);
    await refreshLeads();
  };

  const updateLead = async (id: string, updates: Partial<APILead>) => {
    await apiUpdateLead(id, updates);
    await refreshLeads();
  };

  const removeLead = async (id: string) => {
    await apiDeleteLead(id);
    setLeads(prev => prev.filter(l => l._id !== id));
  };

  // ── Local actions ─────────────────────────────────────────────────────────
  const addContent = (item: Omit<ContentItem, 'id' | 'date'>) => {
    setContent(prev => [...prev, { ...item, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleString() }]);
  };
  const addRule = (rule: Omit<AutomationRule, 'id'>) => {
    setRules(prev => [...prev, { ...rule, id: Math.random().toString(36).substr(2, 9) }]);
  };
  const addSubscription = (sub: any) => {
    setSubscriptions(prev => [...prev, { ...sub, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString() }]);
  };
  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp' | 'read'>) => {
    setActivities(prev => [
      { ...activity, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), read: false },
      ...prev
    ].slice(0, 50));
  };
  const markActivitiesRead = () => setActivities(prev => prev.map(a => ({ ...a, read: true })));
  const toggleIntegration = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;
    try {
      const res = await API.post('/api/integrations/connect', { platform: integration.name.toLowerCase() });
      if (res.data.success) {
        setIntegrations(prev => prev.map(i => {
          if (i.id !== id) return i;
          const newState = !i.connected;
          addActivity({ type: 'integration', message: `${i.name} ${newState ? 'connected' : 'disconnected'}` });
          return { ...i, connected: newState };
        }));
      }
    } catch (err) {
      console.error('[AppContext] Integration toggle failed', err);
      throw err;
    }
  };
  const inviteTeamMember = (email: string, role: string) => {
    setTeam(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: email.split('@')[0], email, role, status: 'Invited' }]);
    addActivity({ type: 'team', message: `Invitation sent to ${email} as ${role}` });
  };

  return (
    <AppContext.Provider value={{
      campaigns, leads, campaignsLoading, leadsLoading,
      addCampaign, applyToCampaign,
      addLead, updateLead, removeLead,
      refreshCampaigns, refreshLeads,
      content, rules, subscriptions, users, activities, integrations, team,
      connections, isAnyConnected,
      addContent, addRule, addSubscription, addActivity, markActivitiesRead,
      toggleIntegration, inviteTeamMember,
      deleteUser: (email) => setUsers(prev => prev.filter(u => u.email !== email)),
      updateUser: (email, updates) => setUsers(prev => prev.map(u => u.email === email ? { ...u, ...updates } : u)),
      addUser: (user) => setUsers(prev => { if (prev.find(u => u.email === user.email)) return prev; return [...prev, user]; }),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
