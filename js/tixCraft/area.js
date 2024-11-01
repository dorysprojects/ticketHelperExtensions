/**
 * 【選擇票種頁】
 * 
 * 1.
 * 將[優先票種]字放大，背景變黃色
 * 
 * 2.
 * if [自動選票]開啟
 *  if 有對應[優先票種]的區域
 *    if 有任一[對應區域[剩餘票數]>=選擇的【張數】]
 *      ->自動選第一個[對應的[優先票種]]
 *    else if [低於[張數]依然自動選票]開啟 && 有任一[對應區域[剩餘票數]>=1]
 *      ->自動選第一個[對應的[優先票種]]
 *    endif
 *  else if [只選[優先票種]]關閉
 *    if 有任一[對應區域[剩餘票數]>=選擇的【張數】]
 *      ->自動選第一個[對應的[票種]]
 *    else if [低於[張數]依然自動選票]開啟 && 有任一[對應區域[剩餘票數]>=1]
 *      ->自動選第一個[對應的[票種]]
 *    endif
 *  endif
 * endif
 * (檢查[剩餘票數]方式)
 * for [票種] in [區域]
 *  if [剩餘票數]不足([後方文字(ex:剩餘 1)]<【張數(預設2)】)
 *   再進行下一個[票種]的檢查
 *  else
 *    break
 *  endif
 * endfor
 * 
 * 3.
 * 隱藏[已售完]的區域
 * 
 * 4.
 * if 無可選擇的區域
 *  if [無票自動重整]開啟
 *    ->自動重整
 *  else
 *    ->提示無可選擇的場次，確認後重整
 *  endif
 * endif
 */
const areaListSelector = 'ul.area-list>li';
chrome.storage.sync.get([
  "noTicketAutoRefresh",
  "autoChooseTicket",
  "onlyChoosePriorityTicket",
  "autoChooseTicketWhenLower",
  "priorityTicketList",
  "numberOfTickets"
], async function (result) {
  const noTicketAutoRefresh       = result.noTicketAutoRefresh || false;
  const autoChooseTicket          = result.autoChooseTicket || false;
  const onlyChoosePriorityTicket  = result.onlyChoosePriorityTicket || false;
  const autoChooseTicketWhenLower = result.autoChooseTicketWhenLower || false;
  const priorityTicketList        = result.priorityTicketList.split("\n") || [];
  const numberOfTickets           = result.numberOfTickets || 2;

  let targetTicket = await getTicket(priorityTicketList, numberOfTickets, onlyChoosePriorityTicket, autoChooseTicketWhenLower);
  if(autoChooseTicket && targetTicket && $(targetTicket).length){
    simulateMouseEvent($(targetTicket).find('a'), 'click');
  }
  
  $(`${areaListSelector}:has(font:contains('已售完'))`).hide();
  if (
    $(`${areaListSelector}[style*="display: none;"]`).length
    ===
    $(`${areaListSelector}`).length
  ) {
    if (noTicketAutoRefresh || confirm("無可選擇的區域，是否重新整理頁面?")) {
      location.reload();
    }
  }
});

async function getTicket(priorityTicketList, numberOfTickets, onlyChoosePriorityTicket, autoChooseTicketWhenLower) {
  let targetTicket = await getListAbleTicket(priorityTicketList, numberOfTickets, true);
  if(autoChooseTicketWhenLower && !targetTicket){
    targetTicket = await getListAbleTicket(priorityTicketList, numberOfTickets, false);
  }
  if(!onlyChoosePriorityTicket){
    if(!targetTicket){
      targetTicket = await getAbleTicket(numberOfTickets, true);
    }
    if(autoChooseTicketWhenLower && !targetTicket){
      targetTicket = await getAbleTicket(numberOfTickets, false);
    }
  }
  return targetTicket;
}

/**
 * overChooseTicket:true ，優先票種(未超過[選擇的票數])
 * overChooseTicket:false，優先票種(可超過[選擇的票數])
 */
async function getListAbleTicket(priorityTicketList, numberOfTickets, overChooseTicket) {
  let targetTicket = null;
  if (priorityTicketList.length) {
    for await (const priorityTicket of priorityTicketList) {
      for await (const area of $(areaListSelector)) {
        const ticketItem = $(area).find('a');
        const includesPriorityTicket = includesText(ticketItem.text(), priorityTicket);
        if(includesPriorityTicket){
          $(area)
            .css('font-size', 'larger')
            .css('background-color', 'yellow');
        }
        if(!includesPriorityTicket || targetTicket){
          continue;
        }
        if(!overChooseTicket){
          targetTicket = area;
          continue;
        }
        const ticketQuantity    = ticketItem.find('font').text();
        const oneLeft           = includesText(ticketQuantity, '剩餘 1');
        const twoLeft           = includesText(ticketQuantity, '剩餘 2');
        const threeLeft         = includesText(ticketQuantity, '剩餘 3');
        const ticketConditions  = {
          '4': !oneLeft && !twoLeft && !threeLeft,
          '3': !oneLeft && !twoLeft,
          '2': !oneLeft,
          '1': true
        };
        if (ticketConditions[numberOfTickets]) {
          targetTicket = area;
          continue;
        }
      }
    }
  }
  return targetTicket;
}

/**
 * overChooseTicket:true ，第一個可選擇票種(未超過[選擇的票數])
 * overChooseTicket:false，第一個可選擇票種(可超過[選擇的票數])
 */
async function getAbleTicket(numberOfTickets, overChooseTicket) {
  let targetTicket = null;
  const chooseAbleTicketObj = $(`${areaListSelector}:has(a>span)`);
  if (chooseAbleTicketObj.length) {
    for await (const area of chooseAbleTicketObj) {
      if(!overChooseTicket){
        targetTicket = area;
        break;
      }
      const ticketQuantity    = $(area).find('a>font').text();
      const oneLeft           = includesText(ticketQuantity, '剩餘 1');
      const twoLeft           = includesText(ticketQuantity, '剩餘 2');
      const threeLeft         = includesText(ticketQuantity, '剩餘 3');
      const ticketConditions  = {
        '4': !oneLeft && !twoLeft && !threeLeft,
        '3': !oneLeft && !twoLeft,
        '2': !oneLeft,
        '1': true
      };
      if (ticketConditions[numberOfTickets]) {
        targetTicket = area;
        break;
      }
    }
  }
  return targetTicket;
}