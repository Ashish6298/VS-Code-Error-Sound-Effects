import * as vscode from 'vscode';
import { SettingsService } from './settings-service';
import { StateManager } from './state-manager';
import { AudioService } from './audio-service';

export class DiagnosticMonitor {
  private static instance: DiagnosticMonitor;
  private settings = SettingsService.getInstance();
  private state = StateManager.getInstance();
  private disposables: vscode.Disposable[] = [];
  private debounceTimer: NodeJS.Timeout | undefined;

  private constructor(private context: vscode.ExtensionContext) {
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics((e) => this.handleDiagnosticsChange(e))
    );
  }

  public static getInstance(context: vscode.ExtensionContext): DiagnosticMonitor {
    if (!DiagnosticMonitor.instance) {
      DiagnosticMonitor.instance = new DiagnosticMonitor(context);
    }
    return DiagnosticMonitor.instance;
  }

  private handleDiagnosticsChange(event: vscode.DiagnosticChangeEvent) {
    if (!this.settings.enabled) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processDiagnostics(event.uris);
    }, this.settings.debounceMs);
  }

  private processDiagnostics(changedUris: readonly vscode.Uri[]) {
    const audio = AudioService.getInstance(this.context);
    const scope = this.settings.scope;

    let targetUris: vscode.Uri[] = [];

    if (scope === 'activeFile') {
      const activeUri = vscode.window.activeTextEditor?.document.uri;
      if (activeUri && changedUris.some(u => u.toString() === activeUri.toString())) {
        targetUris = [activeUri];
      }
    } else if (scope === 'openFiles') {
      const openUris = new Set(vscode.workspace.textDocuments.map(d => d.uri.toString()));
      targetUris = changedUris.filter(u => openUris.has(u.toString()));
    } else {
      // workspace
      targetUris = [...changedUris];
    }

    if (targetUris.length === 0) return;

    let triggerSound = false;

    for (const uri of targetUris) {
      const diags = vscode.languages.getDiagnostics(uri);
      const relevantDiags = diags.filter(d => {
        if (d.severity === vscode.DiagnosticSeverity.Error) return true;
        if (this.settings.triggerOnWarnings && d.severity === vscode.DiagnosticSeverity.Warning) return true;
        return false;
      });

      if (this.state.diffAndNotify(uri, relevantDiags)) {
        triggerSound = true;
      }
    }

    if (triggerSound) {
      audio.playErrorSound();
    }
  }

  public dispose() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.disposables.forEach(d => d.dispose());
  }
}
