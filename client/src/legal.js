// Legal texts in plain language. Update UPDATED and CONTACT_EMAIL before relying on them.
export const UPDATED = '2026-11-14';
export const CONTACT_EMAIL = '[CONTACT EMAIL]'; // TODO: the address people can write to about their data

const c = CONTACT_EMAIL;

export const LEGAL = {
  en: {
    privacy: [
      ['Who we are', [`Giftory (giftory-b511.onrender.com) is a shared wishlist service run by Akbarali Saidmukhammedov in Tashkent, Uzbekistan. Questions about your data: ${c}.`]],
      ['What we collect', [
        'Account: your name and email, and your password stored only as a secure hash (we can’t read it). If you log in with Telegram: your Telegram ID, name and profile photo. We don’t receive your phone number.',
        'What you add: wishlists (name, occasion, date, note) and wishes (name, price, store link, photo, note).',
        'What you do: which gifts you reserve and how much you pledge to group gifts.',
        'We don’t use analytics, tracking or ads. Our hosting provider keeps short-term technical logs (such as IP address and time of a request) to keep the service secure.',
      ]],
      ['Why we use it', [
        'Only to run Giftory: show your lists, let friends reserve gifts, and keep each surprise secret. You give consent when you sign up, and you can withdraw it at any time by deleting your account.',
      ]],
      ['Who sees what', [
        'Anyone with your list link can see the list and its wishes. Friends see whether a gift is taken and whether they took it, never who else did. You, the owner, see that a gift was picked, but not who picked it or who chipped in how much.',
      ]],
      ['Where your data is stored', [
        'On servers in Frankfurt, Germany: the database runs on Neon and the website on Render. Under Uzbekistan’s Law on Personal Data as amended in 2026, this kind of data may be stored abroad, and Germany is on the approved list. Giftory does not collect biometric or genetic data, which must stay in Uzbekistan.',
      ]],
      ['Who we share it with', [
        'We never sell your data or share it for advertising. It is processed only by the services that run Giftory: Render (hosting), Neon (database), and Telegram if you choose to log in with it.',
      ]],
      ['How long we keep it', [
        'As long as you have an account. When you delete your account, we delete your profile, lists, wishes, photos and pledges. Gifts you reserved for friends become available again.',
      ]],
      ['Your rights', [
        'You can see and correct your data on your Profile page, and delete your account there at any time. You can also write to us to get a copy of your data or ask anything about it. If you think we handle your data wrongly, you can complain to Uzbekistan’s authorized state body for personal data.',
      ]],
      ['Children', ['If you are under 18, ask a parent or guardian before you sign up.']],
      ['Changes', ['If we change this policy, we’ll update the date at the top. For important changes we’ll tell you in the app first.']],
    ],
    terms: [
      ['Using Giftory', ['Giftory is free. By creating an account you agree to these terms and the Privacy Policy. Please use it only for lawful purposes and keep your login details private.']],
      ['Your content', [
        'You own what you add. You let us store and show it to the people you share your list with. Only upload photos you have the right to use, and don’t add anything illegal, hateful or misleading. We may remove content or accounts that break these rules.',
      ]],
      ['Gifts and money', [
        'Giftory does not sell products or handle payments. Store links take you to other websites with their own terms. “Chip in” on a group gift records a pledge between friends; the money is arranged between you, not through Giftory.',
      ]],
      ['The service', [
        'We work to keep Giftory running and your surprises secret, but we provide it as it is, without guarantees. We may change or stop features. To the extent the law allows, we aren’t liable for indirect losses, such as a gift that wasn’t bought.',
      ]],
      ['Ending your account', ['You can delete your account at any time from your Profile. We may suspend accounts that misuse the service.']],
      ['Law', [`These terms are governed by the laws of the Republic of Uzbekistan. Questions: ${c}.`]],
    ],
    cookies: [
      ['The short version', ['Giftory uses no advertising or analytics cookies. We only store what the site needs to work.']],
      ['What we store', [
        'giftory_token (browser storage): keeps you logged in until you log out.',
        'giftory_lang and giftory_theme (browser storage): remember your language and light or dark theme.',
        'giftory_cookie_notice (browser storage): remembers that you closed the notice about this policy.',
        'tg_oauth (cookie, 10 minutes): only while you log in with Telegram, to make sure the login really started on Giftory.',
      ]],
      ['Third parties', ['We don’t load third-party trackers, ad scripts or external fonts. When you log in with Telegram, Telegram’s own page and policies apply.']],
      ['Your choices', ['These items are essential, so they don’t need consent. You can clear them in your browser at any time; you’ll be logged out and the settings reset. If we ever add analytics, we’ll ask you first.']],
    ],
  },
  ru: {
    privacy: [
      ['Кто мы', [`Giftory (giftory-b511.onrender.com) — сервис общих вишлистов. Его ведёт Акбарали Саидмухаммедов, Ташкент, Узбекистан. Вопросы о ваших данных: ${c}.`]],
      ['Что мы собираем', [
        'Аккаунт: имя и почта, а пароль хранится только в виде защищённого хеша (мы не можем его прочитать). При входе через Telegram: ваш Telegram ID, имя и фото профиля. Номер телефона мы не получаем.',
        'То, что вы добавляете: вишлисты (название, повод, дата, записка) и желания (название, цена, ссылка, фото, записка).',
        'Ваши действия: какие подарки вы бронируете и сколько обещаете внести в общие подарки.',
        'Мы не используем аналитику, слежку и рекламу. Хостинг хранит краткосрочные технические журналы (например, IP-адрес и время запроса) для безопасности.',
      ]],
      ['Зачем', ['Только чтобы Giftory работал: показывать ваши списки, давать друзьям бронировать подарки и сохранять сюрприз. Вы даёте согласие при регистрации и можете отозвать его, удалив аккаунт.']],
      ['Кто что видит', ['Любой со ссылкой видит список и желания. Друзья видят, занят ли подарок и заняли ли его они, но не кто именно. Владелец видит, что подарок выбран, но не видит, кто его выбрал и кто сколько внёс.']],
      ['Где хранятся данные', ['На серверах во Франкфурте, Германия: база данных — Neon, сайт — Render. По Закону Узбекистана «О персональных данных» с изменениями 2026 года такие данные можно хранить за рубежом, и Германия входит в утверждённый список. Giftory не собирает биометрические и генетические данные, которые должны храниться в Узбекистане.']],
      ['С кем мы делимся', ['Мы никогда не продаём данные и не передаём их для рекламы. Их обрабатывают только сервисы, на которых работает Giftory: Render (хостинг), Neon (база данных) и Telegram, если вы входите через него.']],
      ['Сколько храним', ['Пока у вас есть аккаунт. После удаления аккаунта мы удаляем профиль, списки, желания, фото и взносы. Подарки, которые вы забронировали для друзей, снова становятся свободными.']],
      ['Ваши права', ['Вы можете посмотреть и исправить данные в Профиле и в любой момент удалить там аккаунт. Можно также написать нам, чтобы получить копию данных или задать вопрос. Если вы считаете, что мы обращаемся с данными неправильно, можно подать жалобу в уполномоченный государственный орган Узбекистана по персональным данным.']],
      ['Дети', ['Если вам меньше 18 лет, спросите разрешения у родителей перед регистрацией.']],
      ['Изменения', ['Если политика изменится, мы обновим дату вверху. О важных изменениях сначала сообщим в приложении.']],
    ],
    terms: [
      ['Использование Giftory', ['Giftory бесплатен. Создавая аккаунт, вы принимаете эти условия и Политику конфиденциальности. Используйте сервис только законно и не передавайте никому данные для входа.']],
      ['Ваш контент', ['То, что вы добавляете, принадлежит вам. Вы разрешаете нам хранить это и показывать тем, с кем вы делитесь списком. Загружайте только фото, на которые у вас есть права, и не добавляйте ничего незаконного, оскорбительного или вводящего в заблуждение. Мы можем удалить контент или аккаунты, нарушающие правила.']],
      ['Подарки и деньги', ['Giftory не продаёт товары и не принимает платежи. Ссылки ведут на другие сайты со своими условиями. «Внести» в общий подарок — это обещание между друзьями; деньги вы передаёте друг другу сами, не через Giftory.']],
      ['Сервис', ['Мы стараемся, чтобы Giftory работал, а сюрпризы оставались тайной, но предоставляем его «как есть», без гарантий. Мы можем менять или отключать функции. В пределах, разрешённых законом, мы не отвечаем за косвенные потери, например, за некупленный подарок.']],
      ['Удаление аккаунта', ['Вы можете удалить аккаунт в любой момент в Профиле. Мы можем заблокировать аккаунты, которые злоупотребляют сервисом.']],
      ['Право', [`Условия регулируются законодательством Республики Узбекистан. Вопросы: ${c}.`]],
    ],
    cookies: [
      ['Коротко', ['Giftory не использует рекламные и аналитические cookie. Мы храним только то, что нужно для работы сайта.']],
      ['Что мы храним', [
        'giftory_token (хранилище браузера): чтобы вы оставались в аккаунте, пока не выйдете.',
        'giftory_lang и giftory_theme (хранилище браузера): запоминают язык и светлую или тёмную тему.',
        'giftory_cookie_notice (хранилище браузера): запоминает, что вы закрыли уведомление об этой политике.',
        'tg_oauth (cookie, 10 минут): только во время входа через Telegram, чтобы убедиться, что вход начался на Giftory.',
      ]],
      ['Третьи стороны', ['Мы не подключаем сторонние трекеры, рекламные скрипты и внешние шрифты. При входе через Telegram действуют страница и правила Telegram.']],
      ['Ваш выбор', ['Всё это необходимо для работы, поэтому согласие не требуется. Вы можете очистить эти данные в браузере в любой момент; вы выйдете из аккаунта, а настройки сбросятся. Если мы добавим аналитику, сначала спросим вас.']],
    ],
  },
};
