async function getLatestRelease() {
  try {
    const apiUrl = `https://api.github.com/repos/hudzax/amai-lyrics/releases/latest`;
    const response = await fetch(apiUrl, {
      headers: {
        // Optional: Add a GitHub token if needed for private repos or rate limits
        // "Authorization": "token YOUR_PERSONAL_ACCESS_TOKEN"
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const release = await response.json();
    return release.tag_name;
  } catch (error) {
    console.error('Error fetching latest release:', error);
    throw error;
  }
}

async function importScript(tag) {
  try {
    await import(
      `https://cdn.jsdelivr.net/gh/hudzax/amai-lyrics@${tag}/builds/amai-lyrics.min.js`
    );
  } catch (error) {
    console.error('Error importing script:', error);
    throw error;
  }
}

(async function main() {
  try {
    const tag = await getLatestRelease();
    if (tag) {
      console.log(`The latest release is: ${tag}`);
      await importScript(tag);
      console.log('Amai Lyrics has been successfully loaded!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
