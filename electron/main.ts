import { app, BrowserWindow, ipcMain, session, dialog, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

let mainWindow: BrowserWindow | null = null;
let downloadDirectory = path.join(app.getPath("downloads"), "Netlify Games");
const activeDownloads = new Map<string, Electron.DownloadItem>();
const pendingFilenames: string[] = [];

function sendUpdate(payload: DownloadUpdate) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("downloads:update", payload);
}
interface DownloadUpdate {
  id: string; filename: string; receivedBytes: number; totalBytes: number;
  percent: number; state: "progressing" | "completed" | "cancelled" | "interrupted";
  path?: string; message?: string;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1050, minHeight: 680,
    backgroundColor: "#10141b",
    title: "Netlify Games",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) void mainWindow.loadURL(devUrl);
  else void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(() => {
  fs.mkdirSync(downloadDirectory, { recursive: true });
  createWindow();

  session.defaultSession.on("will-download", (_event, item) => {
    const id = randomUUID();
    const requestedFilename = pendingFilenames.shift();
    const filename = requestedFilename || item.getFilename();
    item.setSavePath(path.join(downloadDirectory, filename));
    activeDownloads.set(id, item);
    const update = (state: DownloadUpdate["state"]) => sendUpdate({
      id, filename, receivedBytes: item.getReceivedBytes(), totalBytes: item.getTotalBytes(),
      percent: item.getTotalBytes() > 0 ? Math.round(item.getReceivedBytes() / item.getTotalBytes() * 100) : 0,
      state, path: item.getSavePath()
    });
    update("progressing");
    item.on("updated", (_event, state) => update(state === "interrupted" ? "interrupted" : "progressing"));
    item.once("done", (_event, state) => {
      activeDownloads.delete(id);
      update(state === "completed" ? "completed" : state === "cancelled" ? "cancelled" : "interrupted");
    });
  });

  ipcMain.handle("downloads:start", async (_event, args: { url: string; filename: string }) => {
    if (!/^https:\/\//i.test(args.url)) throw new Error("Downloads must use a secure HTTPS URL.");
    if (!args.filename || path.basename(args.filename) !== args.filename || args.filename.includes("\\\\")) throw new Error("Invalid download filename.");
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
    if (!win) throw new Error("The app window is not available.");
    pendingFilenames.push(args.filename);
    try { await win.webContents.downloadURL(args.url); }
    catch (error) { pendingFilenames.pop(); throw error; }
    return { id: "starting" };
  });
  ipcMain.handle("downloads:pause", (_event, id: string) => activeDownloads.get(id)?.pause());
  ipcMain.handle("downloads:resume", (_event, id: string) => activeDownloads.get(id)?.resume());
  ipcMain.handle("downloads:cancel", (_event, id: string) => activeDownloads.get(id)?.cancel());
  ipcMain.handle("downloads:choose-folder", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
    if (result.canceled || !result.filePaths[0]) return null;
    downloadDirectory = result.filePaths[0];
    return downloadDirectory;
  });
  ipcMain.handle("downloads:open-file", async (_event, filePath: string) => {
    const relativePath = path.relative(path.resolve(downloadDirectory), path.resolve(filePath));
    if (!filePath || !relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) throw new Error("File is outside the selected downloads folder.");
    const error = await shell.openPath(filePath);
    if (error) throw new Error(error);
  });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });