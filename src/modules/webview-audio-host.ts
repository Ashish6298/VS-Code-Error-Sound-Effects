import * as vscode from 'vscode';
import { LibraryManager, SoundEntry } from './library-manager';
import { SettingsService } from './settings-service';

export class WebviewAudioHost implements vscode.WebviewViewProvider {
  private static instance: WebviewAudioHost;
  private view: vscode.WebviewView | undefined;
  private disposables: vscode.Disposable[] = [];

  private constructor(private context: vscode.ExtensionContext) {
    const library = LibraryManager.getInstance(context);
    library.onLibraryChanged(() => this.updateLibrary(), null, this.disposables);
    
    // Also update when configuration changes (for enable/disable toggle)
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('errorSoundAlert')) {
        this.updateLibrary();
      }
    }, null, this.disposables);
  }

  public static getInstance(context: vscode.ExtensionContext): WebviewAudioHost {
    if (!WebviewAudioHost.instance) {
      WebviewAudioHost.instance = new WebviewAudioHost(context);
    }
    return WebviewAudioHost.instance;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this.context.extensionUri,
        this.context.globalStorageUri
      ]
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async message => {
      const library = LibraryManager.getInstance(this.context);
      const settings = SettingsService.getInstance();

      switch (message.command) {
        case 'toggleEnable':
          await vscode.workspace.getConfiguration('errorSoundAlert').update('enabled', message.value, vscode.ConfigurationTarget.Global);
          break;
        case 'upload':
          await vscode.commands.executeCommand('errorSoundAlert.addSoundToLibrary');
          break;
        case 'select':
          await settings.setActiveSoundId(message.id);
          this.updateLibrary();
          break;
        case 'preview':
          const sound = library.getSounds().find(s => s.id === message.id);
          if (sound) {
            this.play(vscode.Uri.parse(sound.uri), settings.volume);
          }
          break;
        case 'remove':
          await library.removeSound(message.id);
          break;
        case 'refresh':
          this.updateLibrary();
          break;
      }
    }, null, this.disposables);

    this.updateLibrary();

    webviewView.onDidDispose(() => {
      this.view = undefined;
    }, null, this.disposables);
  }

  private updateLibrary() {
    if (this.view) {
      const library = LibraryManager.getInstance(this.context);
      const settings = SettingsService.getInstance();
      this.view.webview.postMessage({
        command: 'updateState',
        sounds: library.getSounds(),
        activeId: settings.activeSoundId,
        enabled: settings.enabled
      });
    }
  }

  public async play(uri: vscode.Uri, volume: number) {
    if (!this.view) return;

    const webviewUri = this.view.webview.asWebviewUri(uri);
    this.view.webview.postMessage({
      command: 'play',
      source: webviewUri.toString(),
      volume: volume
    });
  }

  private getHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sound Library</title>
          <style>
            :root {
              --accent-color: var(--vscode-button-background);
              --hover-color: var(--vscode-button-hoverBackground);
              --text-color: var(--vscode-foreground);
              --dim-text: var(--vscode-descriptionForeground);
              --border-color: var(--vscode-divider);
              --card-bg: var(--vscode-sideBar-background);
              --card-hover: var(--vscode-list-hoverBackground);
            }

            body { 
              font-family: var(--vscode-font-family); 
              padding: 12px; 
              color: var(--text-color); 
              background: var(--vscode-sideBar-background); 
              margin: 0;
              user-select: none;
            }

            .container {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }

            .header { 
              display: flex; 
              flex-direction: column;
              gap: 8px;
              border-bottom: 1px solid var(--border-color);
              padding-bottom: 12px;
            }

            .title-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .title-row h3 { 
              margin: 0; 
              font-size: 11px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              color: var(--dim-text);
            }

            .status-badge {
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 10px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-active { background: #2ea04333; color: #3fb950; }
            .status-inactive { background: #da363333; color: #f85149; }

            .master-toggle {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: var(--vscode-list-inactiveSelectionBackground);
              padding: 8px 12px;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .master-toggle:hover { background: var(--card-hover); }

            .toggle-label { font-size: 12px; font-weight: 500; }
            .toggle-btn { 
              width: 32px; height: 16px; 
              background: #666; 
              border-radius: 10px; 
              position: relative; 
              transition: background 0.3s;
            }
            .toggle-btn.on { background: #2ea043; }
            .toggle-btn::after {
              content: '';
              position: absolute;
              left: 2px; top: 2px;
              width: 12px; height: 12px;
              background: white;
              border-radius: 50%;
              transition: transform 0.2s;
            }
            .toggle-btn.on::after { transform: translateX(16px); }

            .section-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }

            .add-btn { 
              background: var(--accent-color); 
              color: var(--vscode-button-foreground); 
              border: none; 
              padding: 6px 12px; 
              cursor: pointer; 
              border-radius: 4px; 
              font-size: 11px; 
              font-weight: 600;
              transition: 0.2s;
            }
            .add-btn:hover { background: var(--hover-color); opacity: 0.9; }
            
            .sound-list { display: flex; flex-direction: column; gap: 6px; }
            .sound-item { 
              background: var(--vscode-list-inactiveSelectionBackground); 
              padding: 10px; 
              border-radius: 6px; 
              display: flex; 
              gap: 10px;
              align-items: center;
              border: 1.5px solid transparent;
              transition: 0.2s;
            }
            .sound-item:hover { background: var(--card-hover); }
            .sound-item.active { border-color: var(--accent-color); background: var(--vscode-list-activeSelectionBackground); }
            
            .sound-icon { font-size: 16px; opacity: 0.7; }
            .sound-info { flex: 1; min-width: 0; }
            .sound-name { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
            .sound-meta { font-size: 10px; color: var(--dim-text); }
            
            .actions { display: flex; gap: 6px; }
            .action-btn { 
              background: transparent; 
              color: var(--text-color); 
              opacity: 0.5; 
              border: none;
              padding: 4px;
              cursor: pointer; 
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: 0.2s;
            }
            .action-btn:hover { opacity: 1; background: rgba(255,255,255,0.1); }
            .action-btn.active-indicator { color: var(--accent-color); opacity: 1; }
            
            .footer {
              margin-top: auto;
              padding-top: 16px;
              font-size: 10px;
              color: var(--dim-text);
              text-align: center;
            }

            /* Animations */
            @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            .sound-item { animation: fadeIn 0.3s ease-out forwards; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="title-row">
                      <h3>Power Control</h3>
                      <span id="status-badge" class="status-badge">...</span>
                  </div>
                  <div class="master-toggle" onclick="toggleEnable()">
                      <span class="toggle-label">Extension Status</span>
                      <div id="toggle-btn" class="toggle-btn"></div>
                  </div>
              </div>

              <div>
                  <div class="section-header">
                      <h3>Library</h3>
                      <button class="add-btn" onclick="upload()">+ Add Sound</button>
                  </div>
                  <div id="sound-list" class="sound-list">
                      <!-- Sounds injected here -->
                  </div>
              </div>

              <div class="footer">
                  Error Sound Alert v1.0.0
              </div>
          </div>

          <audio id="audio-player"></audio>
          
          <script>
              const vscode = acquireVsCodeApi();
              const player = document.getElementById('audio-player');
              let isEnabled = true;

              function toggleEnable() {
                  isEnabled = !isEnabled;
                  vscode.postMessage({ command: 'toggleEnable', value: isEnabled });
              }

              function upload() { vscode.postMessage({ command: 'upload' }); }
              function select(id) { vscode.postMessage({ command: 'select', id }); }
              function preview(id) { vscode.postMessage({ command: 'preview', id }); }
              function remove(id) { vscode.postMessage({ command: 'remove', id }); }

              window.addEventListener('message', event => {
                  const message = event.data;
                  switch (message.command) {
                      case 'play':
                          player.src = message.source;
                          player.volume = message.volume;
                          player.play().catch(e => console.error(e));
                          break;
                      case 'updateState':
                          isEnabled = message.enabled;
                          updateUI(message.sounds, message.activeId, message.enabled);
                          break;
                  }
              });

              function updateUI(sounds, activeId, enabled) {
                  // Update Toggle
                  const toggleBtn = document.getElementById('toggle-btn');
                  const statusBadge = document.getElementById('status-badge');
                  
                  if (enabled) {
                      toggleBtn.classList.add('on');
                      statusBadge.textContent = 'Active';
                      statusBadge.className = 'status-badge status-active';
                  } else {
                      toggleBtn.classList.remove('on');
                      statusBadge.textContent = 'Muted';
                      statusBadge.className = 'status-badge status-inactive';
                  }

                  // Render Library
                  const container = document.getElementById('sound-list');
                  container.innerHTML = '';
                  sounds.forEach((sound, index) => {
                      const isActive = sound.id === activeId;
                      const div = document.createElement('div');
                      div.className = 'sound-item' + (isActive ? ' active' : '');
                      div.style.animationDelay = (index * 0.05) + 's';
                      
                      div.innerHTML = \`
                          <div class="sound-icon">\${sound.isBundled ? '📦' : '🎵'}</div>
                          <div class="sound-info">
                              <span class="sound-name" title="\${sound.name}">\${sound.name}</span>
                              <span class="sound-meta">\${sound.isBundled ? 'Extension Asset' : 'User Library'}</span>
                          </div>
                          <div class="actions">
                              <button class="action-btn" onclick="preview('\${sound.id}')" title="Preview Sample">▶</button>
                              <button class="action-btn \${isActive ? 'active-indicator' : ''}" onclick="select('\${sound.id}')" title="Use this Sound">
                                  \${isActive ? '▣' : '▢'}
                              </button>
                              \${!sound.isBundled ? \`<button class="action-btn" onclick="remove('\${sound.id}')" title="Delete from Library">✕</button>\` : ''}
                          </div>
                      \`;
                      container.appendChild(div);
                  });
              }
              
              // Initial refresh
              vscode.postMessage({ command: 'refresh' });
          </script>
      </body>
      </html>
    `;
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
