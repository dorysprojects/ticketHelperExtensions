/**
 * 【活動頁】
 * 
 * 1.
 * if 只有一個場次，且直接[立即購票]的活動
 *  ->自動選擇場次
 * endif
 * 
 * 2.
 * 將[優先場次]字放大，背景變黃色
 * 
 * 3.
 * if [自動選場次]開啟
 *  if 有對應[優先場次]的場次
 *    ->自動選[優先場次]
 *  else if [只選[優先場次]]關閉
 *    ->自動選[第一個場次]
 *  endif
 * 
 *  if 無可選擇的場次(優先場次、第一個場次)
 *    if [無場次自動重整]開啟
 *      ->自動重整
 *    else
 *      ->提示無可選擇的場次，確認後重整
 *    endif
 *   endif
 * endif
 */
const areaListSelector  = '.event-list>ul>li';
chrome.storage.sync.get([
  "noSessionAutoRefresh",
  "autoChooseSession",
  "onlyChoosePrioritySession",
  "prioritySessionList"
], async function (result) {
  const noSessionAutoRefresh      = result.noSessionAutoRefresh || false;
  const autoChooseSession         = result.autoChooseSession || false;
  const onlyChoosePrioritySession = result.onlyChoosePrioritySession || false;
  const prioritySessionList       = result.prioritySessionList.split("\n") || [];
  let chooseFirstSession          = true;
  let anyChooseSession            = false;
  if($(".tickets>.btn-point").length){    
    if(autoChooseSession){
      await simulateMouseEvent($(".tickets>.btn-point"), 'click');
    }
    return;
  }
  if (prioritySessionList.length) {
    for await (const prioritySession of prioritySessionList) {
      for await (const area of $(areaListSelector)) {
        const includesSessionTime         = includesText($(area).find('.content>.event-info>.info-desc:nth-of-type(1)>.timezoneSuffix').text(), prioritySession);
        const includesSessionName         = includesText($(area).find('.content>.event-info>a>p').text(), prioritySession);
        const includesSessionPlace        = includesText($(area).find('.content>.event-info>.info-desc:nth-of-type(2)').text(), prioritySession);
        const prioritySessionTargetButton = $(area).find('.content>.btn-point');
        const includesAny = includesSessionTime || includesSessionName || includesSessionPlace;
        if(includesAny){
          $(area).find('.content')
            .css('font-size', 'larger')
            .css('background-color', 'yellow');
        }
        if(!prioritySessionTargetButton.length || !includesAny || anyChooseSession){
          continue;
        }
        chooseFirstSession  = false;
        anyChooseSession    = true;
        if(autoChooseSession){
          await simulateMouseEvent(prioritySessionTargetButton, 'click');
        }
      }
    }
  }

  if (chooseFirstSession) {
    const firstSessionButton = $(`${areaListSelector}>.content>.btn-point:first`);
    if (firstSessionButton.length) {
      if (!onlyChoosePrioritySession && autoChooseSession) {
        await simulateMouseEvent(firstSessionButton, 'click');
      }
      anyChooseSession = true;
    }
  }

  if (!anyChooseSession) {
    if (noSessionAutoRefresh || confirm("無可選擇的場次，是否重新整理頁面？")) {
      location.reload();
    }
  }
});
