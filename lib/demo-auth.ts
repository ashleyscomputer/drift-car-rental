export type DemoUser = { name: string; email: string; provider: 'email' };

export const DEMO_USER_KEY = 'drift_demo_user';
export const DEMO_ACCOUNT_KEY = 'drift_demo_account';
export const CHECKOUT_KEY = 'drift_checkout';
export const ORDERS_KEY = 'drift_demo_orders';

export function readDemoUser(): DemoUser | null {
  // Browser demo profiles are not authenticated MySQL accounts.
  // Replace this with a server-validated session when account services are wired.
  return null;
}

export function saveDemoUser(user: DemoUser) {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('drift-auth-change'));
}

export function signOutDemoUser() {
  localStorage.removeItem(DEMO_USER_KEY);
  window.dispatchEvent(new Event('drift-auth-change'));
}
