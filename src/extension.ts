import * as vscode from 'vscode';
import { SettingsService } from './modules/settings-service';
import { DiagnosticMonitor } from './modules/diagnostic-monitor';
import { registerCommands } from './modules/commands';
import { AudioService } from './modules/audio-service';
import { TerminalMonitor } from './modules/terminal-monitor';
import { WebviewAudioHost } from './modules/webview-audio-host';

export function activate(context: vscode.ExtensionContext) {
  const audio = AudioService.getInstance(context);
  audio.log('Error Sound Alert extension is now active!');
  vscode.window.showInformationMessage('Error Sound Alert is now ACTIVE!');

  // Initialize services
  SettingsService.getInstance();
  DiagnosticMonitor.getInstance(context);
  TerminalMonitor.getInstance(context);

  // Register sidebar audio host
  const audioHost = WebviewAudioHost.getInstance(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('errorSoundAlert.audioView', audioHost)
  );
  
  // Register commands
  registerCommands(context);

  audio.log('Activation complete.', 'debug');
}

export function deactivate() {
  // Dispose instances if necessary
  SettingsService.getInstance().dispose();
  // DiagnosticMonitor and AudioService are managed via context.subscriptions if they registered disposables.
  // We can add explicit dispose calls if needed.
}
