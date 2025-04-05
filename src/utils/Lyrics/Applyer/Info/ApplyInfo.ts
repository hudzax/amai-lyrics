export function ApplyInfo(data: { Info?: string; InfoDuration?: number }) {
  const TopBarContainer = document.querySelector(
    'header.main-topBar-container',
  );
  if (!data?.Info || !TopBarContainer) return;
  const infoElement = document.createElement('a');
  infoElement.className = 'amai-info';
  infoElement.textContent = data.Info;
  infoElement.role = 'menuitem';
  infoElement.href = '/preferences'; // Set the href attribute to redirect
  infoElement.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    Spicetify.Platform.History.push({
      pathname: '/preferences',
      hash: '#spicy-lyrics-settings',
    });
  });
  TopBarContainer.appendChild(infoElement);

  // Calculate the duration based on average human reading ability (240 WPM)
  const words = data.Info.split(/\s+/).length;
  const wpm = 200;
  const readingTimeSeconds = (words / wpm) * 60;
  const duration = readingTimeSeconds * 1000;
  // Auto-hide the element after 5 seconds
  setTimeout(() => {
    TopBarContainer.removeChild(infoElement);
  }, duration); // Default to 8 seconds if InfoDuration is not provided
}
