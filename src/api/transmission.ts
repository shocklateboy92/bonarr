const TRANSMISSION_URL = import.meta.env.VITE_TRANSMISSION_URL || 'http://localhost:9091/transmission/rpc';
const TRANSMISSION_USERNAME = import.meta.env.VITE_TRANSMISSION_USERNAME;
const TRANSMISSION_PASSWORD = import.meta.env.VITE_TRANSMISSION_PASSWORD;

interface TorrentStatus {
  0: 'stopped';
  1: 'check-pending';
  2: 'checking';
  3: 'download-pending';
  4: 'downloading';
  5: 'seed-pending';
  6: 'seeding';
}

export interface TorrentFile {
  bytesCompleted: number;
  length: number;
  name: string;
  priority: number;
  wanted: boolean;
}

export interface TorrentWithFiles extends Torrent {
  files: TorrentFile[];
  fileStats: {
    bytesCompleted: number;
    wanted: boolean;
    priority: number;
  }[];
}

export interface Torrent {
  id: number;
  name: string;
  addedDate: number;
  status: keyof TorrentStatus;
  percentDone: number;
  downloadDir: string;
  totalSize: number;
  uploadedEver: number;
  downloadedEver: number;
  rateDownload: number;
  rateUpload: number;
  eta: number;
  error: number;
  errorString: string;
  peersConnected: number;
  seedRatioLimit: number;
  activityDate: number;
  queuePosition: number;
}

export interface TransmissionResponse {
  arguments: {
    torrents: Torrent[];
  };
  result: string;
  tag?: number;
}

class TransmissionRPCClient {
  private sessionId: string | null = null;

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add session ID if we have one
    if (this.sessionId) {
      headers['X-Transmission-Session-Id'] = this.sessionId;
    }

    // Add basic auth if configured
    if (TRANSMISSION_USERNAME && TRANSMISSION_PASSWORD) {
      const credentials = btoa(`${TRANSMISSION_USERNAME}:${TRANSMISSION_PASSWORD}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    return headers;
  }

  private async makeRequest(method: string, arguments_?: object): Promise<any> {
    const body = JSON.stringify({
      method,
      arguments: arguments_ || {},
    });

    const headers = await this.getHeaders();

    try {
      const response = await fetch(TRANSMISSION_URL, {
        method: 'POST',
        headers,
        body,
      });

      // Handle CSRF protection - server returns 409 with session ID
      if (response.status === 409) {
        const sessionId = response.headers.get('X-Transmission-Session-Id');
        if (sessionId) {
          this.sessionId = sessionId;
          // Retry with session ID
          const newHeaders = await this.getHeaders();
          const retryResponse = await fetch(TRANSMISSION_URL, {
            method: 'POST',
            headers: newHeaders,
            body,
          });
          return await retryResponse.json();
        }
      }

      if (!response.ok) {
        throw new Error(`Transmission RPC error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to communicate with Transmission: ${error}`);
    }
  }

  async getTorrents(): Promise<Torrent[]> {
    const fields = [
      'id',
      'name', 
      'addedDate',
      'status',
      'percentDone',
      'downloadDir',
      'totalSize',
      'uploadedEver',
      'downloadedEver',
      'rateDownload',
      'rateUpload',
      'eta',
      'error',
      'errorString',
      'peersConnected',
      'seedRatioLimit',
      'activityDate',
      'queuePosition'
    ];

    const response: TransmissionResponse = await this.makeRequest('torrent-get', {
      fields,
      format: 'objects'
    });

    if (response.result !== 'success') {
      throw new Error(`Transmission RPC failed: ${response.result}`);
    }

    // Sort by newest first (addedDate descending)
    return response.arguments.torrents.sort((a, b) => b.addedDate - a.addedDate);
  }

  async getTorrentFiles(torrentId: number): Promise<TorrentWithFiles> {
    const fields = [
      'id',
      'name',
      'addedDate',
      'status',
      'percentDone',
      'downloadDir',
      'totalSize',
      'uploadedEver',
      'downloadedEver',
      'rateDownload',
      'rateUpload',
      'eta',
      'error',
      'errorString',
      'peersConnected',
      'seedRatioLimit',
      'activityDate',
      'queuePosition',
      'files',
      'fileStats'
    ];

    const response = await this.makeRequest('torrent-get', {
      ids: [torrentId],
      fields,
      format: 'objects'
    });

    if (response.result !== 'success') {
      throw new Error(`Transmission RPC failed: ${response.result}`);
    }

    if (!response.arguments.torrents || response.arguments.torrents.length === 0) {
      throw new Error(`Torrent with ID ${torrentId} not found`);
    }

    return response.arguments.torrents[0] as TorrentWithFiles;
  }

  async addTorrent(magnetUrl: string, downloadDir?: string): Promise<{ id?: number; name?: string; hashString?: string }> {
    const args: any = {
      filename: magnetUrl
    };

    if (downloadDir) {
      args['download-dir'] = downloadDir;
    }

    const response = await this.makeRequest('torrent-add', args);

    if (response.result !== 'success') {
      throw new Error(`Failed to add torrent: ${response.result}`);
    }

    // Return torrent info (either torrent-added or torrent-duplicate)
    return response.arguments['torrent-added'] || response.arguments['torrent-duplicate'] || {};
  }

  getStatusLabel(status: keyof TorrentStatus): string {
    const statusLabels: TorrentStatus = {
      0: 'stopped',
      1: 'check-pending', 
      2: 'checking',
      3: 'download-pending',
      4: 'downloading',
      5: 'seed-pending',
      6: 'seeding'
    };
    return statusLabels[status];
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatSpeed(bytesPerSecond: number): string {
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  formatETA(seconds: number): string {
    if (seconds < 0 || !isFinite(seconds)) return '∞';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

export const transmissionClient = new TransmissionRPCClient();