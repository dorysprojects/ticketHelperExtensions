/**
 * 【首頁】
 * 
 * 1.
 * if [自動選活動]開啟
 *  if 有對應[活動代碼]的活動
 *    ->自動選活動
 *  else
 *    ->提示無符合[活動代碼]的活動
 *  endif
 * endif
 */
chrome.storage.sync.get([
  "eventCode",
  "autoChooseEvent"
], function (result) {
  const autoChooseEvent = result.autoChooseEvent || false;
  const eventCode       = result.eventCode || '';
  if(!autoChooseEvent)
    return;
  if(eventCode){
    let selectEvent = false;
    $(`.events>li>a`).each(function () {
      if($(this).attr('href').indexOf(eventCode) !== -1){
        selectEvent = true;
        simulateMouseEvent($(this), 'click');
        return false;
      }
    });
    if(!selectEvent){
      alert(`【搶票小幫手】無符合[活動代碼:${eventCode}]的活動`);
    }
  }
});