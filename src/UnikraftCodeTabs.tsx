import {
  Children,
  cloneElement,
  isValidElement,
  lazy,
  Suspense,
  type ReactElement,
  type ReactNode,
} from "react";
import { CodeTabPanel, type CodeTabPanelProps } from "zudoku/ui/CodeTabs";
import {
  ORG_PLACEHOLDER,
  UNIKRAFT_TITLE,
  useOrganizationName,
} from "./personalization/controlplane";

// Lazy-loaded to keep Shiki out of the initial bundle, mirroring Zudoku's own
// default CodeTabs registration.
const CodeTabs = lazy(() =>
  import("zudoku/ui/CodeTabs").then((m) => ({ default: m.CodeTabs })),
);

interface UnikraftCodeTabsProps {
  children?: ReactNode;
  syncKey?: string;
  hideIcon?: boolean;
}

const isCodeTabPanel = (
  child: ReactNode,
): child is ReactElement<CodeTabPanelProps> =>
  isValidElement(child) &&
  (child.type as typeof CodeTabPanel).displayName === CodeTabPanel.displayName;

/** Extracts the `title="..."` value from a fenced block's meta string. */
const titleFromMeta = (meta?: string): string | undefined =>
  meta?.match(/title="([^"]*)"/)?.[1];

/**
 * Drop-in replacement for Zudoku's `<CodeTabs>` that personalizes Unikraft CLI
 * snippets for signed-in users.
 *
 * Every `title="unikraft"` panel containing the `<my-org>` placeholder is
 * rewritten with the user's actual organization slug. Legacy `kraft` panels,
 * any other code, and the signed-out experience are left untouched, so the
 * feature degrades gracefully when the user is not signed in or the
 * organization cannot be resolved.
 */
export const UnikraftCodeTabs = ({
  children,
  ...props
}: UnikraftCodeTabsProps) => {
  const organizationName = useOrganizationName();

  const personalizedChildren = organizationName
    ? Children.map(children, (child) => {
        if (!isCodeTabPanel(child)) return child;

        const { code, meta, title } = child.props;
        const panelTitle = title ?? titleFromMeta(meta);

        if (
          panelTitle !== UNIKRAFT_TITLE ||
          typeof code !== "string" ||
          !code.includes(ORG_PLACEHOLDER)
        ) {
          return child;
        }

        return cloneElement(child, {
          code: code.replaceAll(ORG_PLACEHOLDER, organizationName),
        });
      })
    : children;

  return (
    <Suspense>
      <CodeTabs {...props}>{personalizedChildren}</CodeTabs>
    </Suspense>
  );
};

export default UnikraftCodeTabs;
