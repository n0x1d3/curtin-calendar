import './popup.css';
import { command } from './types';
import { getSmartErrorMessage, onError } from './utils/popupErrors';

// The eStudent hostname and direct timetable URL used for page detection and the link.
const ESTUDENT_HOST = 'curtin-web.t1cloud.com';
const ESTUDENT_URL =
  'https://curtin-web.t1cloud.com/T1SMDefault/WebApps/eStudent/SM/StudentTtable10.aspx?r=%23CU.ESTU.STUDENT&f=%23CU.EST.TIMETBL.WEB';

// --- DOM references ---
const button = document.getElementById(command.download) as HTMLButtonElement;
const loaderArea = document.getElementById('loader-area') as HTMLElement;
const progressBar = document.getElementById('progress-bar') as HTMLElement;
const progressText = document.getElementById('progress-text') as HTMLElement;
const cancelBtn = document.getElementById('cancel') as HTMLButtonElement;
const successArea = document.getElementById('success-area') as HTMLElement;
const errorElement = document.getElementById('error') as HTMLElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
const versionEl = document.getElementById('version') as HTMLElement;
const openEstudentBtn = document.getElementById('open-estudent') as HTMLButtonElement;

// --- Polling state ---

// Interval handle — null when no poll is running.
let pollHandle: ReturnType<typeof setInterval> | null = null;

// Tracks whether we were in a loading state so we can show the success screen
// when the transition from loading → idle happens.
let wasLoading = false;

// Stuck detection: track the last observed `forward` value and when it was seen.
// If it hasn't advanced in STUCK_MS we warn the user.
let lastForwardValue: number | undefined;
let lastForwardTime = 0;
const STUCK_MS = 90_000; // 90 seconds without progress

// --- Polling ---

// Starts polling Chrome storage every 800ms and stops automatically once the
// session ends. Safe to call repeatedly — will not start a second interval.
function startPolling() {
  if (pollHandle !== null) return;
  pollHandle = setInterval(async () => {
    const loading = await updateLoadingUI();
    if (!loading && pollHandle !== null) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  }, 800);
}

function stopPolling() {
  if (pollHandle !== null) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}

// --- Loading state ---

// Updates all loading-state UI elements for the active scrape phase.
function applyLoadingState(forward: number, total: number) {
  const week = Math.min(forward + 1, total);
  const pct = Math.min(100, Math.round((forward / total) * 100));

  if (forward !== lastForwardValue) {
    lastForwardValue = forward;
    lastForwardTime = Date.now();
    progressText.textContent = `Scraping week ${week} of ${total}…`;
  } else if (Date.now() - lastForwardTime > STUCK_MS) {
    progressText.textContent = 'Taking longer than expected — you can cancel and retry.';
  }

  button.style.display = 'none';
  successArea.style.display = 'none';
  loaderArea.style.display = 'flex';
  progressBar.style.width = `${pct}%`;
  wasLoading = true;
}

// Reads scraping progress from Chrome storage and updates every element of the UI:
//   loading  → hide button/success, show loader-area with progress + stuck warning
//   idle     → hide loader-area, show button (or success if we just finished)
// Returns whether a scraping session is currently active.
async function updateLoadingUI() {
  const { forward, totalWeeks } = await chrome.storage.local.get(['forward', 'totalWeeks']);
  const loading = forward !== undefined;

  if (loading) {
    const total = (totalWeeks as number) ?? 13;
    applyLoadingState(forward as number, total);
  } else {
    loaderArea.style.display = 'none';
    lastForwardValue = undefined;

    if (wasLoading) {
      wasLoading = false;
      const { lastError } = await chrome.storage.local.get('lastError');
      if (lastError) {
        await chrome.storage.local.remove('lastError');
        onError({
          message: lastError as string,
          stopPollingFn: stopPolling,
          checkIfOnEstudent,
          setWasLoading: (value) => {
            wasLoading = value;
          },
          button,
          loaderArea,
          successArea,
          errorElement,
        });
      } else {
        showSuccess();
      }
    } else {
      button.style.display = 'block';
      successArea.style.display = 'none';
    }
  }

  return loading;
}

// Briefly shows the success screen then fades back to the download button.
function showSuccess() {
  button.style.display = 'none';
  successArea.style.display = 'flex';
  setTimeout(() => {
    successArea.style.display = 'none';
    button.style.display = 'block';
    checkIfOnEstudent();
  }, 3000);
}

// --- Cancel ---

// Clears all scraping state from storage, stops polling, and resets the UI.
// Doubles as a stuck-session recovery — clicking Cancel always unblocks the popup.
function setupCancel() {
  cancelBtn.addEventListener('click', async () => {
    stopPolling();
    await chrome.storage.local.remove(['events', 'forward', 'semester', 'totalWeeks']);
    wasLoading = false;
    lastForwardValue = undefined;
    loaderArea.style.display = 'none';
    successArea.style.display = 'none';
    button.style.display = 'block';
    await checkIfOnEstudent();
  });
}

// --- Page detection ---

// Checks whether the active tab is on the eStudent page.
// Disables the Download button with a tooltip if not, so users get a clear
// signal instead of a confusing "Could not establish connection" error.
async function checkIfOnEstudent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isOnPage = tab?.url?.includes(ESTUDENT_HOST) ?? false;
    button.disabled = !isOnPage;
    button.classList.toggle('disabled', !isOnPage);
    button.title = isOnPage ? '' : 'Open My Classes in eStudent first';
  } catch (err) {
    console.error('[curtincalendar] checkIfOnEstudent failed:', err);
    button.disabled = false;
    button.classList.remove('disabled');
  }
}

// --- Download button ---

function onClick() {
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    try {
      await updateLoadingUI();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id as number, {
        command: command.click,
        semester: getSelectedSemester(),
      });
      await new Promise((r) => setTimeout(r, 300));
      await updateLoadingUI();
      startPolling();
    } catch (error) {
      console.error('[curtincalendar] onClick error:', error);
      onError({
        message: getSmartErrorMessage(error),
        stopPollingFn: stopPolling,
        checkIfOnEstudent,
        setWasLoading: (value) => {
          wasLoading = value;
        },
        button,
        loaderArea,
        successArea,
        errorElement,
      });
    }
  });
}

// --- eStudent link ---

// Opens the eStudent My Classes page in a new tab when the inline link is clicked.
function setupEstudentLink() {
  openEstudentBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: ESTUDENT_URL });
  });
}

// --- Semester selection ---

// Months 1–5 are semester 1; months 6–12 are semester 2.
// December (12) is included in semester 2 since it follows the end of sem 2
// and precedes the next year's semester 1.
const semesterMonths = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
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
  if (sem1) return 1;
  if (sem2) return 2;
  console.error('[curtincalendar] getSelectedSemester: no semester radio is checked');
  return currentSem();
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

// --- Beta badge ---

// Adds body.beta so the CSS beta badge becomes visible.
// Reads from the manifest so the same JS works for both stable and beta builds.
function setupBetaBadge() {
  if (chrome.runtime.getManifest().name.includes('Beta')) {
    document.body.classList.add('beta');
  }
}

// --- Version ---

// Reads the version from the manifest and injects it into the footer element.
function setupVersion() {
  const { version } = chrome.runtime.getManifest();
  versionEl.textContent = `v${version}`;
}

async function main() {
  setDefaultSemester();
  setupVersion();
  setupBetaBadge();
  setupCancel();
  setupEstudentLink();
  onClick();
  loadTheme();
  setupThemeToggle();
  const loading = await updateLoadingUI();
  if (loading) startPolling();
  await checkIfOnEstudent();
}
main();
