import * as vscode from 'vscode';
import { SettingsService } from './modules/settings-service';
import { DiagnosticMonitor } from './modules/diagnostic-monitor';
import { registerCommands } from './modules/commands';
import { AudioService } from './modules/audio-service';

export function activate(context: vscode.ExtensionContext) {
  const audio = AudioService.getInstance(context);
  audio.log('Error Sound Alert extension (Web) is now active!');

  // Initialize services
  SettingsService.getInstance();
  DiagnosticMonitor.getInstance(context);
  
  // Register commands
  registerCommands(context);

  audio.log('Web activation complete.', 'debug');
}

export function deactivate() {
  SettingsService.getInstance().dispose();
}
