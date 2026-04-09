import * as vscode from 'vscode';
import { SettingsService } from './settings-service';
import { AudioService } from './audio-service';
import { StateManager } from './state-manager';
import { LibraryManager } from './library-manager';

export function registerCommands(context: vscode.ExtensionContext) {
  const settings = SettingsService.getInstance();
  const audio = AudioService.getInstance(context);
  const library = LibraryManager.getInstance(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('errorSoundAlert.addSoundToLibrary', async () => {
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Add to Library',
        filters: {
          'Audio Files': ['mp3', 'wav', 'ogg', 'aac', 'm4a']
        }
      };

      const fileUri = await vscode.window.showOpenDialog(options);
      if (fileUri && fileUri[0]) {
        const entry = await library.addSound(fileUri[0]);
        if (entry) {
          vscode.window.showInformationMessage(`Added ${entry.name} to sound library.`);
        }
      }
    }),

    vscode.commands.registerCommand('errorSoundAlert.selectCustomSound', async () => {
// ...
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Select Error Sound',
        filters: {
          'Audio Files': ['mp3', 'wav', 'ogg', 'aac', 'm4a']
        }
      };

      const fileUri = await vscode.window.showOpenDialog(options);
      if (fileUri && fileUri[0]) {
        await settings.setCustomAudioPath(fileUri[0].fsPath);
        // Also automatically switch source to 'custom' so the user doesn't have to do it manually
        await vscode.workspace.getConfiguration('errorSoundAlert').update('audioSource', 'custom', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Error sound path updated to: ${fileUri[0].fsPath}`);
      }
    }),

    vscode.commands.registerCommand('errorSoundAlert.testSound', async () => {
      await audio.playErrorSound();
      vscode.window.showInformationMessage('Testing error sound...');
    }),

    vscode.commands.registerCommand('errorSoundAlert.resetSound', async () => {
      await settings.setCustomAudioPath('');
      vscode.window.showInformationMessage('Error sound reset to default.');
    }),

    vscode.commands.registerCommand('errorSoundAlert.toggleMute', async () => {
      const newState = !settings.mute;
      await settings.setMute(newState);
      vscode.window.showInformationMessage(`Error Sound Alert is now ${newState ? 'Muted' : 'Unmuted'}.`);
    }),

    vscode.commands.registerCommand('errorSoundAlert.showStatus', () => {
      const status = [
        `Enabled: ${settings.enabled}`,
        `Muted: ${settings.mute}`,
        `Scope: ${settings.scope}`,
        `Source: ${settings.audioSource}`,
        `Custom Path: ${settings.customAudioPath || 'None'}`
      ].join('\n');
      
      vscode.window.showInformationMessage('Error Sound Alert Status', { modal: true, detail: status });
      audio.showOutput();
    })
  );
}
