// tg-auth.js — отладочная версия: видно шаги, есть кнопки
(function () {
  const CHECK_URL = "https://dqtmiqdnfdzdmmiposdn.functions.supabase.co/check_telegram";

  // ---- UI маленькой панели (в правом нижнем углу)
  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;right:10px;bottom:10px;z-index:10001;background:rgba(255,255,255,.96);border:1px solid #ccc;padding:8px 10px;border-radius:8px;font:12px/1.4 system-ui,Arial;box-shadow:0 4px 16px rgba(0,0,0,.15)";
  box.innerHTML = `
    <div><b>Проверка подписки</b></div>
    <div id="tgUserLine" style="margin:6px 0;color:#333">Не авторизован</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button id="btnCheck" style="padding:4px 8px">Проверить подписку</button>
      <button id="btnReset" style="padding:4px 8px">Сбросить вход</button>
    </div>
    <div id="tgLog" style="margin-top:6px;color:#666;max-width:260px;word-break:break-word"></div>
  `;
  document.body.appendChild(box);
  const $log = (t) => {
    console.log("[tg-auth]", t);
    const el = document.getElementById("tgLog");
    if (el) el.textContent = String(t);
  };
  const setUserLine = (txt) => {
    const el = document.getElementById("tgUserLine");
    if (el) el.textContent = txt;
  };

  // ---- Глобальные функции для виджета Telegram и ручной проверки
  window.onTelegramAuth = function (user) {
    try {
      localStorage.setItem("tg_user", JSON.stringify(user));
      setUserLine(`Логин: ${user.username || "(без @)"} | id=${user.id}`);
      $log("Логин прошёл. Запускаю checkSubscription…");
      checkSubscription(user.id);
    } catch (e) {
      console.error(e);
      alert("Ошибка авторизации через Telegram.");
    }
  };

  async function checkSubscription(telegramUserId) {
    try {
      $log("Делаю POST на check_telegram…");
      const r = await fetch(CHECK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ telegram_user_id: telegramUserId }),
      });

      const text = await r.text();
      console.log("[tg-auth] raw response:", r.status, text);

      let j;
      try {
        j = JSON.parse(text);
      } catch {
        j = { ok: false, error: "Bad JSON", raw: text };
      }

      if (r.ok && j.ok && j.subscribed) {
        document.body.classList.add("subscribed");
        localStorage.setItem("is_subscribed", "1");
        $log("✅ Подписка активна (subscribed=true).");
        alert("Подписка активна — премиум включён.");
      } else {
        document.body.classList.remove("subscribed");
        localStorage.removeItem("is_subscribed");
        $log("❌ Нет подписки или ошибка: " + (j.error || r.status));
        alert("Нет подписки или ошибка: " + (j.error || r.status));
      }
    } catch (e) {
      console.error(e);
      $log("Сетевая ошибка: " + e.message);
      alert("Сетевая ошибка проверки: " + e.message);
    }
  }

  // Кнопки панели
  document.getElementById("btnCheck").onclick = () => {
    try {
      const saved = localStorage.getItem("tg_user");
      if (!saved) {
        alert("Сначала нажмите «Войти через Telegram» на странице.");
        return;
      }
      const u = JSON.parse(saved);
      setUserLine(`Логин: ${u.username || "(без @)"} | id=${u.id}`);
      checkSubscription(u.id);
    } catch (e) {
      alert("Не удалось прочитать локальные данные о входе: " + e.message);
    }
  };

  document.getElementById("btnReset").onclick = () => {
    localStorage.removeItem("tg_user");
    localStorage.removeItem("is_subscribed");
    setUserLine("Не авторизован");
    document.body.classList.remove("subscribed");
    $log("Сброшено. Нажмите «Войти через Telegram», затем «Проверить подписку».");
  };

  // Автоподхват, если уже залогинен
  try {
    const saved = localStorage.getItem("tg_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUserLine(`Логин: ${u.username || "(без @)"} | id=${u.id}`);
      $log("Найден сохранённый вход. Готов к проверке.");
    } else {
      $log("Нет сохранённого входа. Нажмите кнопку «Войти через Telegram» на странице.");
    }
  } catch {}
})();
