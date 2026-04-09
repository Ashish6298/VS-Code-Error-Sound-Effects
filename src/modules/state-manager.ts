import * as vscode from 'vscode';

export class StateManager {
  private static instance: StateManager;
  /**
   * Map of File URI -> Set of diagnostic signatures
   */
  private lastSignatures: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Compares current diagnostics with the last known state.
   * Returns true if at least one NEW error has been introduced.
   */
  public diffAndNotify(uri: vscode.Uri, currentDiagnostics: readonly vscode.Diagnostic[]): boolean {
    const uriStr = uri.toString();
    const newSignatures = new Set<string>();
    let hasNewError = false;

    for (const diag of currentDiagnostics) {
      // Only process Errors (or Warnings if enabled, handled by caller)
      const sig = this.getSignature(diag);
      newSignatures.add(sig);

      const previousSet = this.lastSignatures.get(uriStr);
      if (!previousSet || !previousSet.has(sig)) {
        // This is a new diagnostic signature for this file
        hasNewError = true;
      }
    }

    // Update state
    this.lastSignatures.set(uriStr, newSignatures);

    return hasNewError;
  }

  public clear(uri: vscode.Uri) {
    this.lastSignatures.delete(uri.toString());
  }

  public reset() {
    this.lastSignatures.clear();
  }

  /**
   * Creates a semi-stable signature for a diagnostic.
   * We include Range but only start line/char to be somewhat resilient to edits below.
   */
  private getSignature(diag: vscode.Diagnostic): string {
    return [
      diag.severity,
      diag.message,
      diag.source || '',
      diag.range.start.line,
      diag.range.start.character,
      diag.range.end.line,
      diag.range.end.character
    ].join('|');
  }
}
