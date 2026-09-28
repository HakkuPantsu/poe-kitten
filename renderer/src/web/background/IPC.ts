import type {
  IpcEvent,
  IpcEventPayload,
  UpdateInfo,
  HostState,
} from "@ipc/types";
import { shallowRef } from "vue";
import Sockette from "sockette";

class HostTransport {
  private evBus = new EventTarget();
  private socket!: Sockette;
  logs = shallowRef("");
  version = shallowRef("0.0.00000");
  updateInfo = shallowRef<UpdateInfo>({ state: "initial" });
  /* set once the websocket is up, so callers can await a ready host */
  private _connected = false;

  async init() {
    this.onEvent("MAIN->CLIENT::log-entry", (entry) => {
      this.logs.value += entry.message;
    });
    this.onEvent("MAIN->CLIENT::updater-state", (info) => {
      this.updateInfo.value = info;
    });
    await new Promise<void>((resolve) => {
      this.socket = new Sockette(`ws://${window.location.host}/events`, {
        onmessage: (e: MessageEvent) => {
          this.selfDispatch(JSON.parse(e.data as string) as IpcEvent);
        },
        onopen: () => {
          this._connected = true;
          resolve();
        },
      });
    });
  }

  selfDispatch(event: IpcEvent) {
    this.evBus.dispatchEvent(
      new CustomEvent(event.name, {
        detail: event.payload,
      }),
    );
  }

  /** True once the event socket is open. Callers must check before sending. */
  get isConnected() {
    return this._connected;
  }

  sendEvent(event: IpcEvent) {
    if (!this._connected) return;
    this.socket.send(JSON.stringify(event));
  }

  onEvent<Name extends IpcEvent["name"]>(
    name: Name,
    cb: (payload: IpcEventPayload<Name>) => void,
  ): AbortController {
    const controller = new AbortController();
    if (!this.isElectron && name.startsWith("MAIN->OVERLAY")) {
      return controller;
    }

    this.evBus.addEventListener(
      name,
      (e) => {
        cb((e as CustomEvent<IpcEventPayload<Name>>).detail);
      },
      { signal: controller.signal },
    );
    return controller;
  }

  /**
   * Read the saved config. Returns parsed JSON, or null when there is none.
   * (`/config` hands back `{ contents: string }`.)
   */
  async getConfig(): Promise<unknown | null> {
    const response = await fetch("/config");
    const state = (await response.json()) as HostState;
    this.version.value = state.version;
    this.updateInfo.value = state.updater;
    if (!state.contents) return null;
    try {
      return JSON.parse(state.contents) as unknown;
    } catch {
      return null;
    }
  }

  async importFile(file: File): Promise<string> {
    const response = await fetch(`/uploads/${file.name}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file,
    });
    const body = (await response.json()) as { name: string };
    return body.name;
  }

  proxy: (typeof window)["fetch"] = async (url, init) => {
    return await window.fetch(`/proxy/${url as string}`, init);
  };

  get isElectron() {
    return navigator.userAgent.includes("Electron");
  }
}

export const MainProcess = new HostTransport();
export const Host = MainProcess;
