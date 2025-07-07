import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const pushupProvider = new PushupCounterProvider(context);

  vscode.window.registerTreeDataProvider("pushupCounter", pushupProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand("pushup.startCount", () => {
      context.globalState.update("pushup.enabled", true);
      vscode.window.showInformationMessage("Better make no mistake, counting started.");
    }),

    vscode.commands.registerCommand("pushup.stopCount", () => {
      context.globalState.update("pushup.enabled", false);
      vscode.window.showInformationMessage("Counting stopped. Hope you do not cheat!");
    }),

    vscode.commands.registerCommand("pushup.resetCount", () => {
      context.globalState.update("pushups", 0);
      pushupProvider.refresh();
      vscode.window.showInformationMessage("Pushup count resetted.");
    }),

    vscode.workspace.onDidSaveTextDocument((document) => {
      if (!context.globalState.get("pushup.enabled", false)) return;

      const lastLineCount = context.globalState.get(`${document.uri.toString()}.lineCount`, 0);
      context.globalState.update(`${document.uri.toString()}.lineCount`, document.lineCount);

      const errors = vscode.languages.getDiagnostics(document.uri).filter((diag) => diag.severity === vscode.DiagnosticSeverity.Error).length;

      const pushups = context.globalState.get<number>("pushups", 0);

      // If the line count has changed significantly
      if (errors === 0) {
        if (Math.abs(lastLineCount - document.lineCount) > 2) {
          vscode.window.showInformationMessage("Great job! You have no errors this save, very good.");
          context.globalState.update("pushups", Math.max(0, pushups - 1));
          pushupProvider.refresh();
        }
        return;
      }

      context.globalState.update("pushups", pushups + errors);
      pushupProvider.refresh();
      vscode.window.showInformationMessage(`You got ${errors} errors in your code 😡😡😡😡😡😡 You have to do ${pushups + errors} now 😡😡😡😡😡`);
    })
  );
}

class PushupCounterProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  // This method is called to get the visual representation of a data item.
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  // This method is called to get the children of a data item.
  // If `element` is undefined, it should return the root-level items.
  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    // For this simple example, we have no nested items, so we always return the root items.
    if (element) {
      return Promise.resolve([]);
    }

    // Get the current count from global state.
    const pushupCount = this.context.globalState.get<number>("pushups", 0);

    // Create the tree items to display in the sidebar.
    const countItem = new vscode.TreeItem(`Total Push-ups: ${pushupCount}`);
    const infoItem = new vscode.TreeItem("Save a file with errors to add more!");

    // Set a custom icon for the count item.
    countItem.iconPath = new vscode.ThemeIcon("flame"); // 📛

    return Promise.resolve([countItem, infoItem]);
  }
}

export function deactivate() {}
