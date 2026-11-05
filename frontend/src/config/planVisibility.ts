export const MEMBERSHIP_UI_ENABLED = false;

export const PLAN_VISIBILITY = {
  elite: false,
} as const;

export const isPlanVisible = (planName?: string) => {
  const normalized = String(planName || '').trim().toLowerCase();
  if (normalized.includes('elite')) {
    return PLAN_VISIBILITY.elite;
  }
  return true;
};

export const filterVisiblePlans = <T extends Record<string, any>>(plans: T[]) => {
  return plans.filter((plan) => isPlanVisible(plan?.name));
};
