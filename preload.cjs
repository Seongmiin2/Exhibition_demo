const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wipKiosk', {
  platform: process.platform,
  restart: () => ipcRenderer.invoke('kiosk:restart'),
  quit: () => ipcRenderer.invoke('kiosk:quit'),
  relay: {
    setState: (payload) => ipcRenderer.invoke('relay:set-state', payload),
    getStatus: () => ipcRenderer.invoke('relay:get-status')
  }
});
