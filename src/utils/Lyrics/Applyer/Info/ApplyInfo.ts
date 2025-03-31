export function ApplyInfo(data: { Info?: string }) {
  const TopBarContainer = document.querySelector(
    'header.main-topBar-container',
  );
  if (!data?.Info || !TopBarContainer) return;
  const infoElement = document.createElement('a');
  infoElement.className = 'FuriganaInfo';
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

  // Auto-hide the element after 5 seconds
  setTimeout(() => {
    TopBarContainer.removeChild(infoElement);
  }, 8000);
}
