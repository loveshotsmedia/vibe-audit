import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { APP_CONFIG, TabConfig, KpiConfig, ListConfig, ButtonConfig } from './audit.config';

// ---- Types ----

interface NetworkLog {
  url: string;
  method: string;
  status?: number;
  hasData?: boolean;
}

interface KpiResult {
  label: string;
  selector: string;
  value: string | null;
  apiEndpoint?: string;
  networkStatus?: number;
  pass: boolean;
  notes: string;
}

interface ListResult {
  label: string;
  count: number;
  minItems: number;
  pass: boolean;
  notes: string;
}

interface ButtonResult {
  label: string;
  visible: boolean;
  clickedSuccessfully: boolean;
  networkRequestFired: boolean;
  navigationOccurred: boolean;
  modalOpened: boolean;
  toastAppeared: boolean;
  notes: string;
}

interface TabResult {
  name: string;
  path: string;
  url: string;
  redirected: boolean;
  screenshotPath: string;
  networkLogs: NetworkLog[];
  kpis: KpiResult[];
  lists: ListResult[];
  buttons: ButtonResult[];
  consoleErrors: string[];
  anomalies: string[];
}

export interface AuditReport {
  appName: string;
  auditedAt: string;
  tabsAudited: number;
  anomaliesFound: number;
  tabs: TabResult[];
}

// ---- Auth ----

async function authenticate(page: Page): Promise<void> {
  await page.goto(APP_CONFIG.baseUrl, { waitUntil: 'networkidle' });
  const currentUrl = page.url();
  if (currentUrl.includes(APP_CONFIG.auth.successUrlContains)) return;

  const emailInput = page.locator(
    'input[type="email"], input[name="email"], input[placeholder*="email" i]'
  ).first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(APP_CONFIG.auth.email);
    await passwordInput.fill(APP_CONFIG.auth.password);
    await page.keyboard.press('Enter');
    await page.waitForURL(`**${APP_CONFIG.auth.successUrlContains}**`, { timeout: 15000 });
  } else {
    throw new Error(`Login form not found at ${APP_CONFIG.baseUrl}. Check your baseUrl in audit.config.ts.`);
  }
}

// ---- KPI Audit ----

async function auditKpis(
  page: Page,
  kpis: KpiConfig[],
  networkLogs: NetworkLog[]
): Promise<KpiResult[]> {
  const results: KpiResult[] = [];

  for (const kpi of kpis) {
    const selectors = kpi.selector.split(',').map(s => s.trim());
    let value: string | null = null;

    for (const selector of selectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          value = (await el.textContent())?.trim() ?? null;
          break;
        }
      } catch { /* try next */ }
    }

    const apiLog = kpi.apiEndpoint
      ? networkLogs.find(l => l.url.includes(kpi.apiEndpoint!))
      : undefined;

    const cleaned = value?.replace(/[^0-9.-]/g, '') ?? '';
    const numericValue = cleaned ? parseFloat(cleaned) : null;
    const isPlaceholder = ['?', '--', 'undefined', 'null', 'nan', 'n/a'].includes(
      (value ?? '').toLowerCase().trim()
    );

    const pass =
      value !== null &&
      !isPlaceholder &&
      (kpi.expectedMin === undefined || (numericValue !== null && numericValue >= kpi.expectedMin));

    const notes: string[] = [];
    if (value === null) notes.push('Element not found');
    if (isPlaceholder) notes.push(`Shows placeholder: "${value}"`);
    if (numericValue === 0 && kpi.expectedMin && kpi.expectedMin > 0)
      notes.push(`Shows 0, expectedMin is ${kpi.expectedMin}`);
    if (apiLog?.status && apiLog.status >= 400)
      notes.push(`API ${kpi.apiEndpoint} returned HTTP ${apiLog.status}`);
    if (apiLog && apiLog.hasData === false)
      notes.push('API returned empty payload');

    results.push({
      label: kpi.label,
      selector: kpi.selector,
      value,
      apiEndpoint: kpi.apiEndpoint,
      networkStatus: apiLog?.status,
      pass,
      notes: notes.length ? notes.join('; ') : 'OK',
    });
  }

  return results;
}

// ---- List Audit ----

async function auditLists(page: Page, lists: ListConfig[]): Promise<ListResult[]> {
  const results: ListResult[] = [];

  for (const list of lists) {
    const selectors = list.selector.split(',').map(s => s.trim());
    let count = 0;

    for (const selector of selectors) {
      try {
        count = await page.locator(selector).count();
        if (count > 0) break;
      } catch { /* try next */ }
    }

    const min = list.minItems ?? 1;
    const pass = count >= min;
    results.push({
      label: list.label,
      count,
      minItems: min,
      pass,
      notes: pass ? 'OK' : `Found ${count} items, expected at least ${min}`,
    });
  }

  return results;
}

// ---- Button Audit ----

async function auditButtons(
  page: Page,
  buttons: ButtonConfig[],
  networkLogsBefore: number,
  networkLogs: NetworkLog[]
): Promise<ButtonResult[]> {
  const results: ButtonResult[] = [];

  for (const button of buttons) {
    const urlBefore = page.url();
    const logCountBefore = networkLogs.length;

    const btn = page.locator(button.selector).first();
    const visible = await btn.isVisible({ timeout: 2000 }).catch(() => false);

    let clickedSuccessfully = false;
    let navigationOccurred = false;
    let modalOpened = false;
    let toastAppeared = false;
    let networkRequestFired = false;

    if (visible) {
      try {
        await btn.click({ timeout: 3000 });
        await page.waitForTimeout(APP_CONFIG.timing.afterClick);
        clickedSuccessfully = true;

        networkRequestFired = networkLogs.length > logCountBefore;
        navigationOccurred = page.url() !== urlBefore;

        const modal = page
          .locator('[role="dialog"], .modal, [data-testid="modal"]')
          .first();
        modalOpened = await modal.isVisible({ timeout: 1000 }).catch(() => false);

        const toast = page
          .locator('.toast, [role="alert"], [data-testid="toast"], .notification')
          .first();
        toastAppeared = await toast.isVisible({ timeout: 1000 }).catch(() => false);

        if (modalOpened) {
          const closeBtn = page
            .locator(APP_CONFIG.global?.modalClose ?? '[aria-label="Close"]')
            .first();
          await closeBtn.click().catch(() => page.keyboard.press('Escape'));
          await page.waitForTimeout(500);
        }

        if (navigationOccurred) {
          await page.goBack();
          await page.waitForTimeout(APP_CONFIG.timing.pageLoad);
        }
      } catch {
        clickedSuccessfully = false;
      }
    }

    const noResponse =
      clickedSuccessfully &&
      !networkRequestFired &&
      !navigationOccurred &&
      !modalOpened &&
      !toastAppeared;

    results.push({
      label: button.label,
      visible,
      clickedSuccessfully,
      networkRequestFired,
      navigationOccurred,
      modalOpened,
      toastAppeared,
      notes: !visible
        ? 'Button not found with selector'
        : noResponse
        ? 'FAIL: click produced no response (no network request, navigation, modal, or toast) — likely missing onClick handler'
        : 'OK',
    });
  }

  return results;
}

// ---- Tab Audit ----

async function auditTab(
  page: Page,
  tab: TabConfig,
  screenshotDir: string
): Promise<TabResult> {
  const networkLogs: NetworkLog[] = [];
  const consoleErrors: string[] = [];

  page.removeAllListeners('console');
  page.removeAllListeners('request');
  page.removeAllListeners('response');

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/') || url.includes(APP_CONFIG.apiUrl)) {
      networkLogs.push({ url, method: req.method() });
    }
  });

  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('/api/') || url.includes(APP_CONFIG.apiUrl)) {
      const log = networkLogs.find(l => l.url === url && !l.status);
      if (log) {
        log.status = resp.status();
        try {
          const body = await resp.json();
          log.hasData = Array.isArray(body)
            ? body.length > 0
            : body !== null && typeof body === 'object' && Object.keys(body).length > 0;
        } catch {
          log.hasData = false;
        }
      }
    }
  });

  await page.goto(APP_CONFIG.baseUrl + tab.path, {
    waitUntil: 'networkidle',
    timeout: 15000,
  });
  await page.waitForTimeout(APP_CONFIG.timing.pageLoad);

  const finalUrl = page.url();
  const redirected = !finalUrl.includes(tab.path);

  const screenshotPath = path.join(
    screenshotDir,
    `${tab.name.toLowerCase().replace(/\s+/g, '-')}.png`
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const kpis = await auditKpis(page, tab.kpis ?? [], networkLogs);
  const lists = await auditLists(page, tab.lists ?? []);
  const buttons = await auditButtons(page, tab.buttons ?? [], networkLogs.length, networkLogs);

  const anomalies: string[] = [
    ...(redirected ? [`Redirected from ${tab.path} to ${finalUrl}`] : []),
    ...kpis.filter(k => !k.pass).map(k => `KPI "${k.label}": ${k.notes}`),
    ...lists.filter(l => !l.pass).map(l => `List "${l.label}": ${l.notes}`),
    ...buttons
      .filter(b => b.notes !== 'OK' && b.notes !== 'Button not found with selector')
      .map(b => `Button "${b.label}": ${b.notes}`),
    ...networkLogs
      .filter(l => l.status && l.status >= 400)
      .map(l => `API ${l.url} returned HTTP ${l.status}`),
  ];

  return {
    name: tab.name,
    path: tab.path,
    url: finalUrl,
    redirected,
    screenshotPath,
    networkLogs,
    kpis,
    lists,
    buttons,
    consoleErrors,
    anomalies,
  };
}

// ---- Main ----

export async function runAudit(): Promise<AuditReport> {
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser: Browser = await chromium.launch({ headless: false });
  const context: BrowserContext = await browser.newContext();
  const page: Page = await context.newPage();

  try {
    console.log(`\nAuthenticating as ${APP_CONFIG.auth.email}...`);
    await authenticate(page);
    console.log('Authenticated.\n');

    const tabResults: TabResult[] = [];

    for (const tab of APP_CONFIG.tabs) {
      process.stdout.write(`Auditing: ${tab.name}...`);
      const result = await auditTab(page, tab, screenshotDir);
      tabResults.push(result);
      const status = result.anomalies.length === 0 ? ' OK' : ` ${result.anomalies.length} anomalies`;
      console.log(status);
    }

    const report: AuditReport = {
      appName: APP_CONFIG.appName,
      auditedAt: new Date().toISOString(),
      tabsAudited: tabResults.length,
      anomaliesFound: tabResults.reduce((sum, t) => sum + t.anomalies.length, 0),
      tabs: tabResults,
    };

    const reportPath = path.join(process.cwd(), 'audit-findings.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport written to: ${reportPath}`);
    console.log(`Anomalies found: ${report.anomaliesFound}`);

    return report;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  runAudit().catch(err => {
    console.error('Audit failed:', err.message);
    process.exit(1);
  });
}
