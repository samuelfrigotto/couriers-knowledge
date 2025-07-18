const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

// Mantemos uma referência global à janela principal
let mainWindow;

function createGsiServer(win) {
    const gsiApp = express();
    gsiApp.use(express.json({ limit: '1mb' }));

    gsiApp.post('/gsi', (req, res) => {
        console.log('[Main Process] Dados GSI recebidos.');

        // Verificamos se a janela ainda existe antes de enviar
        if (win && !win.isDestroyed()) {
            console.log('[Main Process] Enviando dados para a Janela do Angular...');
            win.webContents.send('gsi-data', req.body);
        }

        res.status(200).send('OK');
    });

    gsiApp.listen(3005, () => {
        console.log("✅ [Main Process] Servidor GSI está 'ouvindo' na porta 3005.");
    });
}

function createWindow () {
   mainWindow = new BrowserWindow({
    width: 1280,       // Largura inicial padrão
    height: 800,
    minWidth: 800,     // << LARGURA MÍNIMA: Impede que o usuário encolha demais a janela
    minHeight: 600,    // << Altura mínima
    resizable: true,   // << GARANTIR que a janela possa ser redimensionada
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // ...
    }
  });

  mainWindow.loadURL('http://localhost:4200');
  mainWindow.webContents.openDevTools();

  createGsiServer(mainWindow);
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
