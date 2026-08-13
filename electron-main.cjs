const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { relayController } = require('./device/relay-controller.cjs');

let quitting = false;

async function safeOutputsOff(reason) {
  try {
    await relayController.allOff();
  } catch (error) {
    console.error(`Failed to disable relay outputs (${reason}):`, error);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 768,
    height: 1024,
    minWidth: 600,
    minHeight: 800,
    kiosk: process.argv.includes('--kiosk'),
    fullscreen: process.argv.includes('--kiosk'),
    autoHideMenuBar: true,
    backgroundColor: '#eefbf7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  if (process.argv.includes('--devtools')) win.webContents.openDevTools({ mode: 'detach' });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('render-process-gone', () => { void safeOutputsOff('renderer gone'); });
  win.on('unresponsive', () => { void safeOutputsOff('renderer unresponsive'); });
  win.webContents.on('before-input-event', (event, input) => {
    if (process.argv.includes('--kiosk') && (input.key === 'F5' || input.key === 'F11' || (input.control && input.key.toLowerCase() === 'r'))) event.preventDefault();
  });
}

ipcMain.handle('kiosk:restart', async () => { await safeOutputsOff('restart'); app.relaunch(); app.exit(0); });
ipcMain.handle('kiosk:quit', async () => { await safeOutputsOff('operator quit'); app.quit(); });
ipcMain.handle('relay:set-state', (_event, payload) => relayController.setState(payload));
ipcMain.handle('relay:get-status', () => relayController.getStatus());

app.whenReady().then(async () => {
  await safeOutputsOff('startup');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  void safeOutputsOff('all windows closed');
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', (event) => {
  if (quitting) return;
  event.preventDefault();
  quitting = true;
  void safeOutputsOff('application quit').finally(() => app.quit());
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  void safeOutputsOff('uncaught exception').finally(() => process.exit(1));
});
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  void safeOutputsOff('unhandled rejection');
});
