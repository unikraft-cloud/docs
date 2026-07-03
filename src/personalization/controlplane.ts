import { useAuth, useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";

/**
 * Base URL of the Unikraft Cloud control plane API.
 *
 * The personalization feature reads the signed-in user's organization from
 * `GET {CONTROLPLANE_URL}/v1/auth`, authenticated with the user's OIDC access
 * token. The token must carry the `org:metadata` scope, so the OIDC login
 * configured in `zudoku.config.tsx` must request `scope: "openid org:metadata"`.
 */
export const CONTROLPLANE_URL = "https://cloud-console-pr-968.ukp-stable.apw.unikraft.internal";

/** Placeholder used throughout the docs to stand in for the user's org slug. */
export const ORG_PLACEHOLDER = "<my-org>";

/** Only code panels carrying this title are personalized. */
export const UNIKRAFT_TITLE = "unikraft";

/**
 * Relevant part of the `GET /v1/auth` response envelope. Every response carries
 * a `status`; on failure `data` is absent and `status` is `"error"`.
 */
interface GetAuthorizationResponse {
  status?: "success" | "error";
  message?: string;
  data?: {
    organization_name?: string;
    organization_display_name?: string;
    registry?: string;
  };
}

/**
 * Returns the signed-in user's organization slug, or `undefined` when the user
 * is signed out, authentication is unavailable, or the request fails.
 *
 * The query is keyed by the user's subject so switching accounts refetches, and
 * the shared key deduplicates the many code blocks rendered on a single page
 * into a single request.
 */
export const useOrganizationName = (): string | undefined => {
  const { isAuthEnabled, isAuthenticated, profile } = useAuth();
  const { authentication } = useZudoku();

  const { data } = useQuery({
    queryKey: ["unikraft-organization", profile?.sub],
    enabled: isAuthEnabled && isAuthenticated && Boolean(authentication),
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<string | undefined> => {
      if (!authentication) return undefined;

      const request = new Request(`${CONTROLPLANE_URL}/v1/auth`, {
        headers: { Accept: "application/json" },
      });
      const response = await fetch(await authentication.signRequest(request));

      const body = (await response
        .json()
        .catch(() => undefined)) as GetAuthorizationResponse | undefined;

      // The API wraps results in a status envelope; treat any non-success
      // response as failure regardless of the HTTP status code.
      if (body?.status !== "success") return undefined;

      return body.data?.organization_name || undefined;
    },
  });

  return data ?? undefined;
};
