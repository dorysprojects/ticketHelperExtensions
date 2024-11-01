$(document).ready(function () {
  function updateStorage(key, value) {
    let data = {};
    data[key] = value;
    chrome.storage.sync.set(data, function () {
      console.log(`${key}：${value}`);
    });
  }

  function initializeField(selector, key) {
    chrome.storage.sync.get([key], function (result) {
      switch($(selector).attr('type')) {
        case 'radio':
          $(`input[name="${key}"][value="${result[key]}"]`).prop("checked", true);
          const dataTarget = $(`[data-${key}="${result[key]}"]`);
          if(dataTarget.length){
            $('.flex-item').hide();
            $(`[data-${key}="${result[key]}"]`).show();
          }
          break;
        case 'checkbox':
          $(selector).prop("checked", result[key] || false);
          break
        default:
          $(selector).val(result[key] || '');
          break;
      }
    });
  }
  
  $(".field-item").each(function () {
    const key = $(this).attr("name");
    initializeField(`[name="${key}"]`, key);
  });

  $(".field-item").change(function () {
    const key = $(this).attr("name");
    let value;
    switch($(this).attr('type')) {
      case 'radio':
        value = $(`input[name="${key}"]:checked`).val();
        const dataTarget = $(`[data-${key}="${value}"]`);
        if(dataTarget.length){
          $('.flex-item').hide();
          $(`[data-${key}="${value}"]`).show();
        }
        break;  
      case 'checkbox':
        value = $(this).prop("checked");
        break
      default:
        value = $(this).val();
        if(value && key==='eventCode'){
          value = eventCodeParse(value);
          $(this).val(value);
        }
        break;
    }
    updateStorage(key, value);
  });
});

function eventCodeParse(value) {
  const compareList = [
    'events',//https://${project}.kktix.cc/${compare}/${eventCode}
    'activity/detail',
    'activity/game',
    'ticket/verify',
    'ticket/area',
    'ticket/ticket'
  ];
  let eventCode = value;//https://tixcraft.com/${compare}/${eventCode}/../..
  compareList.forEach(function (compare) {
    if(eventCode.indexOf(`/${compare}/`) !== -1){
      const [domain, eventSegment] = eventCode.split(`/${compare}/`);
      if(eventSegment){//${eventCode}/../..
        eventCode = eventSegment.split('/')[0];//${eventCode}
      }
      return false;
    }
  });
  return eventCode;
}