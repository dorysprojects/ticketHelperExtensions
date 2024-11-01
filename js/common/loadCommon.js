async function simulateEvent(element, eventName) {
  if (!element || !element[0] || !eventName){
    return;
  }
  if (element[0][eventName]){
    element[0][eventName]();
  }
  const event = new Event(eventName, {
    isTrusted: true,
    bubbles: true,
    cancelable: true,
  });
  element[0].dispatchEvent(event);
}

async function simulateMouseEvent(element, eventName) {
  if (!element || !element[0] || !eventName){
    return;
  }
  const event = new MouseEvent(eventName, {
    isTrusted: true,
    bubbles: true,
    cancelable: true,
    view: window,
  });
  element[0].dispatchEvent(event);
}

function includesText(fullText, findText) {
  return findText && fullText.replace(/\s+/g, " ").includes(findText) || false;
}