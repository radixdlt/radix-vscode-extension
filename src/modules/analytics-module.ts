import * as code from "vscode";

export type AnalyticsCategory = "resim" | "stokenet" | "extension";
export type Analytics = Record<
  AnalyticsCategory,
  { event: (name: string, value?: string) => void }
>;
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
    api_secret: "c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9",
    vscode: code.env,
  },
) => {
  const createCategoryAnalytics = (category: string) => {
    return {
      [category]: {
        event: (name: string, value?: string) => {
          if (vscode.isTelemetryEnabled) {
            fetch(
              `https://www.google-analytics.com/mp/collect?measurement_id=${measurement_id}&api_secret=${api_secret}`,
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
