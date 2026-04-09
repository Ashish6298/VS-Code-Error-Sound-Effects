import * as vscode from 'vscode';
import * as path from 'path';

export interface SoundEntry {
  id: string;
  name: string;
  uri: string; // Uri string
  isBundled?: boolean;
}

export class LibraryManager {
  private static instance: LibraryManager;
  private readonly STORAGE_KEY = 'errorSoundAlert.library';
  private _onLibraryChanged = new vscode.EventEmitter<void>();
  public readonly onLibraryChanged = this._onLibraryChanged.event;

  private constructor(private context: vscode.ExtensionContext) {
    this.ensureStorageExists();
  }

  public static getInstance(context: vscode.ExtensionContext): LibraryManager {
    if (!LibraryManager.instance) {
      LibraryManager.instance = new LibraryManager(context);
    }
    return LibraryManager.instance;
  }

  private async ensureStorageExists() {
    try {
      if (this.context.globalStorageUri) {
        await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
        const soundsDir = vscode.Uri.joinPath(this.context.globalStorageUri, 'sounds');
        await vscode.workspace.fs.createDirectory(soundsDir);
      }
    } catch (err) {
      console.error('Failed to create storage directory:', err);
    }
  }

  public getSounds(): SoundEntry[] {
    const customSounds: SoundEntry[] = this.context.globalState.get<SoundEntry[]>(this.STORAGE_KEY, []);
    
    // Add bundled sounds if they exist
    const bundled: SoundEntry[] = [
      { id: 'default', name: 'Default (mallikgalti)', uri: vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'mallikgalti.mp3').toString(), isBundled: true }
    ];

    return [...bundled, ...customSounds];
  }

  public async addSound(fileUri: vscode.Uri): Promise<SoundEntry | undefined> {
    try {
      const fileName = path.basename(fileUri.fsPath);
      const targetUri = vscode.Uri.joinPath(this.context.globalStorageUri, 'sounds', fileName);

      // Copy file to extension storage
      await vscode.workspace.fs.copy(fileUri, targetUri, { overwrite: true });

      const newEntry: SoundEntry = {
        id: `custom_${Date.now()}`,
        name: fileName,
        uri: targetUri.toString()
      };

      const sounds = this.context.globalState.get<SoundEntry[]>(this.STORAGE_KEY, []);
      sounds.push(newEntry);
      await this.context.globalState.update(this.STORAGE_KEY, sounds);

      this._onLibraryChanged.fire();
      return newEntry;
    } catch (err) {
      console.error('Failed to add sound to library:', err);
      return undefined;
    }
  }

  public async removeSound(id: string) {
    const sounds = this.context.globalState.get<SoundEntry[]>(this.STORAGE_KEY, []);
    const index = sounds.findIndex(s => s.id === id);
    if (index !== -1) {
      const entry = sounds[index];
      // Try to delete the file
      try {
        await vscode.workspace.fs.delete(vscode.Uri.parse(entry.uri));
      } catch {}
      
      sounds.splice(index, 1);
      await this.context.globalState.update(this.STORAGE_KEY, sounds);
      this._onLibraryChanged.fire();
    }
  }
}
