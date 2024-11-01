/**
 * 【選票、驗證、同意頁】
 * 
 * 1.
 * 自動選【張數(預設2)】
 * 
 * 2.
 * 自動勾選[同意條款]
 * 
 * 3.
 * 放大[驗證碼圖片]1.5倍
 * 
 * 4.
 * 【需手動】輸入[驗證碼]
 * 
 * 5.
 * 【需手動】送出
 */
chrome.storage.sync.get([
  "numberOfTickets"
], function (result) {
  const numberOfTickets = result.numberOfTickets || 2;
  let chooseMaxNumberOfTickets = true;
  let anyChooseNumberOfTickets = false;
  if(numberOfTickets){
    const chooseNumberOfTickets = $(`#ticketPriceList select>option[value="${numberOfTickets}"]:first`);
    if(chooseNumberOfTickets.length){
      simulateMouseEvent(chooseNumberOfTickets, 'click');
      chooseNumberOfTickets.parent().val(chooseNumberOfTickets.val());
      simulateEvent(chooseNumberOfTickets.parent(), 'change');
      chooseMaxNumberOfTickets = false;
      anyChooseNumberOfTickets = true;
    }
  }
  if(chooseMaxNumberOfTickets){
    const maxNumberOfTickets = $("#ticketPriceList select>option:last");
    if(maxNumberOfTickets.length){
      simulateMouseEvent(maxNumberOfTickets, 'click');
      maxNumberOfTickets.parent().val(maxNumberOfTickets.val());
      simulateEvent(maxNumberOfTickets.parent(), 'change');
      anyChooseNumberOfTickets = true;
    }
  }

  if(!anyChooseNumberOfTickets){
    const [
      eventCode,
      numberOfEvent
    ] = window.location.pathname.split("/ticket/ticket/")[1].split('/');
    const areaPath = `${window.location.origin}/ticket/area/${eventCode}/${numberOfEvent}`;
    location.href = areaPath;
  }

  simulateMouseEvent($('#TicketForm_agree'), 'click');
  $('#TicketForm_agree')[0].checked = true;
  simulateEvent($('#TicketForm_agree'), 'change');

  const verifyCodeImage = $('#TicketForm_verifyCode-image'),
        originWidth     = verifyCodeImage.width() || 120,
        originHeight    = verifyCodeImage.height() || 100,
        changeScale     = 1.5;
  verifyCodeImage.width(originWidth * changeScale)
                .height(originHeight * changeScale);

  let verifyCode = "";
  simulateMouseEvent($('#TicketForm_verifyCode'), 'click');
  simulateEvent($('#TicketForm_verifyCode'), 'focus');
  if(verifyCode){
    $("#TicketForm_verifyCode").val(verifyCode);
    simulateEvent($('#TicketForm_verifyCode'), 'input');
    simulateEvent($('#TicketForm_verifyCode'), 'change');
    simulateEvent($('#TicketForm_verifyCode'), 'blur');
    simulateEvent($('#TicketForm_verifyCode'), 'select');
  }
});