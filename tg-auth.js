// tg-auth.js — авторизация через Telegram + проверка подписки в Supabase
(function(){
  // Твой project-ref уже подставлен
  const CHECK_URL = "https://dqtmiqdnfdzdmmiposdn.functions.supabase.co/check_telegram";

  window.onTelegramAuth = function(user){
    try {
      localStorage.setItem("tg_user", JSON.stringify(user));
      checkSubscription(user.id);
    } catch(e) {
      console.error(e);
      alert("Ошибка авторизации через Telegram.");
    }
  };

  async function checkSubscription(telegramUserId){
    try {
      const r = await fetch(CHECK_URL, {
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify({ telegram_user_id: telegramUserId })
      });
      const j = await r.json();
      if (j.ok && j.subscribed){
        document.body.classList.add("subscribed");
        localStorage.setItem("is_subscribed", "1");
        console.log("Подписка активна");
      } else {
        document.body.classList.remove("subscribed");
        localStorage.removeItem("is_subscribed");
        alert("Нет активной подписки. Оплатите через Telegram бота — и вступите в канал.");
      }
    } catch(e){
      console.error(e);
      alert("Ошибка проверки подписки.");
    }
  }

  // автопроверка при загрузке
  try {
    const saved = localStorage.getItem("tg_user");
    if (saved){
      const u = JSON.parse(saved);
      checkSubscription(u.id);
    }
  } catch(e){}
})();
