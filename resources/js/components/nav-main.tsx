import * as React from "react";
import { ChevronDown, ChevronRight, ChevronUp, type LucideIcon } from "lucide-react";
import { usePage } from "@inertiajs/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useEffect } from "react";

interface SubNavItem {
  title: string;
  url?: string;
  icon?: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
}

interface NavItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  iconColor?: string;
  children?: SubNavItem[];
}

interface NavMainProps {
  items: NavItem[];
  label?: string;
  collapseAll?: boolean; // still supported externally
}

type ParsedSidebarUrl = {
  pathname: string;
  searchParams: URLSearchParams;
};

const normalizePathname = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

const parseSidebarUrl = (url: string): ParsedSidebarUrl | null => {
  try {
    const baseOrigin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(url, baseOrigin);

    return {
      pathname: normalizePathname(parsed.pathname),
      searchParams: parsed.searchParams,
    };
  } catch {
    return null;
  }
};

const hasRequiredQuery = (
  required: URLSearchParams,
  current: URLSearchParams
): boolean => {
  for (const [key, value] of required.entries()) {
    if (!current.getAll(key).includes(value)) {
      return false;
    }
  }

  return true;
};

const isPathMatch = (targetPath: string, currentPath: string): boolean => {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return (
    currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  );
};

export const NavMain = React.memo(
  ({ items, label = "Platform", collapseAll }: NavMainProps) => {
    const { url: currentPageUrl } = usePage();

    const [openState, setOpenState] = React.useState<Record<string, boolean>>(
      () => {
        if (typeof window === "undefined") {
          return {};
        }

        const storedState = localStorage.getItem("sidebarOpenState");
        if (!storedState) {
          return {};
        }

        try {
          return JSON.parse(storedState) as Record<string, boolean>;
        } catch {
          return {};
        }
      }
    );

    // When true, ignore auto-open behavior based on active route.
    const [forceCollapse, setForceCollapse] = React.useState(false);

    // Persist open state.
    useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }
      localStorage.setItem("sidebarOpenState", JSON.stringify(openState));
    }, [openState]);

    // Apply external collapse/expand-all prop (optional).
    useEffect(() => {
      if (collapseAll === undefined) return;
      const updated: Record<string, boolean> = {};
      items.forEach((item) => (updated[item.title] = !collapseAll));
      setOpenState((prev) => ({ ...prev, ...updated }));
      setForceCollapse(collapseAll);
    }, [collapseAll, items]);

    const parsedCurrentUrl = React.useMemo(
      () => parseSidebarUrl(currentPageUrl || "/"),
      [currentPageUrl]
    );

    const matchesCurrentUrl = React.useCallback(
      (candidateUrl?: string) => {
        if (!candidateUrl || !parsedCurrentUrl) {
          return false;
        }

        const parsedCandidate = parseSidebarUrl(candidateUrl);
        if (!parsedCandidate) {
          return false;
        }

        return (
          isPathMatch(parsedCandidate.pathname, parsedCurrentUrl.pathname) &&
          hasRequiredQuery(
            parsedCandidate.searchParams,
            parsedCurrentUrl.searchParams
          )
        );
      },
      [parsedCurrentUrl]
    );

    const ensureParentOpen = React.useCallback((parent?: string) => {
      if (parent) {
        setOpenState((prev) => ({ ...prev, [parent]: true }));
      }
      // Leave forceCollapse unchanged so explicit collapse stays respected.
    }, []);

    const toggleOpen = React.useCallback((key: string) => {
      setOpenState((prev) => ({ ...prev, [key]: !prev[key] }));
      setForceCollapse(false); // Manual toggle returns to normal behavior.
    }, []);

    // Parent keys (those with children).
    const parentKeys = React.useMemo(
      () => items.filter((i) => i.children?.length).map((i) => i.title),
      [items]
    );

    // Whether every parent is currently open.
    const allOpen = React.useMemo(() => {
      if (parentKeys.length === 0) return true;
      return parentKeys.every((key) => openState[key] === true);
    }, [parentKeys, openState]);

    // Single global toggle that collapses/expands all parents.
    const toggleAll = React.useCallback(() => {
      const nextOpen = !allOpen;
      const updated: Record<string, boolean> = {};
      parentKeys.forEach((key) => (updated[key] = nextOpen));
      setOpenState((prev) => ({ ...prev, ...updated }));
      setForceCollapse(!nextOpen);
    }, [allOpen, parentKeys]);

    return (
      <SidebarGroup>
        <div className="flex items-center justify-between pr-2">
          <SidebarGroupLabel className="text-gray-600 dark:text-gray-300 text-sm">
            {label}
          </SidebarGroupLabel>

          {parentKeys.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              aria-label={allOpen && !forceCollapse ? "បិទទាំងអស់ (Collapse all)" : "បើកទាំងអស់ (Expand all)"}
              title={allOpen && !forceCollapse ? "បិទទាំងអស់ (Collapse all)" : "បើកទាំងអស់ (Expand all)"}
            >
              {allOpen && !forceCollapse ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-xs">បិទទាំងអស់</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-xs">បើកទាំងអស់</span>
                </>
              )}
            </button>
          )}
        </div>

        <SidebarMenu>
          {items.map((item) => {
            const hasSub = !!item.children?.length;
            const Icon = item.icon;
            const isParentOfActive =
              item.children?.some((sub) => matchesCurrentUrl(sub.url)) ?? false;
            const isTopMatch = matchesCurrentUrl(item.url);
            const isTopActive = isTopMatch && !isParentOfActive;

            const isOpen = forceCollapse
              ? (openState[item.title] ?? false)
              : (openState[item.title] ?? (isTopActive || isParentOfActive));

            return (
              <Collapsible key={item.title} asChild open={isOpen}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    onClick={() => {
                      if (hasSub) {
                        ensureParentOpen(item.title);
                      }
                    }}
                  >
                    {item.url ? (
                      <a
                        href={item.url}
                        onClick={() => {
                          if (hasSub) {
                            ensureParentOpen(item.title);
                          }
                        }}
                        aria-current={isTopActive ? "page" : undefined}
                        className={[
                          "flex items-center gap-2 px-3 py-2 rounded-md transition",
                          isTopActive
                            ? "bg-sky-500 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60",
                        ].join(" ")}
                      >
                        <Icon className={`${item.iconColor ?? ""} ${isTopActive ? "text-white" : ""}`} />
                        <span className="leading-8">{item.title}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={[
                          "flex items-center gap-2 w-full px-3 py-2 rounded-md transition",
                          isTopActive
                            ? "bg-sky-500 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60",
                        ].join(" ")}
                        onClick={() => {
                          if (hasSub) toggleOpen(item.title);
                        }}
                        aria-expanded={isOpen}
                        aria-current={isTopActive ? "page" : undefined}
                      >
                        <Icon className={`${item.iconColor ?? ""} ${isTopActive ? "text-white" : ""}`} />
                        <span>{item.title}</span>
                      </button>
                    )}
                  </SidebarMenuButton>

                  {hasSub && (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction
                          className="data-[state=open]:rotate-90"
                          onClick={() => toggleOpen(item.title)}
                          aria-label={isOpen ? "បិទមីនុយរង" : "បើកមីនុយរង"}
                          aria-expanded={isOpen}
                        >
                          <ChevronRight />
                        </SidebarMenuAction>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children!.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = matchesCurrentUrl(sub.url);

                            return (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton asChild>
                                  {sub.url ? (
                                    <a
                                      href={sub.url}
                                      onClick={() => ensureParentOpen(item.title)}
                                      aria-current={isSubActive ? "page" : undefined}
                                      className={[
                                        "flex items-center gap-2 px-2 py-1 rounded transition",
                                        isSubActive
                                          ? "bg-sky-500 text-white"
                                          : "hover:bg-gray-100 dark:hover:bg-gray-800/60",
                                      ].join(" ")}
                                    >
                                      <span className="leading-8">{sub.title}</span>
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => ensureParentOpen(item.title)}
                                      className={[
                                        "flex items-center gap-2 w-full px-2 py-1 rounded transition",
                                        isSubActive
                                          ? "bg-sky-500 text-white"
                                          : "hover:bg-gray-100 dark:hover:bg-gray-800/60",
                                      ].join(" ")}
                                    >
                                      {SubIcon && (
                                        <SubIcon
                                          className={[
                                            "size-4",
                                            isSubActive ? "text-white" : (sub.iconColor ?? ""),
                                          ].join(" ")}
                                        />
                                      )}
                                      <span>{sub.title}</span>
                                    </button>
                                  )}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    );
  }
);

NavMain.displayName = "NavMain";
