document.addEventListener('DOMContentLoaded', () => {
  const link = document.getElementById('sandbox-pw-link');
  const popover = document.getElementById('sandbox-popover');
  const input = document.getElementById('sandbox-pw-input');

  const supportsPopover = 'popover' in HTMLElement.prototype;

  function positionPopover() {
    const rect = link.getBoundingClientRect();
    popover.style.top = `${rect.bottom + 50}px`;
    popover.style.left = `${rect.left + rect.width / 2}px`;
    popover.style.transform = 'translateX(-50%)';
  }

  function openPopover() {
    positionPopover();
    if (supportsPopover) {
      popover.showPopover();
    } else {
      popover.classList.add('is-open');
    }
    input.focus();
  }

  function closePopover() {
    if (supportsPopover) {
      popover.hidePopover();
    } else {
      popover.classList.remove('is-open');
    }
  }

  if (!supportsPopover) {
    popover.removeAttribute('popover');
    popover.classList.add('manual-mode');
  }

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = supportsPopover
      ? popover.matches(':popover-open')
      : popover.classList.contains('is-open');
    isOpen ? closePopover() : openPopover();
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== link) {
      closePopover();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopover();
  });
});