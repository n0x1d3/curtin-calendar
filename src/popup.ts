import './popup.css';
import { command } from './types';

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

// Reads scraping progress from Chrome storage and updates every element of the UI:
//   loading  → hide button/success, show loader-area with progress + stuck warning
//   idle     → hide loader-area, show button (or success if we just finished)
// Returns whether a scraping session is currently active.
async function updateLoadingUI() {
  const { forward, totalWeeks } = await chrome.storage.local.get(['forward', 'totalWeeks']);
  const loading = forward !== undefined;

  if (loading) {
    const week = (forward as number) + 1;
    const total = (totalWeeks as number) ?? 13;
    const pct = Math.min(100, Math.round(((forward as number) / total) * 100));

    // Stuck detection — warn if the same week has persisted for too long
    if (forward !== lastForwardValue) {
      lastForwardValue = forward as number;
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
  } else {
    loaderArea.style.display = 'none';
    lastForwardValue = undefined;

    // Show the success screen only when transitioning from loading → idle,
    // not on the initial popup open (which is also "not loading").
    if (wasLoading) {
      wasLoading = false;
      // Check if the content script stored an error (e.g. no classes found)
      // instead of completing successfully.
      const { lastError } = await chrome.storage.local.get('lastError');
      if (lastError) {
        await chrome.storage.local.remove('lastError');
        onError(lastError as string);
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
    // Re-check page detection after returning to idle
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

// --- Error handling ---

// Maps raw JS error messages to plain-English explanations for common failures.
function getSmartErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('Could not establish connection') || msg.includes('receiving end does not exist')) {
    return 'Please open the My Classes page in eStudent first.';
  }
  if (msg.includes('No tab') || msg.includes('no tab')) {
    return 'Could not detect the active tab. Try again.';
  }
  if (msg.includes('timeout') || msg.includes('AbortError')) {
    return 'Connection timed out. Check your internet and try again.';
  }
  if (msg.includes('Cannot read') || msg.includes('is not a function')) {
    return 'Could not read the timetable. Make sure My Classes is fully loaded.';
  }

  // Fall back to the raw message for anything unexpected
  return msg;
}

// Displays a user-friendly error for 5 seconds then resets.
function onError(message: string) {
  stopPolling();
  wasLoading = false;
  loaderArea.style.display = 'none';
  successArea.style.display = 'none';
  button.style.display = 'block';

  const original = errorElement.innerText;
  errorElement.innerText = '⛔ ' + message;
  errorElement.style.display = 'block';

  setTimeout(async () => {
    errorElement.style.display = 'none';
    errorElement.innerText = original;
    await checkIfOnEstudent();
  }, 5000);
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
  } catch {
    // If the check fails (e.g. restricted page), don't block the user
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
      (await chrome.tabs.sendMessage(tab.id as number, {
        command: command.click,
        semester: getSelectedSemester(),
      })) as any;
      // Short delay so the content script has time to write to storage
      // before the first poll fires
      await new Promise((r) => setTimeout(r, 300));
      await updateLoadingUI();
      startPolling();
    } catch (error) {
      onError(getSmartErrorMessage(error));
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
  console.log("ERROR: can't find a selected semester");
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

// --- Entry point ---

async function main() {
  setDefaultSemester();
  setupVersion();
  setupBetaBadge();
  setupCancel();
  setupEstudentLink();
  onClick();
  loadTheme();
  setupThemeToggle();

  // If a scrape is already running (popup reopened mid-scrape), resume polling.
  const loading = await updateLoadingUI();
  if (loading) startPolling();

  // Check whether the user is on the right page and update button state.
  await checkIfOnEstudent();
}
main();
