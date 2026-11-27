const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cafe', {
  saveChats: (data) => ipcRenderer.invoke('save-chats', data),
  loadChats: () => ipcRenderer.invoke('load-chats')
});
