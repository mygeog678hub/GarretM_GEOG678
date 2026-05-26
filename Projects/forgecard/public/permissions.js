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

  // Teams
  if (
    userData?.subscription === "teams"
  ) {

    return totalCards < 25;

  }

  // Pro
  if (
    userData?.subscription === "pro"
  ) {

    return totalCards < 10;

  }

  // Free
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