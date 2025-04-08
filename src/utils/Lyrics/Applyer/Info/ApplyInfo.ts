export function ApplyInfo(data: { Info?: string; InfoDuration?: number }) {
  const DEFAULT_WPM = 200;
  const DEFAULT_DURATION = 8000; // 8 seconds fallback

  const TopBarContainer = document.querySelector(
    'header.main-topBar-container',
  );
  if (!data?.Info || !TopBarContainer) return;

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

  setTimeout(() => {
    if (TopBarContainer.contains(infoElement)) {
      TopBarContainer.removeChild(infoElement);
    }
  }, duration);
}
