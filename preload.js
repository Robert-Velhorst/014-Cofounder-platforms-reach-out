/**
 * Electron IPC Bridge for Co-Founders Outreach
 * 
 * This module handles the communication between the Electron main process
 * and renderer process, providing a secure bridge for accessing backend services.
 */

// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Backend status
    checkBackendStatus: () => ipcRenderer.invoke('check-backend-status'),
    
    // Window controls
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // Analytics data
    getAnalyticsData: () => ipcRenderer.invoke('get-analytics-data'),
    
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // Messages
    getMessages: () => ipcRenderer.invoke('get-messages'),
    sendMessage: (message) => ipcRenderer.invoke('send-message', message),
    
    // Platforms
    getPlatformStatus: () => ipcRenderer.invoke('get-platform-status'),
    connectPlatform: (platform, credentials) => ipcRenderer.invoke('connect-platform', platform, credentials),
    
    // Notifications
    onNotification: (callback) => ipcRenderer.on('notification', (_, ...args) => callback(...args)),
    
    // App version
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
  }
);
