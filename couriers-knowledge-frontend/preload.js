const { contextBridge, ipcRenderer } = require('electron');

// Expõe a API de forma segura para a janela do Angular
contextBridge.exposeInMainWorld('electronAPI', {
  // Cria uma função 'onGsiData' que o Angular poderá chamar.
  // Ela registra um "ouvinte" para o canal 'gsi-data'.
  onGsiData: (callback) => ipcRenderer.on('gsi-data', (event, ...args) => callback(...args))
});
