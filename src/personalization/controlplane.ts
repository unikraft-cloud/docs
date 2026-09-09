import { useAuth, useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";

/* Base URL of the controlplane API, baked in at build time by the www repo
   through ZUDOKU_PUBLIC_CONTROLPLANE_URL. Empty turns personalization off. */
export const CONTROLPLANE_URL = (
  import.meta.env.ZUDOKU_PUBLIC_CONTROLPLANE_URL ?? ""
).replace(/\/+$/, "");

/* The docs stand in for the user's organization with this placeholder. */
export const ORG_PLACEHOLDER = "<my-org>";

/* Organization names are slugs. Anything else never reaches the page. */
const ORG_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

export interface MyOrganization {
  uuid: string;
  name: string;
  displayName: string;
  role: string;
}

/* Relevant part of the GET /v1/me/organizations envelope. */
interface ListMeOrganizationsResponse {
  status?: "success" | "error";
  message?: string;
  data?: { organizations?: unknown };
}

/* Treats the response as untrusted input and keeps only well-formed items. */
const parseOrganizations = (
  body: ListMeOrganizationsResponse | undefined,
): MyOrganization[] => {
  if (body?.status !== "success" || !Array.isArray(body.data?.organizations)) {
    return [];
  }

  const organizations: MyOrganization[] = [];
  for (const item of body.data.organizations as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const { uuid, name, display_name, role } = item as Record<string, unknown>;
    if (
      typeof uuid !== "string" ||
      typeof name !== "string" ||
      !ORG_NAME_PATTERN.test(name)
    ) {
      continue;
    }
    organizations.push({
      uuid,
      name,
      displayName: typeof display_name === "string" ? display_name : name,
      role: typeof role === "string" ? role : "",
    });
  }
  return organizations;
};

export interface MyOrganizationsState {
  /* True when the site has auth and a controlplane URL configured. */
  configured: boolean;
  /* Mirrors Zudoku's auth state so callers need no second hook. */
  isPending: boolean;
  isAuthenticated: boolean;
  organizations: MyOrganization[];
}

/* Returns the signed-in user's organizations. The list is empty while
   signed out, while loading, and after any failure. The query key is
   shared, so every code block on a page reuses one request. */
export const useMyOrganizations = (): MyOrganizationsState => {
  const { isAuthEnabled, isAuthenticated, isPending, profile } = useAuth();
  const { authentication } = useZudoku();

  const configured =
    CONTROLPLANE_URL !== "" && isAuthEnabled && authentication !== undefined;

  const { data } = useQuery({
    queryKey: ["ukc-me-organizations", profile?.sub],
    enabled: configured && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<MyOrganization[]> => {
      if (!authentication) return [];
      try {
        const request = new Request(
          `${CONTROLPLANE_URL}/v1/me/organizations`,
          { headers: { Accept: "application/json" } },
        );
        const response = await fetch(await authentication.signRequest(request));
        const body = (await response.json().catch(() => undefined)) as
          | ListMeOrganizationsResponse
          | undefined;
        return parseOrganizations(body);
      } catch {
        /* An expired token throws here; Zudoku has already signed the
           user out, so the placeholders simply stay in place. */
        return [];
      }
    },
  });

  return {
    configured,
    isPending,
    isAuthenticated,
    organizations: configured && isAuthenticated ? (data ?? []) : [],
  };
};
