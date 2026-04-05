export const hasCompletedOnboarding = (
  organizationId: string | null,
  businessType: string | null
) => Boolean(organizationId && businessType);

export const needsOnboarding = (
  organizationId: string | null,
  businessType: string | null
) => !hasCompletedOnboarding(organizationId, businessType);
