import React, { createContext, useContext, useState, useEffect } from 'react';

interface Lead {
    id: string;
    name: string;
    email: string;
    status: 'Hot' | 'Warm' | 'Cold';
    value: string;
    date: string;
}

interface ContentItem {
    id: string;
    title: string;
    platform: string;
    type: string;
    status: string;
    date: string;
    image?: string;
}

interface AutomationRule {
    id: string;
    condition: string;
    action: string;
}

interface Integration {
    id: string;
    name: string;
    category: string;
    connected: boolean;
    icon: string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Invited';
}

interface Campaign {
    id: string;
    brand: string;
    brandId: string;
    title: string;
    description: string;
    budget: string;
    status: 'Open' | 'Applied' | 'Closed';
    image: string;
    applicants: string[]; // User emails/IDs
}

interface Activity {
    id: string;
    type: 'system' | 'campaign' | 'message' | 'billing' | 'integration' | 'team';
    message: string;
    timestamp: string;
    read: boolean;
}

interface AppContextType {
    leads: Lead[];
    content: ContentItem[];
    rules: AutomationRule[];
    subscriptions: any[];
    campaigns: Campaign[];
    users: any[];
    activities: Activity[];
    integrations: Integration[];
    team: TeamMember[];
    connections: {
        instagram: string;
        youtube: string;
        tiktok: string;
        linkedin: string;
        slack: string;
    };
    isAnyConnected: boolean;
    addLead: (lead: Omit<Lead, 'id' | 'date'>) => void;
    addContent: (item: Omit<ContentItem, 'id' | 'date'>) => void;
    addRule: (rule: Omit<AutomationRule, 'id'>) => void;
    addSubscription: (sub: any) => void;
    addCampaign: (campaign: Omit<Campaign, 'id' | 'status' | 'applicants'>) => void;
    applyToCampaign: (id: string, userEmail: string) => void;
    updateCampaign: (id: string, updates: Partial<Campaign>) => void;
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
    { id: '5', name: 'Slack', category: 'Communication', connected: false, icon: 'Slack' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [content, setContent] = useState<ContentItem[]>([]);
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
    const [team, setTeam] = useState<TeamMember[]>([]);
    
    // Derived state for quick access
    const connections = {
        instagram: integrations.find(i => i.name === 'Instagram')?.connected ? 'connected' : 'offline',
        youtube: integrations.find(i => i.name === 'YouTube')?.connected ? 'connected' : 'offline',
        tiktok: integrations.find(i => i.name === 'TikTok')?.connected ? 'connected' : 'offline',
        linkedin: integrations.find(i => i.name === 'LinkedIn')?.connected ? 'connected' : 'offline',
        slack: integrations.find(i => i.name === 'Slack')?.connected ? 'connected' : 'offline'
    };

    const isAnyConnected = integrations.some(i => i.connected);

    // Load from localStorage on init
    useEffect(() => {
        const storedLeads = localStorage.getItem('creatorshq_leads');
        const storedContent = localStorage.getItem('creatorshq_content');
        const storedRules = localStorage.getItem('creatorshq_rules');
        const storedSubs = localStorage.getItem('creatorshq_subscriptions');
        const storedCampaigns = localStorage.getItem('creatorshq_campaigns');
        const storedUsers = localStorage.getItem('creatorshq_users');
        const storedActivities = localStorage.getItem('creatorshq_activities');
        const storedIntegrations = localStorage.getItem('creatorshq_integrations');
        const storedTeam = localStorage.getItem('creatorshq_team');

        if (storedLeads) setLeads(JSON.parse(storedLeads));
        if (storedContent) setContent(JSON.parse(storedContent));
        if (storedRules) setRules(JSON.parse(storedRules));
        if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
        if (storedUsers) setUsers(JSON.parse(storedUsers));
        if (storedActivities) setActivities(JSON.parse(storedActivities));
        if (storedIntegrations) setIntegrations(JSON.parse(storedIntegrations));
        if (storedTeam) setTeam(JSON.parse(storedTeam));

        if (storedCampaigns) {
            setCampaigns(JSON.parse(storedCampaigns));
        } else {
            setCampaigns([]);
        }
    }, []);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('creatorshq_leads', JSON.stringify(leads));
    }, [leads]);

    useEffect(() => {
        localStorage.setItem('creatorshq_content', JSON.stringify(content));
    }, [content]);

    useEffect(() => {
        localStorage.setItem('creatorshq_rules', JSON.stringify(rules));
    }, [rules]);

    useEffect(() => {
        localStorage.setItem('creatorshq_subscriptions', JSON.stringify(subscriptions));
    }, [subscriptions]);

    useEffect(() => {
        localStorage.setItem('creatorshq_campaigns', JSON.stringify(campaigns));
    }, [campaigns]);

    useEffect(() => {
        localStorage.setItem('creatorshq_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem('creatorshq_activities', JSON.stringify(activities));
    }, [activities]);

    useEffect(() => {
        localStorage.setItem('creatorshq_integrations', JSON.stringify(integrations));
    }, [integrations]);

    useEffect(() => {
        localStorage.setItem('creatorshq_team', JSON.stringify(team));
    }, [team]);

    const addLead = (lead: Omit<Lead, 'id' | 'date'>) => {
        const newLead: Lead = {
            ...lead,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString()
        };
        setLeads([...leads, newLead]);
    };

    const addContent = (item: Omit<ContentItem, 'id' | 'date'>) => {
        const newItem: ContentItem = {
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleString()
        };
        setContent([...content, newItem]);
    };

    const addRule = (rule: Omit<AutomationRule, 'id'>) => {
        const newRule: AutomationRule = {
            ...rule,
            id: Math.random().toString(36).substr(2, 9)
        };
        setRules([...rules, newRule]);
    };

    const addSubscription = (sub: any) => {
        const newSub = {
            ...sub,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString()
        };
        setSubscriptions([...subscriptions, newSub]);
    };

    const addCampaign = (campaign: Omit<Campaign, 'id' | 'status' | 'applicants'>) => {
        const newCampaign: Campaign = {
            ...campaign,
            id: Math.random().toString(36).substr(2, 9),
            status: 'Open',
            applicants: []
        };
        setCampaigns([...campaigns, newCampaign]);
        addActivity({
            type: 'campaign',
            message: `New campaign launched: ${campaign.title}`
        });
    };

    const applyToCampaign = (id: string, userEmail: string) => {
        setCampaigns(prev => prev.map(c => {
            if (c.id === id) {
                if (c.applicants.includes(userEmail)) return c;
                addActivity({
                    type: 'campaign',
                    message: `Application submitted for ${c.title}`
                });
                return { ...c, applicants: [...c.applicants, userEmail], status: 'Applied' };
            }
            return c;
        }));
    };

    const updateCampaign = (id: string, updates: Partial<Campaign>) => {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const addActivity = (activity: Omit<Activity, 'id' | 'timestamp' | 'read'>) => {
        const newActivity: Activity = {
            ...activity,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            read: false
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50
    };

    const markActivitiesRead = () => {
        setActivities(prev => prev.map(a => ({ ...a, read: true })));
    };

    const toggleIntegration = (id: string) => {
        setIntegrations(prev => prev.map(i => {
            if (i.id === id) {
                const newState = !i.connected;
                addActivity({
                    type: 'integration',
                    message: `${i.name} integration ${newState ? 'activated' : 'deactivated'}`
                });
                return { ...i, connected: newState };
            }
            return i;
        }));
    };

    const inviteTeamMember = (email: string, role: string) => {
        const newMember: TeamMember = {
            id: Math.random().toString(36).substr(2, 9),
            name: email.split('@')[0],
            email,
            role,
            status: 'Invited'
        };
        setTeam([...team, newMember]);
        addActivity({
            type: 'team',
            message: `Invitation sent to ${email} as ${role}`
        });
    };

    return (
        <AppContext.Provider value={{
            leads,
            content,
            rules,
            subscriptions,
            campaigns,
            users,
            activities,
            integrations,
            team,
            connections,
            isAnyConnected,
            addLead,
            addContent,
            addRule,
            addSubscription,
            addCampaign,
            applyToCampaign,
            updateCampaign,
            addActivity,
            markActivitiesRead,
            toggleIntegration,
            inviteTeamMember,
            deleteUser: (email) => setUsers(prev => prev.filter(u => u.email !== email)),
            updateUser: (email, updates) => setUsers(prev => prev.map(u => u.email === email ? { ...u, ...updates } : u)),
            addUser: (user) => setUsers(prev => {
                if (prev.find(u => u.email === user.email)) return prev;
                return [...prev, user];
            })
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
