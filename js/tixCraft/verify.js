/**
 * 優先購代碼
 */
const checkCodeObj = $('input[name="checkCode"]');
chrome.storage.sync.get(["checkCode"], function (result) {
  const checkCode = result.checkCode || "";
  if (checkCodeObj.length) {
    checkCodeObj
      .click()
      .focus()
      .val(checkCode);
  }
});