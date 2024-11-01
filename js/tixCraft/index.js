/**
 * 【首頁】
 * 
 * 1.
 * 預設顯示[最新開賣]
 * 
 * 2.
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
  const eventUrl        = `/activity/detail/${eventCode}`;

  simulateMouseEvent($("#latest-selling-tab"), 'click');
  $("#latest-selling-tab")
    .addClass("active")
    .attr("aria-selected", "true");
  $("#latest-selling")
    .addClass("active show");
  $("#upcoming-activity-tab")
    .removeClass("active")
    .attr("aria-selected", "false");
  $("#upcoming-activity")
    .removeClass("active show");

  if(!autoChooseEvent)
    return;
  if(eventCode){
    if($(`a[href="${eventUrl}"]`).length){
      window.location.href = `${window.location.origin}${eventUrl}`;
    }else{
      alert(`【搶票小幫手】無符合[活動代碼:${eventCode}]的活動`);
    }
  }
});