const { app, BrowserWindow, ipcMain, Menu, Tray, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of objects to prevent garbage collection
let mainWindow;
let splashWindow;
let tray;
let backendProcess;
let isBackendRunning = false;
let isQuitting = false;

// App paths
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database');
const logPath = path.join(userDataPath, 'logs');

// Ensure directories exist
function ensureDirectoriesExist() {
  [dbPath, logPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Create splash screen
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  splashWindow.loadFile('splash.html');
  splashWindow.center();
  
  // Close splash screen after timeout or when main window is ready
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
    }
  }, 3000);
}

// Create main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless window for custom title bar
    backgroundColor: '#1a1b2e',
    show: false, // Don't show until ready
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'dashboard', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });

  // Create system tray
  createTray();
}

// Create system tray icon
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Co-Founders Outreach', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Dashboard', click: () => {
      mainWindow.show();
      mainWindow.webContents.send('navigate', 'dashboard');
    }},
    { label: 'Messages', click: () => {
      mainWindow.show();
      mainWindow.webContents.send('navigate', 'messages');
    }},
    { label: 'Settings', click: () => {
      mainWindow.show();
      mainWindow.webContents.send('navigate', 'settings');
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      isQuitting = true;
      app.quit();
    }}
  ]);
  
  tray.setToolTip('Co-Founders Outreach');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Start backend server
function startBackendServer() {
  // Path to backend server executable or script
  const backendPath = path.join(__dirname, 'backend', 'src', 'server.js');
  
  // Check if backend exists
  if (!fs.existsSync(backendPath)) {
    console.error('Backend server not found at:', backendPath);
    return;
  }
  
  // Environment variables for backend
  const env = {
    ...process.env,
    NODE_ENV: isDev ? 'development' : 'production',
    DB_PATH: dbPath,
    LOG_PATH: logPath,
    PORT: 3030
  };
  
  // Start backend process
  backendProcess = spawn('node', [backendPath], { env });
  
  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
    if (data.toString().includes('Server running')) {
      isBackendRunning = true;
    }
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend error: ${data}`);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    isBackendRunning = false;
    
    // Restart backend if it crashes and app is not quitting
    if (!isQuitting) {
      console.log('Restarting backend...');
      startBackendServer();
    }
  });
}

// App initialization
app.whenReady().then(() => {
  // Ensure directories exist
  ensureDirectoriesExist();
  
  // Create splash screen
  createSplashWindow();
  
  // Start backend server
  startBackendServer();
  
  // Create main window after a delay to allow backend to start
  setTimeout(createMainWindow, 1000);
  
  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow.show();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up before quitting
app.on('before-quit', () => {
  isQuitting = true;
  
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC handlers
// Backend status
ipcMain.handle('check-backend-status', async () => {
  return { running: isBackendRunning };
});

// Window controls
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.hide();
});

// Analytics data
ipcMain.handle('get-analytics-data', async () => {
  // In a real app, this would fetch from the backend
  // For now, return mock data
  return {
    messageStats: {
      sent: 304,
      responses: 156,
      responseRate: 51,
      unresponsiveRate: 28
    },
    platformPerformance: [
      { platform: 'StartHawk', sent: 180, responses: 92, rate: 51 },
      { platform: 'CoFoundersLab', sent: 124, responses: 64, rate: 52 }
    ],
    timeSaved: {
      hours: 42.5,
      moneySaved: '$2,125.00'
    },
    recentActivity: [
      { type: 'message', platform: 'StartHawk', recipient: 'John D.', time: '2 hours ago', status: 'sent' },
      { type: 'response', platform: 'CoFoundersLab', recipient: 'Sarah M.', time: '4 hours ago', status: 'received' },
      { type: 'follow-up', platform: 'StartHawk', recipient: 'Michael B.', time: '1 day ago', status: 'sent' }
    ],
    monthlyData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      sent: [45, 52, 68, 74, 83, 92],
      responses: [21, 25, 36, 38, 42, 51]
    }
  };
});

// Settings
ipcMain.handle('get-settings', async () => {
  // In a real app, this would fetch from the backend or local storage
  // For now, return mock data
  return {
    account: {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
      hourlyRate: 50,
      timezone: 'utc-5',
      twoFactorAuth: true
    },
    platforms: {
      starthawk: {
        enabled: true,
        accountType: 'paid',
        email: 'john.doe@example.com'
      },
      cofoundersLab: {
        enabled: true,
        accountType: 'paid',
        email: 'john.doe@example.com'
      }
    },
    messaging: {
      defaultTemplate: 'template1',
      followUpDays: 3,
      maxFollowUps: 2
    },
    notifications: {
      email: true,
      desktop: true,
      responses: true,
      followUps: true
    },
    appearance: {
      theme: 'dark',
      compactMode: false
    }
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  // In a real app, this would save to the backend or local storage
  console.log('Saving settings:', settings);
  return { success: true };
});

// App version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
