import {
  Children,
  cloneElement,
  isValidElement,
  lazy,
  Suspense,
  type ReactElement,
  type ReactNode,
} from "react";
import { useAuth } from "zudoku/hooks";
import { CodeTabPanel, type CodeTabPanelProps } from "zudoku/ui/CodeTabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select";
import {
  ORG_PLACEHOLDER,
  type MyOrganization,
  useMyOrganizations,
} from "./controlplane";
import { setSelectedOrgUuid, usePersonalizationState } from "./store";

/* Loaded lazily to keep Shiki out of the initial bundle, as Zudoku does. */
const CodeTabs = lazy(() =>
  import("zudoku/ui/CodeTabs").then((m) => ({ default: m.CodeTabs })),
);

/* Only panels with this title are personalized. `kraft` panels document the
   legacy CLI and stay as written. */
const PERSONALIZED_TITLE = "unikraft";

interface PersonalizedCodeTabsProps {
  children?: ReactNode;
  syncKey?: string;
  hideIcon?: boolean;
}

/* Matches on displayName, like Zudoku, so it survives HMR module reloads. */
const isCodeTabPanel = (
  child: ReactNode,
): child is ReactElement<CodeTabPanelProps> =>
  isValidElement(child) &&
  (child.type as typeof CodeTabPanel).displayName === CodeTabPanel.displayName;

/* The fence meta string carries the title, e.g. `bash title="unikraft"`. */
const panelTitle = (props: CodeTabPanelProps): string | undefined =>
  props.title ?? props.meta?.match(/title="([^"]*)"/)?.[1];

const isPersonalizable = (
  child: ReactNode,
): child is ReactElement<CodeTabPanelProps> =>
  isCodeTabPanel(child) &&
  panelTitle(child.props) === PERSONALIZED_TITLE &&
  child.props.code.includes(ORG_PLACEHOLDER);

/* The remembered choice wins while it is still one of the user's orgs. */
const resolveOrganization = (
  organizations: MyOrganization[],
  orgUuid: string | undefined,
): MyOrganization | undefined =>
  organizations.find((org) => org.uuid === orgUuid) ?? organizations[0];

const toolbarClass =
  "not-prose mb-1 flex items-center justify-end gap-2 text-xs text-muted-foreground";

/* Drop-in replacement for Zudoku's `<CodeTabs>`. When a `unikraft` panel
   contains `<my-org>`, a toolbar above the block lets a signed-in reader
   pick one of their organizations, and the placeholder is replaced with its
   name in every such panel. Signed-out readers see the placeholder and a
   sign-in link. Without auth or a controlplane URL this renders plain tabs. */
export const PersonalizedCodeTabs = ({
  children,
  ...props
}: PersonalizedCodeTabsProps) => {
  const { login } = useAuth();
  const { configured, isPending, isAuthenticated, organizations } =
    useMyOrganizations();
  const { orgUuid } = usePersonalizationState();

  const hasPlaceholder = Children.toArray(children).some(isPersonalizable);
  const organization = hasPlaceholder
    ? resolveOrganization(organizations, orgUuid)
    : undefined;

  const panels = organization
    ? Children.map(children, (child) =>
        isPersonalizable(child)
          ? cloneElement(child, {
              code: child.props.code.replaceAll(
                ORG_PLACEHOLDER,
                organization.name,
              ),
            })
          : child,
      )
    : children;

  const tabs = (
    <Suspense>
      <CodeTabs {...props}>{panels}</CodeTabs>
    </Suspense>
  );

  if (!hasPlaceholder || !configured || isPending) return tabs;

  if (!isAuthenticated) {
    return (
      <div>
        <div className={toolbarClass}>
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => void login()}
          >
            Sign in to see your organization in this snippet
          </button>
        </div>
        {tabs}
      </div>
    );
  }

  if (!organization) return tabs;

  return (
    <div>
      <div className={toolbarClass}>
        <label htmlFor={`ukc-org-${organization.uuid}`}>Organization</label>
        <Select value={organization.uuid} onValueChange={setSelectedOrgUuid}>
          <SelectTrigger
            id={`ukc-org-${organization.uuid}`}
            className="h-7 w-auto min-w-36 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.uuid} value={org.uuid}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {tabs}
    </div>
  );
};

export default PersonalizedCodeTabs;
