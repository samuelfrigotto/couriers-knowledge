const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs básicas para a janela do Angular (sem GSI)
contextBridge.exposeInMainWorld('electronAPI', {
  // APIs básicas do Electron que você pode precisar no futuro
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,

  // Exemplo de como adicionar outras APIs conforme necessário
  // openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // getSystemInfo: () => ipcRenderer.invoke('get-system-info')
});
