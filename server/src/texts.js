const TEXTS = {
  uz: {
    open: 'Giftory’ni ochish',
    openList: 'Ro‘yxatni ochish',
    welcome: 'Salom! Bu Giftory boti. Do‘stlaringizning tug‘ilgan kunlari va siz tanlagan sovg‘alar haqida shu yerda eslatib turaman.',
    reserved: '🎁 Do‘stingiz “{list}” ro‘yxatingizdan sovg‘a tanladi. Kim ekanini bayramda bilasiz.',
    funded: '🎉 “{item}” uchun pul to‘liq yig‘ildi. Qo‘shganingiz uchun rahmat!',
    remind: '⏰ {owner}ning bayramiga 3 kun qoldi. Siz tanlagansiz: {items}.',
    birthday: '🎂 {name}ning tug‘ilgan kuniga 3 kun qoldi.',
    thanks: '💌 {owner} sizga rahmat aytdi: “{text}”',
    resetSubject: 'Giftory parolini tiklash',
    resetBody: 'Giftory’da parolni tiklash so‘raldi. Yangi parol o‘rnatish uchun havolani oching (1 soat amal qiladi):\n\n{link}\n\nAgar buni siz so‘ramagan bo‘lsangiz, xatni e’tiborsiz qoldiring.',
    previewText: '{owner}ning sovg‘alar ro‘yxati. Sovg‘ani yashirincha band qiling, hech kim takrorlamaydi.',
  },
  ru: {
    open: 'Открыть Giftory',
    openList: 'Открыть список',
    welcome: 'Привет! Это бот Giftory. Здесь я напомню о днях рождения друзей и подарках, которые вы выбрали.',
    reserved: '🎁 Друг выбрал подарок из вашего списка «{list}». Кто это, узнаете на празднике.',
    funded: '🎉 На «{item}» собрали всю сумму. Спасибо, что скинулись!',
    remind: '⏰ До праздника {owner} осталось 3 дня. Вы выбрали: {items}.',
    birthday: '🎂 До дня рождения {name} осталось 3 дня.',
    thanks: '💌 {owner} благодарит вас: «{text}»',
    resetSubject: 'Сброс пароля Giftory',
    resetBody: 'Кто-то запросил сброс пароля в Giftory. Чтобы задать новый пароль, откройте ссылку (действует 1 час):\n\n{link}\n\nЕсли это были не вы, просто проигнорируйте письмо.',
    previewText: 'Список желаний {owner}. Забронируйте подарок тайно, без повторов.',
  },
  en: {
    open: 'Open Giftory',
    openList: 'Open the list',
    welcome: 'Hi! This is the Giftory bot. I’ll remind you here about friends’ birthdays and the gifts you picked.',
    reserved: '🎁 A friend picked a gift from your list “{list}”. You’ll find out who on the day.',
    funded: '🎉 “{item}” is fully funded. Thanks for chipping in!',
    remind: '⏰ {owner}’s celebration is in 3 days. You picked: {items}.',
    birthday: '🎂 {name}’s birthday is in 3 days.',
    thanks: '💌 {owner} says thank you: “{text}”',
    resetSubject: 'Reset your Giftory password',
    resetBody: 'Someone asked to reset your Giftory password. Open this link to set a new one (it works for 1 hour):\n\n{link}\n\nIf this wasn’t you, ignore this email.',
    previewText: '{owner}’s wishlist. Reserve a gift in secret, nobody doubles up.',
  },
};

export const text = (lang, key, vars = {}) =>
  ((TEXTS[lang] || TEXTS.en)[key] || TEXTS.en[key]).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
