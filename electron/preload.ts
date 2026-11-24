import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gamesDesktop", {
  startDownload: (url: string, filename: string) => ipcRenderer.invoke("downloads:start", { url, filename }),
  pauseDownload: (id: string) => ipcRenderer.invoke("downloads:pause", id),
  resumeDownload: (id: string) => ipcRenderer.invoke("downloads:resume", id),
  cancelDownload: (id: string) => ipcRenderer.invoke("downloads:cancel", id),
  chooseFolder: () => ipcRenderer.invoke("downloads:choose-folder"),
  openFile: (path: string) => ipcRenderer.invoke("downloads:open-file", path),
  onDownloadUpdate: (callback: (event: DownloadUpdate) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, update: DownloadUpdate) => callback(update);
    ipcRenderer.on("downloads:update", listener);
    return () => ipcRenderer.removeListener("downloads:update", listener);
  }
});

export interface DownloadUpdate {
  id: string; filename: string; receivedBytes: number; totalBytes: number;
  percent: number; state: "progressing" | "completed" | "cancelled" | "interrupted";
  path?: string; message?: string;
}