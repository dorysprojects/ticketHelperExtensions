/**
 * 【活動頁】(含【選場次頁】)
 * 
 * 1.
 * 自動點擊[立即購票]，展開【選場次頁】
 */
const gamePath = window.location.pathname.replace("/detail/", "/game/");
const buyTicketsNowBtn = document.querySelector(`a[href="${gamePath}"]`);
if(buyTicketsNowBtn){
  buyTicketsNowBtn.click();
}