const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function getDataPath() {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'data');
  }
  return path.join(__dirname, 'data');
}

const dataDir = getDataPath();
const chatsFile = path.join(dataDir, 'chats.json');

ipcMain.handle('save-chats', (event, data) => {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(chatsFile, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('load-chats', () => {
  try {
    if (!fs.existsSync(chatsFile)) return { ok: true, data: null };
    const raw = fs.readFileSync(chatsFile, 'utf-8');
    return { ok: true, data: JSON.parse(raw) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: '코모레비 다방',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
