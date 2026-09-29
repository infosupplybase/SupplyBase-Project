export function rememberBookingReturn({ pathname, search = '', hash = '', state = null, stage = null } = {}) {
  const path = `${pathname}${search}${hash}`;
  sessionStorage.setItem(
    'sb.bookingReturn',
    JSON.stringify({
      path,
      state,
      stage,
    })
  );
  return path;
}

export function redirectToLoginForBooking(navigate, location, extraState = {}) {
  const fullPath = rememberBookingReturn({
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: extraState.state || null,
    stage: extraState.returnStage ?? null,
  });

  navigate('/login', {
    replace: true,
    state: {
      from: fullPath,
      fromState: extraState.state || null,
      returnStage: extraState.returnStage ?? null,
    },
  });
}
