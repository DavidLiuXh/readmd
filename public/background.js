chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'reader.html' })
})
