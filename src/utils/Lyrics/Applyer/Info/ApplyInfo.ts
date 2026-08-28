import lifecycle from '../../../lifecycle';

const windowRef = window as unknown as {
  __amaiInfoTimeout?: number | null;
  __amaiInfoLifecycleTracked?: boolean;
};
let infoTimeout: number | null = windowRef.__amaiInfoTimeout ?? null;

if (!windowRef.__amaiInfoLifecycleTracked) {
  windowRef.__amaiInfoLifecycleTracked = true;
  lifecycle.trackCallback(clearApplyInfoTimeout);
}

/** Clear pending ApplyInfo removal timer — call on page destroy / teardown to avoid detached-DOM retain. */
export function clearApplyInfoTimeout(): void {
  if (infoTimeout !== null) {
    clearTimeout(infoTimeout);
    infoTimeout = null;
    windowRef.__amaiInfoTimeout = null;
  }
}

export function ApplyInfo(data: { Info?: string; InfoDuration?: number }) {
  const DEFAULT_WPM = 200;
  const DEFAULT_DURATION = 8000; // 8 seconds fallback

  const TopBarContainer = document.querySelector('header.main-topBar-container');
  if (!data?.Info || !TopBarContainer) return;

  // Cancel previous pending removal so rapid Info updates don't stack timers holding detached DOM
  if (infoTimeout !== null) {
    clearTimeout(infoTimeout);
    infoTimeout = null;
    windowRef.__amaiInfoTimeout = null;
  }

  // Remove existing info elements to avoid duplicates
  TopBarContainer.querySelectorAll('.amai-info').forEach((el) => el.remove());

  const infoElement = document.createElement('a');
  infoElement.className = 'amai-info';
  infoElement.textContent = data.Info;
  infoElement.role = 'menuitem';
  infoElement.href = '/preferences'; // Set the href attribute to redirect
  infoElement.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    Spicetify.Platform.History.push({
      pathname: '/preferences',
      hash: '#amai-settings',
    });
  });
  TopBarContainer.appendChild(infoElement);

  // Determine duration: use InfoDuration if provided, else calculate based on reading speed, fallback to default
  let duration = data.InfoDuration;
  if (!duration) {
    const words = data.Info.split(/\s+/).length;
    const readingTimeSeconds = (words / DEFAULT_WPM) * 60;
    duration = readingTimeSeconds * 1000 || DEFAULT_DURATION;
  }

  infoTimeout = window.setTimeout(() => {
    infoTimeout = null;
    windowRef.__amaiInfoTimeout = null;
    if (TopBarContainer.contains(infoElement)) {
      TopBarContainer.removeChild(infoElement);
    }
  }, duration) as unknown as number;
  windowRef.__amaiInfoTimeout = infoTimeout;
}
