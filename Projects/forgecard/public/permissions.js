export function isPro(userData) {

  return (
    userData?.plan === "pro" &&
    userData?.subscriptionStatus === "active"
  );

}

export function isAdmin(userData) {

  return userData?.role === "admin";

}

export function canCreateCard(
  userData,
  totalCards
) {

  // Admin bypass
  if (isAdmin(userData)) {
    return true;
  }

  // Pro users unlimited
  if (isPro(userData)) {
    return true;
  }

  // Free plan limit
  return totalCards < 1;

}

export function canUseAnalytics(userData) {

  return isPro(userData);

}

export function canUsePremiumThemes(userData) {

  return isPro(userData);

}

export function canRemoveBranding(userData) {

  return isPro(userData);

}