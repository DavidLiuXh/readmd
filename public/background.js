chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') })
})

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'OPEN_DIR') {
    const url = chrome.runtime.getURL('reader.html') +
      '?dirUrl=' + encodeURIComponent(msg.dirUrl)
    chrome.tabs.create({ url })
  }
})
