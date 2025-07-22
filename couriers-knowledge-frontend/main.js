const { app, BrowserWindow } = require('electron');
const path = require('path');

// Mantemos uma referência global à janela principal
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,       // Largura inicial padrão
    height: 800,
    minWidth: 800,     // << LARGURA MÍNIMA: Impede que o usuário encolha demais a janela
    minHeight: 600,    // << Altura mínima
    resizable: true,   // << GARANTIR que a janela possa ser redimensionada
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  mainWindow.loadURL('http://localhost:4200');
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
