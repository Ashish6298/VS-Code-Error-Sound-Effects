import * as vscode from 'vscode';
import * as fs from 'fs';
import { SettingsService } from './settings-service';
import { WebviewAudioHost } from './webview-audio-host';
import { LibraryManager } from './library-manager';

export class AudioService {
  private static instance: AudioService;
  private settings = SettingsService.getInstance();
  private lastPlayed = 0;
  private outputChannel: vscode.OutputChannel;

  private constructor(private context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel('Error Sound Alert');
  }

  public static getInstance(context: vscode.ExtensionContext): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService(context);
    }
    return AudioService.instance;
  }

  public async playErrorSound() {
    if (!this.settings.enabled || this.settings.mute) {
      this.log('Skipping sound: Disabled or Muted', 'debug');
      return;
    }

    const now = Date.now();
    if (now - this.lastPlayed < this.settings.cooldownMs) {
      this.log('Skipping sound: Cooldown in effect', 'debug');
      return;
    }

    const soundUri = await this.resolveSoundUri();
    if (!soundUri) {
      this.log('Failed to resolve sound URI', 'error');
      return;
    }

    try {
      const host = WebviewAudioHost.getInstance(this.context);
      await host.play(soundUri, this.settings.volume);
      this.lastPlayed = now;
      this.log(`Playing sound: ${soundUri.fsPath}`, 'info');
    } catch (err) {
      this.log(`Playback error: ${err}`, 'error');
    }
  }


  private async resolveSoundUri(): Promise<vscode.Uri | undefined> {
    const library = LibraryManager.getInstance(this.context);
    const sounds = await library.getSounds();
    const activeId = this.settings.activeSoundId;

    const activeEntry = sounds.find(s => s.id === activeId);
    if (activeEntry) {
      const uri = vscode.Uri.parse(activeEntry.uri);
      // Check if file still exists
      try {
        await vscode.workspace.fs.stat(uri);
        return uri;
      } catch {
        this.log(`Selected sound ${activeEntry.name} not found. Falling back.`, 'error');
      }
    }

    // Default fallback to the first bundled sound (often the first in list)
    const defaultEntry = sounds.find(s => s.id === 'default');
    if (defaultEntry) {
      return vscode.Uri.parse(defaultEntry.uri);
    }

    return undefined;
  }

  public log(message: string, level: 'info' | 'debug' | 'error' = 'info') {
    const configLevel = this.settings.logLevel;
    if (configLevel === 'none') { return; }
    
    if (level === 'debug' && configLevel !== 'debug') { return; }
    if (level === 'info' && configLevel === 'error') { return; }

    const timestamp = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  public showOutput() {
    this.outputChannel.show();
  }

  public dispose() {
    this.outputChannel.dispose();
  }
}
