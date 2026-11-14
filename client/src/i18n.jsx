import { createContext, useContext, useEffect, useState } from 'react';
import { errorText } from './api';

// Plural forms: en [one, other], ru [one, few, many]. Use {n} inside.
const en = {
  // nav and shared
  home: 'Giftory home', myLists: 'My wishlists', reservedNav: 'Reserved by me', login: 'Log in', logout: 'Log out {name}',
  create: 'Create a wishlist', madeIn: 'Made in Tashkent', createOwn: 'Create your own wishlist', goHome: 'Go to Giftory',
  som: 'soʻm', cancel: 'Cancel', close: 'Close', remove: 'Remove', loading: 'Loading…', optional: '(optional)',
  dark: 'Switch to dark mode', light: 'Switch to light mode', language: 'Language',
  // landing
  heroTitle: 'Wish out loud. Get surprised anyway.',
  heroSub: 'Make a wishlist, share one link, and friends reserve gifts in secret. Nobody doubles up. You never see who picked what.',
  demoAria: 'Your friend sees a film camera marked reserved by you. You see the same tag frosted over with a ribbon.',
  friendSees: 'What your friend sees', youSee: 'What you see', filmCamera: 'Film camera',
  stepsTitle: 'Three steps, one link', stepsSub: "Friends who only want to look don't need an account.",
  step1: 'Make your list', step1Text: 'Add anything from any store. Paste a link, set a price, and mark what you want most.',
  step2: 'Share one link', step2Text: 'Drop it in your family chat or birthday group. It opens on any phone, nothing to install.',
  step3: 'Friends pick in secret', step3Text: "Each gift can be reserved once. Then it frosts over for everyone, you included.",
  groupTitle: 'Big wish? Chip in together.',
  groupText: 'Turn on group gift for anything pricey. Everyone adds what they can and the bar fills as they go. You see the progress, never who gave how much.',
  groupAria: 'Group gift: espresso machine, 4 800 000 soʻm, 2 900 000 raised by three friends.',
  espresso: 'Espresso machine', ofTotal: 'of {total} soʻm',
  ctaTitle: 'Start your first wishlist', ctaText: "Add a few wishes now and share the link whenever you're ready.",
  // auth
  signupTitle: 'Create your account', signupSub: 'Then make your first wishlist and share it.',
  loginTitle: 'Welcome back', loginSub: 'Log in to see your wishlists and the gifts you picked.',
  yourName: 'Your name', email: 'Email', password: 'Password', show: 'Show', hide: 'Hide', pwHint: 'At least 8 characters.',
  wait: 'One moment…', createAccount: 'Create account', haveAccount: 'Already have an account?', newHere: 'New to Giftory?', register: 'Create an account',
  // dashboard
  hi: 'Hi, {name}', yourLists: 'Your wishlists', newList: 'New wishlist', loadingLists: 'Loading your wishlists…',
  noListsTitle: 'No wishlists yet', noListsText: 'Make one for your next birthday, wedding or housewarming, then share the link with friends.',
  firstList: 'Create your first wishlist', pickedOf: '{p} of {t} wishes picked', noWishesYet: 'No wishes yet. Add some.',
  listName: 'Name', listNamePh: 'My 21st birthday', occasion: 'Occasion', date: 'Date', noteForFriends: 'A note for friends',
  noteHint: 'Optional. Shown at the top of your list.', notePh: 'Thank you for thinking of me!', creating: 'Creating…', createList: 'Create wishlist',
  occasions: { Birthday: 'Birthday', Wedding: 'Wedding', 'New home': 'New home', 'New baby': 'New baby', Graduation: 'Graduation', 'Just because': 'Just because' },
  // wishlist: friend view
  opening: 'Opening the wishlist…', cantOpen: "Can't open this wishlist",
  secret: "{name} can't see who reserves what. Your pick stays wrapped until the day.",
  allWishes: 'All wishes', available: 'Still available', mine: 'Reserved by you', filterAria: 'Filter wishes',
  wishes: ['{n} wish', '{n} wishes'], alreadyReserved: '{n} already reserved',
  noneMine: "You haven't picked anything yet", nonePicked: 'Everything has been picked', showAll: 'Show all wishes',
  prioHigh: 'Really wants this', prioMedium: 'Would love this', groupGift: 'Group gift', openStore: 'Open in store',
  reserve: 'Reserve this gift', reservedByYou: 'Reserved by you', cancelReservation: 'Cancel reservation', takenByOther: 'Someone already reserved this',
  raisedAria: 'Raised so far', raised: '{x} raised', chipped: ['{n} friend chipped in', '{n} friends chipped in'],
  amountAria: 'Amount to chip in', chipIn: 'Chip in {x} soʻm', fullyFunded: 'Fully funded', youChipped: 'You chipped in {x} soʻm',
  // wishlist: owner view
  allLists: 'All wishlists', deleteList: 'Delete list', confirmDeleteList: 'Delete “{t}” and all its wishes?', addWish: 'Add a wish',
  shareLink: 'Share this link with friends', copyLink: 'Copy link', copied: 'Link copied', namesHidden: 'Names stay hidden from you',
  addTileText: 'Anything from any store, with a link and a price.', friendPicked: 'A friend picked this', findOut: "You'll find out on the day.",
  groupRaised: 'Group gift, {p}% raised', statusReserved: 'Reserved', statusChipping: 'Friends are chipping in', statusWaiting: 'Waiting for a friend',
  removeItem: 'Remove {name}', confirmRemove: 'Remove “{name}” from your list?',
  // add a wish
  toList: 'To {t}', photo: 'Photo', changePhoto: 'Change photo', uploading: 'Uploading…', chooseGallery: 'Choose from gallery',
  photoHint: 'Any photo, tall or wide. We shrink it before uploading.', pasteLink: 'Or paste an image link instead', imageLink: 'Image link', use: 'Use',
  itemName: 'Name', itemNamePh: 'Film camera', price: 'Price, soʻm', productLink: 'Link to the product', productLinkHint: 'Friends will see an “Open in store” link.',
  itemNote: 'Note for friends', itemNotePh: 'Size, color, any model is fine…', howMuch: 'How much do you want it?',
  prio: { low: 'Nice to have', medium: 'Would love it', high: 'Really want it' },
  groupToggle: 'Let friends chip in together', groupToggleHint: "Good for bigger gifts. Friends add any amount until it's covered.",
  adding: 'Adding…', addToList: 'Add to list',
  // reserved, 404
  reservedTitle: 'Gifts you picked', reservedSub: "Everything you reserved or chipped in on, so you don't forget to buy it.",
  noneReservedTitle: 'Nothing picked yet', noneReservedText: 'When a friend shares a wishlist with you, reserve a gift there and it shows up here.',
  youGave: 'You gave {x}', notFoundTitle: 'Nothing to unwrap here', notFoundText: "This page doesn't exist. Check the link, or start from the home page.",
  errors: {},
};

const ru = {
  home: 'Giftory, главная', myLists: 'Мои вишлисты', reservedNav: 'Я дарю', login: 'Войти', logout: 'Выйти ({name})',
  create: 'Создать вишлист', madeIn: 'Сделано в Ташкенте', createOwn: 'Создайте свой вишлист', goHome: 'На главную',
  som: 'сум', cancel: 'Отмена', close: 'Закрыть', remove: 'Убрать', loading: 'Загрузка…', optional: '(необязательно)',
  dark: 'Включить тёмную тему', light: 'Включить светлую тему', language: 'Язык',
  heroTitle: 'Мечтайте вслух. Удивляйтесь всё равно.',
  heroSub: 'Составьте список желаний, отправьте одну ссылку, и друзья тайно выберут подарки. Никаких повторов. Вы не узнаете, кто что выбрал.',
  demoAria: 'Друг видит фотоаппарат с пометкой «забронировано вами». Вы видите тот же ярлык под плёнкой с лентой.',
  friendSees: 'Что видит друг', youSee: 'Что видите вы', filmCamera: 'Плёночный фотоаппарат',
  stepsTitle: 'Три шага, одна ссылка', stepsSub: 'Чтобы просто посмотреть список, регистрация не нужна.',
  step1: 'Составьте список', step1Text: 'Добавьте что угодно из любого магазина: ссылку, цену и что хочется больше всего.',
  step2: 'Отправьте ссылку', step2Text: 'В семейный чат или группу друзей. Откроется на любом телефоне, ничего не нужно устанавливать.',
  step3: 'Друзья выбирают тайно', step3Text: 'Каждый подарок можно забронировать один раз. Потом он скрывается под плёнкой для всех, и для вас тоже.',
  groupTitle: 'Дорогой подарок? Скиньтесь вместе.',
  groupText: 'Включите «общий подарок» для дорогих вещей. Каждый вносит сколько может, и шкала заполняется. Вы видите прогресс, но не кто сколько дал.',
  groupAria: 'Общий подарок: кофемашина, 4 800 000 сум, три друга собрали 2 900 000.',
  espresso: 'Кофемашина', ofTotal: 'из {total} сум',
  ctaTitle: 'Создайте первый вишлист', ctaText: 'Добавьте пару желаний сейчас, а ссылкой поделитесь, когда будете готовы.',
  signupTitle: 'Создайте аккаунт', signupSub: 'Потом составьте первый вишлист и поделитесь им.',
  loginTitle: 'С возвращением', loginSub: 'Войдите, чтобы увидеть свои вишлисты и подарки, которые вы выбрали.',
  yourName: 'Ваше имя', email: 'Эл. почта', password: 'Пароль', show: 'Показать', hide: 'Скрыть', pwHint: 'Минимум 8 символов.',
  wait: 'Секунду…', createAccount: 'Создать аккаунт', haveAccount: 'Уже есть аккаунт?', newHere: 'Впервые в Giftory?', register: 'Зарегистрироваться',
  hi: 'Привет, {name}', yourLists: 'Ваши вишлисты', newList: 'Новый вишлист', loadingLists: 'Загружаем ваши вишлисты…',
  noListsTitle: 'Пока нет вишлистов', noListsText: 'Создайте вишлист к дню рождения, свадьбе или новоселью и поделитесь ссылкой с друзьями.',
  firstList: 'Создать первый вишлист', pickedOf: 'Выбрано {p} из {t}', noWishesYet: 'Пока нет желаний. Добавьте.',
  listName: 'Название', listNamePh: 'Мой 21-й день рождения', occasion: 'Повод', date: 'Дата', noteForFriends: 'Записка для друзей',
  noteHint: 'Необязательно. Показывается вверху списка.', notePh: 'Спасибо, что думаете обо мне!', creating: 'Создаём…', createList: 'Создать вишлист',
  occasions: { Birthday: 'День рождения', Wedding: 'Свадьба', 'New home': 'Новоселье', 'New baby': 'Рождение малыша', Graduation: 'Выпускной', 'Just because': 'Просто так' },
  opening: 'Открываем вишлист…', cantOpen: 'Не удаётся открыть вишлист',
  secret: '{name} не видит, кто что бронирует. Ваш выбор останется сюрпризом до праздника.',
  allWishes: 'Все желания', available: 'Свободные', mine: 'Мои', filterAria: 'Фильтр желаний',
  wishes: ['{n} желание', '{n} желания', '{n} желаний'], alreadyReserved: 'забронировано: {n}',
  noneMine: 'Вы пока ничего не выбрали', nonePicked: 'Всё уже выбрали', showAll: 'Показать все',
  prioHigh: 'Очень хочет', prioMedium: 'Хочет', groupGift: 'Общий подарок', openStore: 'Открыть в магазине',
  reserve: 'Забронировать', reservedByYou: 'Забронировано вами', cancelReservation: 'Отменить бронь', takenByOther: 'Уже кто-то забронировал',
  raisedAria: 'Собрано', raised: 'собрано {x}', chipped: ['скинулся {n} друг', 'скинулись {n} друга', 'скинулись {n} друзей'],
  amountAria: 'Сумма взноса', chipIn: 'Внести {x} сум', fullyFunded: 'Собрано полностью', youChipped: 'Вы внесли {x} сум',
  allLists: 'Все вишлисты', deleteList: 'Удалить список', confirmDeleteList: 'Удалить «{t}» со всеми желаниями?', addWish: 'Добавить желание',
  shareLink: 'Поделитесь ссылкой с друзьями', copyLink: 'Копировать', copied: 'Скопировано', namesHidden: 'Имена от вас скрыты',
  addTileText: 'Что угодно из любого магазина, со ссылкой и ценой.', friendPicked: 'Это уже выбрал друг', findOut: 'Узнаете в день праздника.',
  groupRaised: 'Общий подарок, собрано {p}%', statusReserved: 'Забронировано', statusChipping: 'Друзья скидываются', statusWaiting: 'Ждёт друга',
  removeItem: 'Удалить «{name}»', confirmRemove: 'Удалить «{name}» из списка?',
  toList: 'В список «{t}»', photo: 'Фото', changePhoto: 'Заменить фото', uploading: 'Загружаем…', chooseGallery: 'Выбрать из галереи',
  photoHint: 'Любое фото, вертикальное или горизонтальное. Мы сожмём его перед загрузкой.', pasteLink: 'Или вставьте ссылку на картинку', imageLink: 'Ссылка на картинку', use: 'Готово',
  itemName: 'Название', itemNamePh: 'Плёночный фотоаппарат', price: 'Цена, сум', productLink: 'Ссылка на товар', productLinkHint: 'Друзья увидят ссылку «Открыть в магазине».',
  itemNote: 'Записка для друзей', itemNotePh: 'Размер, цвет, подойдёт любая модель…', howMuch: 'Насколько хочется?',
  prio: { low: 'Было бы неплохо', medium: 'Хочу', high: 'Очень хочу' },
  groupToggle: 'Друзья могут скинуться', groupToggleHint: 'Для дорогих подарков. Друзья вносят любую сумму, пока не наберётся.',
  adding: 'Добавляем…', addToList: 'Добавить',
  reservedTitle: 'Подарки, которые вы дарите', reservedSub: 'Всё, что вы забронировали или на что скинулись, чтобы не забыть купить.',
  noneReservedTitle: 'Пока ничего не выбрано', noneReservedText: 'Когда друг поделится вишлистом, забронируйте там подарок, и он появится здесь.',
  youGave: 'Вы внесли {x}', notFoundTitle: 'Здесь нечего распаковывать', notFoundText: 'Такой страницы нет. Проверьте ссылку или начните с главной.',
  // Server and network messages, keyed by their English text
  errors: {
    'Log in to continue': 'Войдите, чтобы продолжить',
    'Enter your name and email': 'Введите имя и почту',
    'Password needs at least 8 characters': 'Пароль должен быть не короче 8 символов',
    'This email already has an account. Log in instead.': 'С этой почтой уже есть аккаунт. Войдите.',
    'Wrong email or password': 'Неверная почта или пароль',
    'Account not found': 'Аккаунт не найден',
    'Wishlist not found': 'Вишлист не найден',
    'Only the owner can do this': 'Это может сделать только владелец',
    'Give your wishlist a name': 'Дайте вишлисту название',
    'This wishlist does not exist or was deleted': 'Такого вишлиста нет или он удалён',
    'Nothing to update': 'Нечего обновлять',
    'Give the wish a name': 'Дайте желанию название',
    'Enter a price in soʻm': 'Укажите цену в сумах',
    'This wish no longer exists': 'Этого желания больше нет',
    "You can't pick gifts from your own list": 'Нельзя выбирать подарки из своего списка',
    'Someone already reserved this gift': 'Этот подарок уже кто-то забронировал',
    "You haven't reserved this gift": 'Вы не бронировали этот подарок',
    'Enter an amount above zero': 'Введите сумму больше нуля',
    'That amount is more than what is left to raise': 'Эта сумма больше, чем осталось собрать',
    'Choose a JPG, PNG or WebP photo': 'Выберите фото в формате JPG, PNG или WebP',
    'Photo not found': 'Фото не найдено',
    'That photo is too big. Try a smaller one.': 'Фото слишком большое. Попробуйте поменьше.',
    'Not found': 'Не найдено',
    'Check the values you entered': 'Проверьте введённые данные',
    'Something went wrong on our side': 'Что-то пошло не так на нашей стороне',
    'Could not reach Giftory. Check your connection and try again.': 'Не удаётся связаться с Giftory. Проверьте интернет и попробуйте снова.',
    'Choose a photo file': 'Выберите файл с фото',
    "Couldn't read that photo. Try a JPG or PNG.": 'Не удалось прочитать фото. Попробуйте JPG или PNG.',
  },
};

const DICTS = { en, ru };
const pluralIndex = (lang, n) => {
  if (lang === 'en') return n === 1 ? 0 : 1;
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2;
};
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const PrefsContext = createContext(null);
const saved = (k, fallback) => { try { return localStorage.getItem(k) || fallback; } catch { return fallback; } };

export function PrefsProvider({ children }) {
  const [lang, setLang] = useState(() => saved('giftory_lang', 'en'));
  const [theme, setTheme] = useState(() => saved('giftory_theme', 'light'));

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('giftory_lang', lang); } catch {}
  }, [lang]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('giftory_theme', theme); } catch {}
  }, [theme]);

  const dict = DICTS[lang] || en;
  const t = (key, vars = {}) => {
    const v = dict[key] ?? en[key] ?? key;
    return fill(Array.isArray(v) ? v[pluralIndex(lang, vars.n)] : v, vars);
  };
  t.occasion = (o) => dict.occasions[o] || o;
  t.prio = (p) => dict.prio[p];
  t.error = (e) => { const msg = e?.isAxiosError || !e?.message ? errorText(e) : e.message; return dict.errors[msg] || msg; };
  t.date = (d) => (d ? new Date(d).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');

  return <PrefsContext.Provider value={{ t, lang, setLang, theme, setTheme }}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
export const useT = () => useContext(PrefsContext).t;
