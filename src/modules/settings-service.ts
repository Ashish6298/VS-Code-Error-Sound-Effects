import * as vscode from 'vscode';

export type SoundScope = 'activeFile' | 'openFiles' | 'workspace';
export type AudioSource = 'bundled' | 'custom';
export type LogLevel = 'info' | 'debug' | 'error' | 'none';

export class SettingsService {
  private static instance: SettingsService;
  private disposables: vscode.Disposable[] = [];

  private constructor() {
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('errorSoundAlert')) {
          this._onConfigChanged.fire();
        }
      })
    );
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private _onConfigChanged = new vscode.EventEmitter<void>();
  public readonly onConfigChanged = this._onConfigChanged.event;

  private get config() {
    return vscode.workspace.getConfiguration('errorSoundAlert');
  }

  public get enabled(): boolean {
    return this.config.get<boolean>('enabled', true);
  }

  public get audioSource(): AudioSource {
    return this.config.get<AudioSource>('audioSource', 'bundled');
  }

  public get customAudioPath(): string {
    return this.config.get<string>('customAudioPath', '');
  }

  public get scope(): SoundScope {
    return this.config.get<SoundScope>('scope', 'activeFile');
  }

  public get debounceMs(): number {
    return this.config.get<number>('debounceMs', 500);
  }

  public get cooldownMs(): number {
    return this.config.get<number>('cooldownMs', 2000);
  }

  public get triggerOnWarnings(): boolean {
    return this.config.get<boolean>('triggerOnWarnings', false);
  }

  public get triggerOnTerminalError(): boolean {
    return this.config.get<boolean>('triggerOnTerminalError', true);
  }

  public get activeSoundId(): string {
    return this.config.get<string>('activeSoundId', 'default');
  }

  public async setActiveSoundId(id: string) {
    await this.config.update('activeSoundId', id, vscode.ConfigurationTarget.Global);
  }

  public get volume(): number {
    return this.config.get<number>('volume', 0.5);
  }

  public get mute(): boolean {
    return this.config.get<boolean>('mute', false);
  }

  public get logLevel(): LogLevel {
    return this.config.get<LogLevel>('logLevel', 'info');
  }

  public async setMute(value: boolean) {
    await this.config.update('mute', value, vscode.ConfigurationTarget.Global);
  }

  public async setCustomAudioPath(path: string) {
    await this.config.update('customAudioPath', path, vscode.ConfigurationTarget.Global);
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
