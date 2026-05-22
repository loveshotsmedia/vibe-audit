// audit.config.ts
// TEMPLATE — populated by the vibe-audit skill after your first session.
// Do not edit manually. Run /vibe-audit to update.

export interface KpiConfig {
  label: string;
  selector: string;
  apiEndpoint?: string;
  expectedMin?: number;
  clickable?: boolean;
  clickLeadsTo?: string;
}

export interface ListConfig {
  label: string;
  selector: string;
  apiEndpoint?: string;
  minItems?: number;
}

export interface ButtonConfig {
  label: string;
  selector: string;
  action?: string;
  expect?: string;
}

export interface TabConfig {
  name: string;
  path: string;
  kpis?: KpiConfig[];
  lists?: ListConfig[];
  buttons?: ButtonConfig[];
}

export interface AppConfig {
  appName: string;
  baseUrl: string;
  apiUrl: string;
  auth: {
    email: string;
    password: string;
    successUrlContains: string;
  };
  tabs: TabConfig[];
  global?: {
    modalClose?: string;
    loadingSpinner?: string;
    errorToast?: string;
    emptyState?: string;
  };
  timing: {
    pageLoad: number;
    afterClick: number;
    chartRender: number;
    apiResponse: number;
  };
}

export const APP_CONFIG: AppConfig = {
  appName: 'Your App Name',
  baseUrl: 'https://your-app.lovable.app',
  apiUrl: 'https://your-api.railway.app',

  auth: {
    email: 'your@email.com',
    password: 'your-password',
    successUrlContains: '/dashboard',
  },

  tabs: [
    // Populated by vibe-audit after Phase 0 discovery.
    // Example entry:
    {
      name: 'Dashboard',
      path: '/dashboard',
      kpis: [
        {
          label: 'Active Leads',
          selector: '[data-testid="active-leads"], :text("ACTIVE LEADS") ~ .value',
          apiEndpoint: '/api/leads/count',
          expectedMin: 1,
        },
      ],
      lists: [
        {
          label: 'Recent Activity',
          selector: '.activity-item, [data-testid="activity-row"]',
          apiEndpoint: '/api/activity',
          minItems: 1,
        },
      ],
      buttons: [
        {
          label: 'Sync',
          selector: 'button:has-text("Sync")',
          action: 'click',
          expect: 'triggers sync request',
        },
      ],
    },
  ],

  global: {
    modalClose: '[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close")',
    loadingSpinner: '.loading, .spinner, [data-testid="loading"]',
    errorToast: '.error-toast, [data-testid="error"], [role="alert"]',
    emptyState: '.empty-state, :text("No data"), :text("No results"), :text("Nothing here")',
  },

  timing: {
    pageLoad: 2000,
    afterClick: 1000,
    chartRender: 3000,
    apiResponse: 5000,
  },
};
