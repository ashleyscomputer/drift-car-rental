export type DemoUser = { name: string; email: string; provider: 'email' | 'google' };

export const DEMO_USER_KEY = 'drift_demo_user';
export const DEMO_ACCOUNT_KEY = 'drift_demo_account';
export const CHECKOUT_KEY = 'drift_checkout';
export const ORDERS_KEY = 'drift_demo_orders';

export function readDemoUser(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(DEMO_USER_KEY) || 'null'); } catch { return null; }
}

export function saveDemoUser(user: DemoUser) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('drift-auth-change'));
}

export function signOutDemoUser() {
  localStorage.removeItem(DEMO_USER_KEY);
  window.dispatchEvent(new Event('drift-auth-change'));
}
