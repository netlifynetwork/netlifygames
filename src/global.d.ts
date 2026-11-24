export {};
declare global {
  interface DownloadUpdate {
    id: string; filename: string; receivedBytes: number; totalBytes: number;
    percent: number; state: "progressing" | "completed" | "cancelled" | "interrupted";
    path?: string; message?: string;
  }
  interface Window {
    gamesDesktop?: {
      startDownload(url: string, filename: string): Promise<{ id: string }>;
      pauseDownload(id: string): Promise<void>;
      resumeDownload(id: string): Promise<void>;
      cancelDownload(id: string): Promise<void>;
      chooseFolder(): Promise<string | null>;
      openFile(path: string): Promise<void>;
      onDownloadUpdate(callback: (event: DownloadUpdate) => void): () => void;
    };
  }
}