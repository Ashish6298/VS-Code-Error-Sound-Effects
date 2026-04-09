import * as vscode from 'vscode';
import { SettingsService } from './settings-service';
import { AudioService } from './audio-service';

export class TerminalMonitor {
  private static instance: TerminalMonitor;
  private settings = SettingsService.getInstance();
  private disposables: vscode.Disposable[] = [];

  private constructor(private context: vscode.ExtensionContext) {
    // onDidEndTerminalShellExecution is available in VS Code 1.93+
    // We cast window as any to avoid compilation errors if types aren't fully updated yet,
    // though our package.json specified 1.93.
    const windowAny = vscode.window as any;
    if (windowAny.onDidEndTerminalShellExecution) {
      this.disposables.push(
        windowAny.onDidEndTerminalShellExecution((event: any) => {
          this.handleTerminalExecutionEnd(event);
        })
      );
    }
  }

  public static getInstance(context: vscode.ExtensionContext): TerminalMonitor {
    if (!TerminalMonitor.instance) {
      TerminalMonitor.instance = new TerminalMonitor(context);
    }
    return TerminalMonitor.instance;
  }

  private handleTerminalExecutionEnd(event: any) {
    if (!this.settings.enabled || !this.settings.triggerOnTerminalError) {
      return;
    }

    const { exitCode } = event;

    // Trigger sound if exit code is non-zero and not undefined.
    // We ignore exit code 130 (SIGINT / Ctrl+C) and 137 (SIGKILL) by default.
    if (exitCode !== undefined && exitCode !== 0 && exitCode !== 130 && exitCode !== 137) {
      const audio = AudioService.getInstance(this.context);
      audio.log(`Terminal command failed with exit code: ${exitCode}. Triggering sound.`, 'info');
      audio.playErrorSound();
    }
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
