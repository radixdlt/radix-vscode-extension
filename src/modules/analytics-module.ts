import * as code from "vscode";

export type AnalyticsCategory = "resim" | "stokenet" | "extension";
export type Analytics = Record<
  AnalyticsCategory,
  { event: (name: string, value?: string) => void }
>;
/**
 * Responsible for sending analytics events to Google Analytics.
 *
 * @example
 * const analytics = AnalyticsModule();
 * analytics.resim.event("resim_new_account");
 * analytics.extension.event("new_radix_dapp");
 * analytics.stokenet.event("stokenet_new_account");
 */
export const AnalyticsModule = (
  {
    measurement_id,
    api_secret,
    vscode,
  }: {
    measurement_id: string;
    api_secret: string;
    vscode: typeof code.env;
  } = {
    // Google Analytics Measurement ID and API Secret
    // *Note* this is just the identifier for the GA4 Property & Stream
    measurement_id: "G-P4R93X3GNW",
    api_secret: "",
    vscode: code.env,
  },
) => {
  const createCategoryAnalytics = (category: string) => {
    return {
      [category]: {
        event: (name: string, value?: string) => {
          if (vscode.isTelemetryEnabled) {
            fetch(
              `https://google-analytics-proxy.radixdlt.com/mp/collect?measurement_id=${measurement_id}`,
              {
                method: "POST",
                body: JSON.stringify({
                  client_id: vscode.machineId,
                  events: [
                    {
                      name,
                      params: {
                        category,
                        value: value || name,
                      },
                    },
                  ],
                }),
              },
            );
          }
        },
      },
    };
  };

  return {
    ...createCategoryAnalytics("resim"),
    ...createCategoryAnalytics("stokenet"),
    ...createCategoryAnalytics("extension"),
  } as Analytics;
};
