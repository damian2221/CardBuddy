(function() {
  const CARD_NUMBER_LOOSE_REGEX = /(([^a-z])cc([^a-z]))|credit|debit|card/g;
  const CARD_NUMBER_TIGHT_REGEX = /((([^a-z])cc([^a-z]))|ccnum|credit|debit|card)(.+?){0,}num/g;
  const EXPIRATION_REGEX = /expir|mmyy/g;
  const EXPIRATION_MONTH_REGEX = /month/g;
  const EXPIRATION_YEAR_REGEX = /year/g;
  const CVV_REGEX =
    /(([^a-z])cv([^a-z]))|(([^a-z])ci([^a-z]))|(([^a-z])cs([^a-z]))|cvnum|csnum|cinum|cvn|cvv|cvc|csc|cvd|cid|ccv/g;
  let creditCardInput = null;
  let expirationInput = null;
  let cvvInput = null;
  let isOnclickAttached = false;
  let expirationMonth = null;
  let expirationYear = null;

  function enableClicksOnCardInputs() {
    if (isOnclickAttached) {
      return;
    }

    const inputs = document.getElementsByTagName("input");
    let shouldSearchTightCardNumber = false;

    for (let i = 0; i < inputs.length; i++) {
      if (!expirationInput && isAppropriateField(inputs[i], EXPIRATION_REGEX, false,2)) {
        expirationInput = inputs[i];
      } else if (!cvvInput && isAppropriateField(inputs[i], CVV_REGEX, false, 3)) {
        cvvInput = inputs[i];
      } else if (isAppropriateField(inputs[i], CARD_NUMBER_LOOSE_REGEX, false, 16)) {
        if (creditCardInput) {
          shouldSearchTightCardNumber = true;
        }
        creditCardInput = inputs[i];
      }
    }

    if (!expirationInput) {
      const selects = document.getElementsByTagName("select");
      for (let i = 0; i < selects.length; i++) {
        if (!expirationMonth && isAppropriateField(selects[i], EXPIRATION_MONTH_REGEX, false,0)) {
          expirationMonth = selects[i];
        } else if (!expirationYear && isAppropriateField(selects[i], EXPIRATION_YEAR_REGEX, false,0)) {
          expirationYear = selects[i];
        }
      }
    }

    if (shouldSearchTightCardNumber) {
      for (let i = 0; i < inputs.length; i++) {
        if (isAppropriateField(inputs[i], CARD_NUMBER_TIGHT_REGEX, true, 16)) {
          creditCardInput = inputs[i];
        }
      }
    }

    if (creditCardInput) {
      attachOnClick()
    }
  }

  function attachOnClick() {
    isOnclickAttached = true;
    attachOnClickToElement(creditCardInput);
    attachOnClickToElement(expirationInput);
    attachOnClickToElement(cvvInput);
  }

  function attachOnClickToElement(element) {
    if (!element) {
      return;
    }
    $(element).on("click", function() {
      const bodyOnClick = function(e) {
        if(e.target.id === "credit-buddy-tooltip" || $(e.target).closest("#credit-buddy-tooltip").length) {
          return;
        }
        $("#credit-buddy-tooltip").fadeOut('fast', function() {$(this).remove()});
        $("body").off("click", bodyOnClick);
      }
        $("<div id='credit-buddy-tooltip'>Click on me to get help from your card buddy!</div>")
          .css({cursor: 'pointer', width: 155, padding: 5, borderBottomLeftRadius: 7, borderTopRightRadius: 7,
            borderBottomRightRadius: 7, zIndex: 1000000, backgroundColor: "white", border: "1px solid black",
            position: 'absolute', top: $(element).offset().top, left: $(element).offset().left+($(element).width()),
            display: "none"})
          .appendTo("body")
          .fadeIn()
          .on("click", function() {
            $("body").off("click", bodyOnClick);
            $(this).text('Great! You should receive a notification on your phone.').delay(2500).fadeOut('slow',
              function() {$(this).remove()});
            $.ajax({url: 'https://fcm.googleapis.com/fcm/send',
              contentType: "application/json; charset=utf-8", dataType: "json", method: 'POST', headers: {
                Authorization: "key=AAAA-DeILhk:APA91bFXUaex78pyB2ZjXMALcufMyNTbBUdqAVLytETi0rY8rVZj-F1kZAZxm-zYyWi" +
                  "IMySM_5ygGKeu4xO672C_Eu0wZ590-ywQqCsF4O5DEQmETi35sNNMPBA50imiie9XHfSbRk2l"
              }, data: "{\"notification\":{\"title\":\"Approve Use of card\",\"text\":\"Please scan your" +
                " fingerprint\",\"sound\":\"enable\",\"priority\":\"high\"},\"to\":\"eQWGn3mJqqw:APA91bE4R0-avaXyKACbHH" +
                "fxweRQah1iFEkO5PVozQQSUQmGlKvLUejUeCJyCnTOoIZDxWxsOrjwqiA8q8Z7A7Kwj28KbI7HI0ENcAlr9p3xibZAEPKEMYSuk" +
                "fE5AI-58XZ_N6U9bgOf\"}"});
            const webSocket = new WebSocket("ws://localhost:8080");
            webSocket.onmessage = function(data) {
              fill(JSON.parse(data.data));
              webSocket.close();
            };
          });
        setTimeout(function() {
          $("body").on("click", bodyOnClick);
        }, 500);
      });
  }

  function isAppropriateField(element, regex, isTight, minMaxLength) {
    return (element.type != "hidden") && ((element.name && element.name.toLowerCase().search(regex) > -1 &&
      (!isTight || element.name.toLowerCase().search(/gift/) < 0)) ||
      (element.id && element.id.toLowerCase().search(regex) > -1 &&
        (!isTight || element.id.toLowerCase().search(/gift/) < 0)) ||
      (element.getAttribute('x-autocompletetype') &&
        element.getAttribute('x-autocompletetype').toLowerCase().search(regex) > -1 &&
        (!isTight || element.getAttribute('x-autocompletetype').toLowerCase().search(/gift/) < 0))) ||
      (element.placeholder && element.placeholder.toLowerCase().search(regex) > -1 &&
        (!isTight || element.placeholder.toLowerCase().search(/gift/) < 0)) &&
      (!parseInt(element.getAttribute('maxlength')) || parseInt(element.getAttribute('maxlength')) >= minMaxLength);
  }

  function fill(cardDetails) {
    const number = cardDetails.number.toString();
    for (let i = 0; i < number.length; i++) {
      creditCardInput.dispatchEvent(new KeyboardEvent('keypress',{'key': number[i]}));
    }
    creditCardInput.value = number;
    if (expirationInput) {
      const expirationDate = cardDetails.exp_month + '/' + cardDetails.exp_year;
      for (let i = 0; i < expirationDate.length; i++) {
        expirationInput.dispatchEvent(new KeyboardEvent('keypress', {'key': expirationDate[i]}));
      }
      expirationInput.value = expirationDate;
    }
    if (cvvInput) {
      const cvv = cardDetails.cvv.toString();
      for (let i = 0; i < cvv.length; i++) {
        creditCardInput.dispatchEvent(new KeyboardEvent('keypress', {'key': cvv[i]}));
      }
      cvvInput.value = cvv;
    }
    if (expirationMonth && expirationYear) {
      $(expirationMonth).val(cardDetails.exp_month);
      $(expirationYear).val('20' + cardDetails.exp_year);
    }
  }

  if ("MutationObserver" in window) {
    const mutationObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        enableClicksOnCardInputs();
      });
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();