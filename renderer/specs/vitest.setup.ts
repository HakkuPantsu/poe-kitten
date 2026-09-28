import { vi } from "vitest";
import fs from "fs";
import path from "path";
import { Headers } from "node-fetch"; // Assuming you are using node-fetch

/* A plain config object, populated synchronously by `defaultConfigMock`.
   It can't be imported from `@/web/settings` because `vi.mock` is hoisted
   above imports, so the factory below must not close over module imports. */
const mockConfig: Record<string, unknown> = {
  configVersion: 1,
  onboarded: true,
  leagueId: null,
  language: "en",
  realm: "pc-ggg",
  preferredTradeSite: "default",
  overlayHotkey: "Shift + Space",
  overlayBackground: "",
  hideOnBlur: false,
  overlayAlwaysClose: false,
  priceCheckHotkey: "Ctrl + F6",
  instantSearch: true,
  showSellerNames: true,
  collapseListings: false,
  offerPresets: [-10, -5, 0],
  coreCurrency: "chaos",
  savedAugments: {},
  readClientLog: false,
  clientLogPath: null,
  notifications: true,
  textToSpeech: false,
  discordWebhook: "",
  autoReply: "",
  restoreClipboard: false,
  accountName: "TestAccount",
};

vi.mock("@/web/settings", async () => {
  const actual = await vi.importActual<typeof import("@/web/settings")>(
    "@/web/settings",
  );
  return {
    ...actual,
    AppConfig: vi.fn(() => mockConfig),
  };
});
// Mock client-string-loader
export const setupClientStringLoaderMock = () => {
  vi.mock("@/assets/client-string-loader", () => ({
    loadClientStrings: vi.fn(async (lang) => {
      const basePath = path.resolve(__dirname, "../public/data/");
      const filePath = path.join(basePath, `${lang}/client_strings.js`);

      try {
        return (await import(/* @vite-ignore */ `${filePath}`)).default;
      } catch (error: unknown) {
        throw new Error(
          `Error loading client_strings.js for ${lang}: ${(error as Error).message}`,
        );
      }
    }),
  }));
};

// Mock fetch
export const setupFetchMock = () => {
  // @ts-expect-error - fetch is not defined in vitest
  global.fetch = vi.fn(async (url) => {
    const basePath = path.resolve(__dirname, "../public/");
    const filePath = path.join(
      basePath,
      url.replace(import.meta.env.BASE_URL, ""),
    );

    const createResponse = (body: unknown, status = 200) => ({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Not Found",
      headers: new Headers(),
      redirected: false,
      type: "default" as ResponseType,
      url: filePath,
      clone: () => createResponse(body, status),
      body: null,
      bodyUsed: false,
      json: async () => JSON.parse(body as string),
      text: async () => body,
      arrayBuffer: async () => body as ArrayBuffer,
      blob: async () => new Blob([body as string]),
      formData: async () => {
        throw new Error("formData not implemented");
      },
    });

    try {
      if (filePath.endsWith(".ndjson")) {
        const data = fs.readFileSync(filePath, "utf8");
        return createResponse(data, 200);
      }
      if (filePath.endsWith(".bin")) {
        const data = fs.readFileSync(filePath);
        return createResponse(
          data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
          200,
        );
      }
      if (filePath.endsWith(".json")) {
        const data = fs.readFileSync(filePath, "utf8");
        return createResponse(data, 200);
      }
    } catch {
      return createResponse(`File not found: ${filePath}`, 404);
    }

    throw new Error(`Unhandled fetch request: ${url}`);
  });
};

// Mock Host.Proxy calls
vi.mock("@/web/background/IPC", () => ({
  Host: {
    proxy: vi.fn(async (url: string, init?: RequestInit) => {
      if (
        url.endsWith("api/trade2/data/stats") ||
        url.endsWith("api/trade2/data/items")
      ) {
        const filePath = path.resolve(__dirname, `data/${url.slice(-5)}.json`);
        const data = fs.readFileSync(filePath, "utf8");
        return {
          ok: true,
          status: 200,
          json: async () => JSON.parse(data),
          text: async () => data,
        };
      }
      return global.fetch(url, init);
    }),
    onEvent: vi.fn(() => new AbortController()),
    sendEvent: vi.fn(),
    getConfig: vi.fn(async () => null),
    importFile: vi.fn(async (file: File) => file.name),
    logs: { value: "" },
    version: { value: "0.0.00000" },
    updateInfo: { value: { state: "initial" } },
    isElectron: true,
  },
}));

export const defaultConfigMock = (overrides: Record<string, unknown> = {}) => {
  Object.assign(mockConfig, overrides);
};

// Consolidate setup
export const setupTests = (configOverrides: Record<string, unknown> = {}) => {
  defaultConfigMock(configOverrides); // Pass overrides here
  setupClientStringLoaderMock();
  setupFetchMock();
};
