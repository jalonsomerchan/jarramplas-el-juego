export function byId(id, root = document) {
  return root.getElementById(id);
}

export function setText(element, value) {
  if (element) element.textContent = String(value);
}

export function setVisible(element, visible, className = "is-visible") {
  if (element) element.classList.toggle(className, Boolean(visible));
}

export function clearChildren(element) {
  if (element) element.innerHTML = "";
}

export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  if (options.className) element.className = options.className;
  if (options.textContent !== undefined) element.textContent = options.textContent;
  if (options.type) element.type = options.type;
  if (options.ariaLabel) element.setAttribute("aria-label", options.ariaLabel);
  return element;
}
