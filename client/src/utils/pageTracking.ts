function normalizePath(path: string): string {
  const pathOnly = path.split(/[?#]/, 1)[0] ?? "";
  return `/${pathOnly.split("/").filter(Boolean).join("/")}`;
}

export function getPageGroup(path: string): string {
  return normalizePath(path).split("/").filter(Boolean)[0] ?? "home";
}

export function buildPublicPagePath(basePath: string, routePath: string): string {
  const base = normalizePath(basePath);
  const route = normalizePath(routePath);
  return route === "/" ? base : `${base}${route}`;
}

export function shouldTrackPageView(
  routePath: string,
  previousRoutePath: string,
  hasPreviousRoute: boolean,
): boolean {
  if (!hasPreviousRoute) return true;
  return getPageGroup(routePath) !== getPageGroup(previousRoutePath);
}
