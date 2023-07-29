const { app, Tray, nativeImage, Menu } = require('electron');
const AutoLaunch = require('auto-launch');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const access = util.promisify(fs.access);
let tray;

const autoLauncher = new AutoLaunch({
  name: 'React Native Dev Tools By Sashitha',
  path: path.dirname(path.dirname(path.dirname(app.getPath('exe'))))
});

let isEnabledAtStartUp = store.get('isEnabledAtStartUp', false);

async function toggleAutoLaunch () {
  if (isEnabledAtStartUp) {
    try {
      await autoLauncher.disable();
      const isEnabled = await autoLauncher.isEnabled();
      if (!isEnabled) {
        isEnabledAtStartUp = false;
        store.set('isEnabledAtStartUp', isEnabledAtStartUp);
      }
    } catch (e) { }
  } else {
    try {
      await autoLauncher.enable();
      const isEnabled = await autoLauncher.isEnabled();
      if (isEnabled) {
        isEnabledAtStartUp = true;
        store.set('isEnabledAtStartUp', isEnabledAtStartUp);
      }
    } catch (e) { }
  }
}

async function getAndroidHome () {
  try {
    const { stdout: androidSdkRootStdout } = await exec('echo $ANDROID_SDK_ROOT');
    const androidSdkRoot = androidSdkRootStdout.trim();

    // Verify that the Android SDK exists at the detected location
    await access(androidSdkRoot);

    return androidSdkRoot;
  } catch (err) {
    console.error(err);
    throw new Error('Android SDK not found');
  }
}

async function getEmulatorNames () {
  try {
    const androidHome = await getAndroidHome();
    const emulatorPath = `${androidHome}/tools/emulator -list-avds`;
    const { stdout } = await exec(emulatorPath);
    const emulators = stdout.split('\n').filter(Boolean);
    return emulators;
  } catch (err) {
    console.error(err);
    return [];
  }
}

function runEmulator (emulatorName) {
  getAndroidHome().then(androidHome => {
    const emulatorPath = `${androidHome}/emulator/emulator`;
    const emulator = childProcess.spawn(emulatorPath, ['-avd', emulatorName]);

    emulator.stdout.on('data', (data) => {
      console.log(`Emulator ${emulatorName} stdout: ${data}`);
    });

    emulator.stderr.on('data', (data) => {
      console.error(`Emulator ${emulatorName} stderr: ${data}`);
    });

    emulator.on('close', (code) => {
      console.error(`Emulator ${emulatorName} exited with code: ${code}`);
    });
  }).catch(err => {
    console.error(`Error starting emulator: ${err}`);
  });
}

async function updateContextMenu () {
  try {
    const emulatorNames = await getEmulatorNames();
    const emulatorMenuItems = emulatorNames.map((emulator) => {
      return {
        label: `Run ${emulator}`,
        click: () => {
          runEmulator(emulator); // replace this with the function to start an emulator
        }
      };
    });
    const newContextMenu = Menu.buildFromTemplate([
      {
        label: 'Run at startup',
        type: 'checkbox',
        checked: isEnabledAtStartUp,
        click: () => { toggleAutoLaunch(); }
      },
      {
        type: 'separator'
      },
      ...emulatorMenuItems, // spread the emulator menu items into the context menu
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          store.set('isEnabledAtStartUp', isEnabledAtStartUp);
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(newContextMenu);
  } catch (err) {
    console.error(err);
  }
}

function initiateApplicationWindow () {
  app.dock?.hide();
  Menu.setApplicationMenu(new Menu());
  nativeImage.createThumbnailFromPath(path.join(app.isPackaged ? process.resourcesPath + '/app' : app.getAppPath(), 'dist/assets/iphone.png'), { width: 22, height: 22 })
    .then((thumbnail) => {
      tray = new Tray(thumbnail);
      updateContextMenu();
    });
}

app.whenReady().then(initiateApplicationWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Operations to perform on quit, if any
});
