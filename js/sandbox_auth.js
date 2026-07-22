document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('sandbox-pw-input');
  const popover = document.getElementById('sandbox-popover');

  if (!input) return;

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const password = input.value;
      input.value = '';

      const success = await decryptBlogContent(password);
      
      if (success) {
        if (popover && typeof popover.hidePopover === 'function') {
          popover.hidePopover();
        }
      } else {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 1000);
      }
    }
  });
});

async function decryptBlogContent(password) {
  const container = document.getElementById('sandbox-content');
  if (!container || !password) return false;

  try {
    const rawPayload = container.getAttribute('data-payload');
    if (!rawPayload) return false;

    const data = JSON.parse(rawPayload);

    const hexToBytes = hex => Uint8Array.from(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const iv = hexToBytes(data.iv);
    const ciphertext = hexToBytes(data.ciphertext);
    const tag = hexToBytes(data.tag);

    // Combine ciphertext and auth tag for WebCrypto AES-GCM decryption
    const combinedData = new Uint8Array(ciphertext.length + tag.length);
    combinedData.set(ciphertext);
    combinedData.set(tag, ciphertext.length);

    // Derive 256-bit AES key from the entered password via SHA-256
    const enc = new TextEncoder();
    const pwHash = await window.crypto.subtle.digest('SHA-256', enc.encode(password));

    const key = await window.crypto.subtle.importKey(
      "raw",
      pwHash,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      combinedData
    );

    const decryptedHtml = new TextDecoder().decode(decryptedBuffer);

    // Swap scrambled text for true decrypted content
    container.innerHTML = decryptedHtml;
    return true;

  } catch (err) {
    console.error("Decryption failed: Incorrect password or corrupted payload.", err);
    return false;
  }
}
