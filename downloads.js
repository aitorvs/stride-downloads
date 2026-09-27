'use strict';
const repository = 'aitorvs/stride-downloads';
const releaseURL = `https://github.com/${repository}/releases`;
const status = document.querySelector('#release-status');
const links = [...document.querySelectorAll('.download-link')];
function unavailable(message) {
  status.textContent = message;
  links.forEach(link => {
    link.textContent = 'View releases ↗';
    link.href = releaseURL;
    link.removeAttribute('aria-disabled');
  });
}
async function loadDownloads() {
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=10`, {signal: AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('Release lookup failed');
    const releases = await response.json();
    const release = releases.find(item => !item.draft && links.some(link => item.assets?.some(asset => asset.name === link.dataset.asset)));
    if (!release) {
      status.textContent = 'Our first release is being tested. Downloads will appear here when it is published.';
      links.forEach(link => { link.textContent = 'Coming soon'; });
      return;
    }
    status.textContent = `${release.tag_name}${release.prerelease ? ' · Preview release' : ''} · Choose your computer below.`;
    links.forEach(link => {
      const asset = release.assets.find(item => item.name === link.dataset.asset);
      if (!asset || !asset.browser_download_url.startsWith(`https://github.com/${repository}/releases/download/`)) {
        link.textContent = 'Not available in this release';
        return;
      }
      link.href = asset.browser_download_url;
      link.textContent = 'Download Stride ↓';
      link.removeAttribute('aria-disabled');
      link.nextElementSibling.textContent = `ZIP · ${(asset.size / 1024 / 1024).toFixed(1)} MB`;
    });
  } catch {
    unavailable('Check GitHub Releases for the available downloads.');
  }
}
loadDownloads();
