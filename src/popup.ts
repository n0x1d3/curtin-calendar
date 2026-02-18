import './popup.css';
import { command } from './types';

// --- DOM references ---
const visible = 'inline-block';
const hidden = 'none';
const button = document.getElementById(command.download) as HTMLElement;
const loader = document.getElementById('loader') as HTMLElement;
const errorElement = document.getElementById('error') as HTMLElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;

// --- Loading state ---

// Shows the spinner while a download is in progress (forward key exists in storage),
// or the download button when idle. Returns whether loading is active.
async function isLoading() {
  const { forward } = await chrome.storage.local.get('forward');
  const loading = forward !== undefined;

  if (loading) {
    button.style.display = hidden;
    loader.style.display = visible;
  } else {
    button.style.display = visible;
    loader.style.display = hidden;
  }
  return loading;
}

// Displays an error message for 5 seconds then hides it and restores loading state.
function onError(errorMessage: string) {
  errorElement.style.display = visible;
  loader.style.display = hidden;
  const message = errorElement.innerText;
  errorElement.innerText = errorElement.innerText + ' \n ' + errorMessage;
  setTimeout(async () => {
    errorElement.style.display = hidden;
    errorElement.innerText = message;
    isLoading();
  }, 5000);
}

// --- Download button ---

// Sends the selected semester to the content script to start the scraping loop.
async function onClick() {
  button.addEventListener('click', async () => {
    try {
      await isLoading();
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      (await chrome.tabs.sendMessage(tab.id as number, {
        command: command.click,
        semester: getSelectedSemester(),
      })) as any;
      await isLoading();
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  });
}

// --- Semester selection ---

// Months 1–5 are semester 1, months 6–12 are semester 2.
const semesterMonths = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11],
];

function currentSem() {
  const month = new Date().getMonth() + 1;
  return semesterMonths[0].includes(month) ? 1 : 2;
}

// Pre-selects the radio button matching the current semester on popup open.
function setDefaultSemester() {
  const semesterId = `semester${currentSem()}`;
  (document.getElementById(semesterId) as HTMLInputElement).checked = true;
}

// Reads the checked radio button and returns 1 or 2.
function getSelectedSemester(): 1 | 2 {
  const sem1 = (document.getElementById('semester1') as HTMLInputElement).checked;
  const sem2 = (document.getElementById('semester2') as HTMLInputElement).checked;
  if (sem1 === true) {
    return 1;
  } else if (sem2 === true) {
    return 2;
  } else {
    console.log("ERROR: can't find a selected semester");
    return currentSem();
  }
}

// --- Theme ---

function applyTheme(dark: boolean) {
  document.body.classList.toggle('dark', dark);
  themeToggle.textContent = dark ? '☀️' : '🌙';
}

// Restores the user's saved theme preference on popup open.
async function loadTheme() {
  const { darkMode } = await chrome.storage.sync.get('darkMode');
  applyTheme(!!darkMode);
}

// Toggles dark/light mode and persists the choice to sync storage.
function setupThemeToggle() {
  themeToggle.addEventListener('click', async () => {
    const isDark = document.body.classList.contains('dark');
    applyTheme(!isDark);
    await chrome.storage.sync.set({ darkMode: !isDark });
  });
}

// --- Entry point ---

function main() {
  setDefaultSemester();
  isLoading();
  onClick();
  loadTheme();
  setupThemeToggle();
}
main();
