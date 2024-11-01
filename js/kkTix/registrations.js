/**
 * 【選擇票種、數量、驗證、同意頁】
 * 
 * 1.
 * 自動隱藏[提醒需登入]視窗
 * 
 * 2.
 * 將[優先票種]字放大，背景變黃色
 * 
 * 3.
 * if [自動選票]開啟
 *  if 有對應[優先票種]的區域
 *    if 有任一[對應區域[剩餘票數]>=選擇的【張數(預設2)】]
 *      ->自動選第一個[對應的[優先票種]]
 *    else if [低於【張數(預設2)】依然自動選票]開啟 && 有任一[對應區域[剩餘票數]>=1]
 *      ->自動選第一個[對應的[優先票種]]
 *    endif
 *  else if [只選[優先票種]]關閉
 *    if 有任一[對應區域[剩餘票數]>=選擇的【張數(預設2)】]
 *      ->自動選第一個[對應的[票種]]
 *    else if [低於【張數(預設2)】依然自動選票]開啟 && 有任一[對應區域[剩餘票數]>=1]
 *      ->自動選第一個[對應的[票種]]
 *    endif
 *  endif
 * endif
 * (檢查[剩餘票數]方式)
 * for [票種] in [區域]
 *  自動點擊[+]*【張數(預設2)】
 *  if [剩餘票數]不足(點擊後數量<【張數(預設2)】)
 *   自動點擊[-]歸零，再進行下一個[票種]的檢查
 *  else
 *    break
 *  endif
 * endfor
 * 
 * 4.
 * if 無可選擇的區域
 *  if [無票自動重整]開啟
 *    ->自動重整
 *  else
 *    ->提示無可選擇的場次，確認後重整
 *  endif
 * endif
 * 
 * 5.
 * 自動勾選[同意條款]
 * 
 * 6.
 * if [自動填答案]開啟
 *  ->自動填答案，依[預填答案]按順序填入
 * endif
 * 
 * 7.
 * 【需手動】送出
 */
const intervalTime      = 100;
const areaListSelector  = '.ticket-list>.ticket-unit';
const waitTicketListOpen = setInterval(() => {
  if ($('.arena-ticket-wrapper').length && $(areaListSelector).length === 0) {
    return;
  }
  clearInterval(waitTicketListOpen);

  chrome.storage.sync.get([
    "noTicketAutoRefresh",
    "autoChooseTicket",
    "onlyChoosePriorityTicket",
    "autoChooseTicketWhenLower",
    "priorityTicketList",
    "numberOfTickets",
    "autoFillAnswer",
    "preFilledAnswers"
  ], async function (result) {
    const noTicketAutoRefresh       = result.noTicketAutoRefresh || false;
    const autoChooseTicket          = result.autoChooseTicket || false;
    const onlyChoosePriorityTicket  = result.onlyChoosePriorityTicket || false;
    const autoChooseTicketWhenLower = result.autoChooseTicketWhenLower || false;
    const priorityTicketList        = result.priorityTicketList.split("\n") || [];
    const numberOfTickets           = result.numberOfTickets || 2;
    const autoFillAnswer            = result.autoFillAnswer || false;
    const preFilledAnswers          = result.preFilledAnswers.split("\n") || [];
    
    if($('#guestModal').css('display') === 'block'){
      await $('#guestModal').modal('hide');
    }

    await getTicket(priorityTicketList, numberOfTickets, autoChooseTicket, onlyChoosePriorityTicket, autoChooseTicketWhenLower);

    if($(`${areaListSelector} .ticket-quantity>input`).length === 0){
      if(noTicketAutoRefresh || confirm("無可選擇數量，是否重新整理頁面?")){
        location.reload();
      }
      return;
    }

    await agreeTerms();

    if(autoFillAnswer && preFilledAnswers.length){
      await answerQuestion(preFilledAnswers);
    }
  });
}, intervalTime);

async function getTicket(priorityTicketList, numberOfTickets, autoChooseTicket, onlyChoosePriorityTicket, autoChooseTicketWhenLower) {
  let targetTicket = await getListAbleTicket(priorityTicketList, numberOfTickets, autoChooseTicket, true);
  if(autoChooseTicketWhenLower && !targetTicket){
    targetTicket = await getListAbleTicket(priorityTicketList, numberOfTickets, autoChooseTicket, false);
  }
  if(!onlyChoosePriorityTicket){
    if(!targetTicket){
      targetTicket = await getAbleTicket(numberOfTickets, autoChooseTicket, true);
    }
    if(autoChooseTicketWhenLower && !targetTicket){
      targetTicket = await getAbleTicket(numberOfTickets, autoChooseTicket, false);
    }
  }
  return targetTicket;
}

/**
 * overChooseTicket:true ，優先票種(未超過[選擇的票數])
 * overChooseTicket:false，優先票種(可超過[選擇的票數])
 */
async function getListAbleTicket(priorityTicketList, numberOfTickets, autoChooseTicket, overChooseTicket) {
  let targetTicket = false;
  if (priorityTicketList.length) {
    for await (const priorityTicket of priorityTicketList) {
      for await (const area of $(areaListSelector)) {
        const includesTicketName  = $(area).find('.ticket-name').text().replace(/\s+/g, " ").includes(priorityTicket);
        const includesTicketPrice = $(area).find('.ticket-price').text().replace(/\s+/g, " ").includes(priorityTicket);
        const ticketQuantityInput = $(area).find('.ticket-quantity>input');
        const includesAny         = priorityTicket && (includesTicketName || includesTicketPrice);
        if(includesAny){
          $(area)
            .css('font-size', 'larger')
            .css('background-color', 'yellow');
        }
        if(targetTicket || !autoChooseTicket || !(ticketQuantityInput.length && includesAny)){
          continue;
        }
        setStatus = await setQuantity(area, numberOfTickets, overChooseTicket);
        if(setStatus){
          targetTicket = true;
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
async function getAbleTicket(numberOfTickets, autoChooseTicket, overChooseTicket) {
  if(!autoChooseTicket){
    return false;
  }
  let targetTicket = false;
  for await (const area of $(areaListSelector)) {
    const ticketQuantityInput = $(area).find('.ticket-quantity>input');
    if(!ticketQuantityInput.length){
      continue;
    }
    setStatus = await setQuantity(area, numberOfTickets, overChooseTicket);
    if(setStatus){
      targetTicket = true;
      break;
    }
  }
  return targetTicket;
}

async function setQuantity(targetTicket, numberOfTickets, overChooseTicket) {
  const ticketQuantityInput     = $(targetTicket).find('.ticket-quantity>input');
  const ticketQuantityMinusBtn  = $(targetTicket).find('.ticket-quantity>button.minus');
  const ticketQuantityPlusBtn   = $(targetTicket).find('.ticket-quantity>button.plus');
  let setStatus                 = false;
  numberOfTickets               = numberOfTickets*1;
  if(ticketQuantityInput.length){
    for (let i=0; i<numberOfTickets; i++) {
      await simulateMouseEvent(ticketQuantityPlusBtn, 'click');
    }
    if(overChooseTicket){
      if(ticketQuantityInput.val()*1 < numberOfTickets){
        const ticketMinusQuantity = ticketQuantityInput.val()*1;
        for (let i=0; i<ticketMinusQuantity; i++) {
          await simulateMouseEvent(ticketQuantityMinusBtn, 'click');
        }
      } else if(ticketQuantityInput.val()*1 == numberOfTickets){
        setStatus = true;
      }
    }else if(ticketQuantityInput.val() && ticketQuantityInput.val()*1!=0){
      setStatus = true;
    }
  }
  return setStatus;
}

async function agreeTerms() {
  const agreeTermsElement = $('#person_agree_terms');
  await simulateMouseEvent(agreeTermsElement, 'click');
  agreeTermsElement[0].checked = true;
  await simulateEvent(agreeTermsElement, 'change');
}

async function answerQuestion(preFilledAnswers) {
  const questionAreas = $('.custom-captcha>.custom-captcha-inner');
  if (!questionAreas.length || !preFilledAnswers.length) {
    return;
  }
  for await (const area of questionAreas) {
    const preFilledAnswer = preFilledAnswers.shift() || '';
    if (!preFilledAnswer) {
      continue;
    }
    // const question = $(area).find('p').text();
    const inputElement = $(area).find('.row input');
    await simulateMouseEvent(inputElement, 'click');
    await simulateEvent(inputElement, 'focus');
    inputElement.val(preFilledAnswer);
    await simulateEvent(inputElement, 'input');
    await simulateEvent(inputElement, 'change');
    await simulateEvent(inputElement, 'blur');
    await simulateEvent(inputElement, 'select');
  }
}