// Maps raw JS error messages to plain-English explanations for common failures.
export function getSmartErrorMessage(error: unknown): string {
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

  return msg;
}

type OnErrorArgs = {
  message: string;
  stopPollingFn: () => void;
  checkIfOnEstudent: () => Promise<void>;
  setWasLoading: (value: boolean) => void;
  button: HTMLButtonElement;
  loaderArea: HTMLElement;
  successArea: HTMLElement;
  errorElement: HTMLElement;
};

// Displays a user-friendly error for 5 seconds then resets the popup UI.
export function onError({
  message,
  stopPollingFn,
  checkIfOnEstudent,
  setWasLoading,
  button,
  loaderArea,
  successArea,
  errorElement,
}: OnErrorArgs): void {
  stopPollingFn();
  setWasLoading(false);
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
