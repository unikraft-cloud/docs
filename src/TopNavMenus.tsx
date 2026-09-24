/// <reference types="zudoku/client" />
import { useMemo } from "react";
import type { NavigationItem } from "zudoku";
import { useZudoku } from "zudoku/hooks";
import type { LucideIcon } from "zudoku/icons";
import { Link, useHref } from "zudoku/router";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "zudoku/ui/NavigationMenu";

export type TopNavMenu = {
  label: string;
  icon?: LucideIcon;
  /**
   * Labels of top-level `navigation` items. The menu links to each one, and
   * shows in the tab row where the first one was.
   */
  tabs: string[];
};

type Tab = {
  label: string;
  icon?: LucideIcon;
  to: string;
  href: string;
  paths: string[];
};

type ResolvedMenu = TopNavMenu & { items: Tab[]; position: number };

const isExternal = (to: string) => /^[a-z][a-z\d+.-]*:/i.test(to);

const withSlash = (path: string) => (path.startsWith("/") ? path : `/${path}`);

// Keep in step with getFirstMatchingPath() in Zudoku, because the tab row
// links each tab to this path, and the CSS finds the tab by that href.
const firstPath = (item: NavigationItem): string | undefined => {
  switch (item.type) {
    case "doc":
    case "custom-page":
      return withSlash(item.path);
    case "link":
      return item.to;
    case "category": {
      if (item.link) {
        return item.link.type === "doc" ? withSlash(item.link.path) : item.link.to;
      }
      const pageIn = (items: NavigationItem[]): string | undefined => {
        for (const child of items) {
          const path =
            child.type === "category" ? pageIn(child.items) : firstPath(child);
          if (path) return path;
        }
      };
      return pageIn(item.items);
    }
    default:
      return undefined;
  }
};

const allPaths = (item: NavigationItem): string[] => {
  switch (item.type) {
    case "doc":
    case "custom-page":
      return [withSlash(item.path)];
    case "link":
      return isExternal(item.to) ? [] : [item.to];
    case "category":
      return [
        ...(item.link ? [firstPath({ ...item, items: [] })!] : []),
        ...item.items.flatMap(allPaths),
      ];
    default:
      return [];
  }
};

// A link item such as the Platform API also owns the pages under its path.
const isOn = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

const tabSelector = (href: string) =>
  `div:has(> [data-top-nav-menu]) > nav:not([data-top-nav-menu]) li:has(> a[href=${JSON.stringify(href)}])`;


const buildCss = (menus: ResolvedMenu[]) => {
  const rules = [
    `div:has(> [data-top-nav-menu]) { justify-content: flex-start; column-gap: 2rem; }`,
    `div:has(> [data-top-nav-menu]) > nav:not([data-top-nav-menu]),
     div:has(> [data-top-nav-menu]) > nav:not([data-top-nav-menu]) > ul { display: contents; }`,
    `div:has(> [data-top-nav-menu]) > :not(nav) { order: 9999; margin-inline-start: auto; }`,
    `.top-nav-menu-trigger[data-active]::after {
       content: ""; position: absolute; inset-inline: 0; bottom: 0; height: 2px;
       background: var(--color-primary);
     }`,
  ];

  menus.forEach((menu, index) => {
    const first = tabSelector(menu.items[0]!.href);
    rules.push(`${first}, ${first} ~ li { order: ${2 * (index + 1)}; }`);
    rules.push(
      `${menu.items.map((tab) => tabSelector(tab.href)).join(",\n")} { display: none; }`,
    );
  });

  return rules.join("\n");
};

/**
 * Groups top-level navigation tabs into drop-down menus in the desktop tab row.
 * Use the return value as the "top-navigation-side" slot.
 *
 * The tabs stay in `navigation`, because they give their pages a sidebar and
 * they are the entries in the mobile menu. Only the desktop tab row hides them.
 */
export const topNavMenus = (menus: TopNavMenu[]) => {
  const TopNavMenus = ({ location }: { location: { pathname: string } }) => {
    const { options } = useZudoku();
    const base = useHref("/").replace(/\/$/, "");

    const resolved = useMemo(() => {
      const navigation = options.navigation ?? [];

      return menus
        .flatMap((menu): ResolvedMenu[] => {
          const items = menu.tabs.flatMap((label): Tab[] => {
            const item = navigation.find((entry) => entry.label === label);
            const to = item && firstPath(item);
            if (!item || !to) {
              if (import.meta.env.DEV) {
                console.warn(
                  `[topNavMenus] "${menu.label}": no top-level navigation item has the label "${label}".`,
                );
              }
              return [];
            }
            const icon = "icon" in item ? item.icon : undefined;
            return [
              {
                label,
                icon: typeof icon === "string" ? undefined : icon,
                to,
                href: isExternal(to) ? to : `${base}${to}`,
                paths: allPaths(item),
              },
            ];
          });
          if (items.length === 0) return [];

          const position = navigation.findIndex(
            (entry) => entry.label === items[0]!.label,
          );
          return [{ ...menu, items, position }];
        })
        .sort((a, b) => a.position - b.position);
    }, [options.navigation, base]);

    const css = useMemo(() => buildCss(resolved), [resolved]);

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {resolved.map((menu, index) => (
          <NavigationMenu
            key={menu.label}
            data-top-nav-menu=""
            className="flex-none"
            style={{ order: 2 * index + 1 }}
          >
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  data-active={
                    menu.items.some((tab) => isOn(location.pathname, tab.paths)) ||
                    undefined
                  }
                  className="top-nav-menu-trigger gap-2 [&>svg:last-child]:ml-0 h-auto rounded-none bg-transparent px-0 py-3.5 -mb-px relative font-medium text-foreground/75 hover:bg-transparent hover:text-foreground focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent data-[state=open]:text-foreground data-active:text-foreground"
                >
                  {menu.icon && (
                    <menu.icon size={16} className="align-[-0.125em]" />
                  )}
                  {menu.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex w-max min-w-[200px] flex-col gap-1 p-1">
                    {menu.items.map((tab) => (
                      <li key={tab.label}>
                        {/* The classes go on NavigationMenuLink, not on Link, so
                            that cn() replaces its default "flex-col". */}
                        <NavigationMenuLink
                          asChild
                          className="flex-row items-center justify-start gap-2 select-none rounded-md p-3 text-sm font-medium leading-none no-underline"
                        >
                          <Link to={tab.to}>
                            {tab.icon && (
                              <tab.icon
                                size={16}
                                className="shrink-0 text-muted-foreground"
                              />
                            )}
                            {tab.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        ))}
      </>
    );
  };

  return TopNavMenus;
};
