import * as React from "react";
import { ChevronRight, ChevronUp, ChevronDown, type LucideIcon } from "lucide-react";
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

export const NavMain = React.memo(
  ({ items, label = "Platform", collapseAll }: NavMainProps) => {
    const [activeUrl, setActiveUrl] = React.useState(
      () => localStorage.getItem("sidebarActiveUrl") || "/"
    );

    const [openState, setOpenState] = React.useState<Record<string, boolean>>(
      () => JSON.parse(localStorage.getItem("sidebarOpenState") || "{}")
    );

    // NEW: when true, prevents "active sub auto-expands parent"
    const [forceCollapse, setForceCollapse] = React.useState(false); // NEW

    // persist active url
    useEffect(() => {
      localStorage.setItem("sidebarActiveUrl", activeUrl);
    }, [activeUrl]);

    // persist open state
    useEffect(() => {
      localStorage.setItem("sidebarOpenState", JSON.stringify(openState));
    }, [openState]);

    // Apply external collapse/expand-all prop (optional)
    useEffect(() => {
      if (collapseAll === undefined) return;
      const updated: Record<string, boolean> = {};
      items.forEach((item) => (updated[item.title] = !collapseAll));
      setOpenState((prev) => ({ ...prev, ...updated }));
      setForceCollapse(collapseAll); // NEW: respect external control
    }, [collapseAll, items]);

    const handleClick = React.useCallback((url?: string, parent?: string) => {
      if (url) setActiveUrl(url);
      if (parent) setOpenState((prev) => ({ ...prev, [parent]: true }));
      // Leaving forceCollapse as-is so user’s click doesn’t silently reopen everything
    }, []);

    const toggleOpen = React.useCallback((key: string) => {
      setOpenState((prev) => ({ ...prev, [key]: !prev[key] }));
      setForceCollapse(false); // NEW: a manual toggle returns to normal behavior
    }, []);

    const parentMap = React.useMemo(() => {
      const map = new Map<string, string>();
      items.forEach((item) =>
        item.children?.forEach((sub) => sub.url && map.set(sub.url, item.title))
      );
      return map;
    }, [items]);

    const activeParent = parentMap.get(activeUrl); // parent title if a sub is active

    // Parent keys (those with children)
    const parentKeys = React.useMemo(
      () => items.filter((i) => i.children?.length).map((i) => i.title),
      [items]
    );

    // Whether every parent is currently open
    const allOpen = React.useMemo(() => {
      if (parentKeys.length === 0) return true;
      return parentKeys.every((key) => openState[key] === true);
    }, [parentKeys, openState]);

    // NEW: Single global toggle that collapses/expands all parents
    const toggleAll = React.useCallback(() => {
      const nextOpen = !allOpen;
      const updated: Record<string, boolean> = {};
      parentKeys.forEach((key) => (updated[key] = nextOpen));
      setOpenState((prev) => ({ ...prev, ...updated }));
      setForceCollapse(!nextOpen); // If we’re collapsing, enforce collapse; if expanding, resume normal
    }, [allOpen, parentKeys]);

    return (
      <SidebarGroup>
        {/* Header with single global collapse/expand toggle */}
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

            // Parent is active only if its own URL is active
            const isTopActive = item.url === activeUrl;
            const isParentOfActive = item.title === activeParent;

            // NEW: When forceCollapse is true, we ignore auto-opening via active state
            const isOpen = forceCollapse
              ? (openState[item.title] ?? false)
              : (openState[item.title] ?? (isTopActive || isParentOfActive));

            return (
              <Collapsible key={item.title} asChild open={isOpen}>
                <SidebarMenuItem>
                  {/* Main row (doesn't toggle collapse unless no URL) */}
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    onClick={() => {
                      if (!hasSub && item.url) handleClick(item.url);
                    }}
                  >
                    {item.url ? (
                      <a
                        href={item.url}
                        onClick={(e) => {
                          if (hasSub) return; // Chevron handles toggle for parents with subs
                          handleClick(item.url);
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
                        <span >{item.title}</span>
                      </button>
                    )}
                  </SidebarMenuButton>

                  {/* Chevron to toggle each parent */}
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
                            const isSubActive = sub.url === activeUrl;

                            return (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton asChild>
                                  {sub.url ? (
                                    <a
                                      href={sub.url}
                                      onClick={() => handleClick(sub.url, item.title)}
                                      aria-current={isSubActive ? "page" : undefined}
                                      className={[
                                        "flex items-center gap-2 px-2 py-1 rounded transition",
                                        isSubActive
                                          ? "bg-sky-500 text-white"
                                          : "hover:bg-gray-100 dark:hover:bg-gray-800/60",
                                      ].join(" ")}
                                    >
                                      {/* Optional sub icon */}
                                      {/* {SubIcon && (
                                        <SubIcon
                                          className={[
                                            "size-4",
                                            isSubActive ? "text-white" : (sub.iconColor ?? ""),
                                          ].join(" ")}
                                        />
                                      )} */}
                                      <span className="leading-8">{sub.title}</span>
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleClick(undefined, item.title)}
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
