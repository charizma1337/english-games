/* =========================================================
   MIRACULOUS: CHRONO RIFT — база неправильных глаголов
   Источник: таблица неправильных глаголов,
   86 глаголов из обеих половин, сверено с грамматикой.
   ========================================================= */
window.CR = window.CR || {};
CR.games = CR.games || {};

(function () {
  // V(v1, v2, v3, ru, ipa[3], sentence[subject, rest, time, ruSentence, plural?])
  // Альтернативы — через «/». Предложение: Past Simple «S V2 rest time.»
  const RAW = [
    ['be', 'was/were', 'been', 'быть, находиться', ['biː', 'wɒz / wɜː', 'biːn'], ['Ladybug', 'in the park', 'yesterday', 'Вчера Леди Баг была в парке.']],
    ['become', 'became', 'become', 'становиться', ['bɪˈkʌm', 'bɪˈkeɪm', 'bɪˈkʌm'], ['Nino', 'a famous DJ', 'last year', 'В прошлом году Нино стал известным диджеем.']],
    ['begin', 'began', 'begun', 'начинать(ся)', ['bɪˈɡɪn', 'bɪˈɡæn', 'bɪˈɡʌn'], ['The lesson', 'at nine', 'yesterday', 'Вчера урок начался в девять.']],
    ['break', 'broke', 'broken', 'ломать, разбивать', ['breɪk', 'brəʊk', 'ˈbrəʊkən'], ['The akuma', 'the big clock', 'last night', 'Прошлой ночью акума сломал большие часы.']],
    ['bring', 'brought', 'brought', 'приносить', ['brɪŋ', 'brɔːt', 'brɔːt'], ['Marinette', 'croissants for her friends', 'this morning', 'Этим утром Маринетт принесла друзьям круассаны.']],
    ['build', 'built', 'built', 'строить', ['bɪld', 'bɪlt', 'bɪlt'], ['Max', 'a little robot', 'last month', 'В прошлом месяце Макс построил маленького робота.']],
    ['burn', 'burned/burnt', 'burned/burnt', 'гореть, сжигать', ['bɜːn', 'bɜːnd / bɜːnt', 'bɜːnd / bɜːnt'], ['Tom', 'the cookies', 'yesterday', 'Вчера Том сжёг печенье.']],
    ['buy', 'bought', 'bought', 'покупать', ['baɪ', 'bɔːt', 'bɔːt'], ['Alya', 'a new phone', 'last week', 'На прошлой неделе Алья купила новый телефон.']],
    ['catch', 'caught', 'caught', 'ловить', ['kætʃ', 'kɔːt', 'kɔːt'], ['Ladybug', 'the akuma', 'yesterday', 'Вчера Леди Баг поймала акуму.']],
    ['choose', 'chose', 'chosen', 'выбирать', ['tʃuːz', 'tʃəʊz', 'ˈtʃəʊzn'], ['Marinette', 'a pink fabric', 'yesterday', 'Вчера Маринетт выбрала розовую ткань.']],
    ['come', 'came', 'come', 'приходить', ['kʌm', 'keɪm', 'kʌm'], ['Cat Noir', 'to the rescue', 'last night', 'Прошлой ночью Супер-Кот пришёл на помощь.']],
    ['cost', 'cost', 'cost', 'стоить', ['kɒst', 'kɒst', 'kɒst'], ['The ticket', 'ten euros', 'last year', 'В прошлом году билет стоил десять евро.']],
    ['cut', 'cut', 'cut', 'резать', ['kʌt', 'kʌt', 'kʌt'], ['Marinette', 'the red ribbon', 'yesterday', 'Вчера Маринетт отрезала красную ленту.']],
    ['dig', 'dug', 'dug', 'копать', ['dɪɡ', 'dʌɡ', 'dʌɡ'], ['The dog', 'a hole in the park', 'yesterday', 'Вчера собака выкопала яму в парке.']],
    ['do', 'did', 'done', 'делать', ['duː', 'dɪd', 'dʌn'], ['Adrien', 'his homework', 'last night', 'Вчера вечером Адриан сделал домашнее задание.']],
    ['draw', 'drew', 'drawn', 'рисовать', ['drɔː', 'druː', 'drɔːn'], ['Marinette', 'a new dress', 'yesterday', 'Вчера Маринетт нарисовала новое платье.']],
    ['dream', 'dreamed/dreamt', 'dreamed/dreamt', 'мечтать, видеть сон', ['driːm', 'driːmd / dremt', 'driːmd / dremt'], ['Marinette', 'about Adrien', 'last night', 'Прошлой ночью Маринетт мечтала об Адриане.']],
    ['drink', 'drank', 'drunk', 'пить', ['drɪŋk', 'dræŋk', 'drʌŋk'], ['Alya', 'hot chocolate', 'this morning', 'Этим утром Алья выпила горячий шоколад.']],
    ['drive', 'drove', 'driven', 'водить, везти', ['draɪv', 'drəʊv', 'ˈdrɪvn'], ['The driver', 'Adrien to school', 'yesterday', 'Вчера водитель отвёз Адриана в школу.']],
    ['eat', 'ate', 'eaten', 'есть, кушать', ['iːt', 'et', 'ˈiːtn'], ['Plagg', 'all the cheese', 'yesterday', 'Вчера Плагг съел весь сыр.']],
    ['fall', 'fell', 'fallen', 'падать', ['fɔːl', 'fel', 'ˈfɔːlən'], ['Chloé', 'into the fountain', 'last week', 'На прошлой неделе Хлоя упала в фонтан.']],
    ['feed', 'fed', 'fed', 'кормить', ['fiːd', 'fed', 'fed'], ['Marinette', 'Tikki a cookie', 'this morning', 'Этим утром Маринетт накормила Тикки печеньем.']],
    ['feel', 'felt', 'felt', 'чувствовать', ['fiːl', 'felt', 'felt'], ['Ladybug', 'very brave', 'yesterday', 'Вчера Леди Баг чувствовала себя очень смелой.']],
    ['fight', 'fought', 'fought', 'сражаться', ['faɪt', 'fɔːt', 'fɔːt'], ['The heroes', 'the akuma', 'last night', 'Прошлой ночью герои сражались с акумой.', true]],
    ['find', 'found', 'found', 'находить', ['faɪnd', 'faʊnd', 'faʊnd'], ['Cat Noir', 'the lost ring', 'yesterday', 'Вчера Супер-Кот нашёл потерянное кольцо.']],
    ['fly', 'flew', 'flown', 'летать', ['flaɪ', 'fluː', 'fləʊn'], ['The butterfly', 'over Paris', 'last night', 'Прошлой ночью бабочка пролетела над Парижем.']],
    ['forget', 'forgot', 'forgotten', 'забывать', ['fəˈɡet', 'fəˈɡɒt', 'fəˈɡɒtn'], ['Nino', 'his headphones', 'yesterday', 'Вчера Нино забыл свои наушники.']],
    ['forgive', 'forgave', 'forgiven', 'прощать', ['fəˈɡɪv', 'fəˈɡeɪv', 'fəˈɡɪvn'], ['Marinette', 'Chloé', 'last week', 'На прошлой неделе Маринетт простила Хлою.']],
    ['get', 'got', 'got', 'получать', ['ɡet', 'ɡɒt', 'ɡɒt'], ['Alya', 'a message from Ladybug', 'yesterday', 'Вчера Алья получила сообщение от Леди Баг.']],
    ['give', 'gave', 'given', 'давать', ['ɡɪv', 'ɡeɪv', 'ˈɡɪvn'], ['Master Fu', 'Marinette a gift', 'two years ago', 'Два года назад Мастер Фу дал Маринетт подарок.']],
    ['go', 'went', 'gone', 'идти, ехать', ['ɡəʊ', 'went', 'ɡɒn'], ['Ladybug', 'to the Eiffel Tower', 'yesterday', 'Вчера Леди Баг отправилась к Эйфелевой башне.']],
    ['grow', 'grew', 'grown', 'расти, выращивать', ['ɡrəʊ', 'ɡruː', 'ɡrəʊn'], ['The flowers', 'very fast', 'last spring', 'Прошлой весной цветы росли очень быстро.', true]],
    ['have', 'had', 'had', 'иметь', ['hæv', 'hæd', 'hæd'], ['The class', 'a picnic', 'last Sunday', 'В прошлое воскресенье у класса был пикник.']],
    ['hear', 'heard', 'heard', 'слышать', ['hɪə', 'hɜːd', 'hɜːd'], ['Cat Noir', 'a strange noise', 'last night', 'Прошлой ночью Супер-Кот услышал странный шум.']],
    ['hide', 'hid', 'hidden', 'прятать(ся)', ['haɪd', 'hɪd', 'ˈhɪdn'], ['Tikki', 'in Marinette\'s bag', 'yesterday', 'Вчера Тикки спряталась в сумке Маринетт.']],
    ['hit', 'hit', 'hit', 'ударять', ['hɪt', 'hɪt', 'hɪt'], ['The akuma', 'the wall', 'yesterday', 'Вчера акума ударил стену.']],
    ['hold', 'held', 'held', 'держать', ['həʊld', 'held', 'held'], ['Ladybug', 'the magic yo-yo', 'last night', 'Прошлой ночью Леди Баг держала волшебный йо-йо.']],
    ['hurt', 'hurt', 'hurt', 'ранить, причинять боль', ['hɜːt', 'hɜːt', 'hɜːt'], ['Cat Noir', 'his paw', 'yesterday', 'Вчера Супер-Кот поранил лапу.']],
    ['keep', 'kept', 'kept', 'хранить, держать', ['kiːp', 'kept', 'kept'], ['Marinette', 'the secret', 'last year', 'В прошлом году Маринетт хранила секрет.']],
    ['know', 'knew', 'known', 'знать', ['nəʊ', 'njuː', 'nəʊn'], ['Alya', 'the answer', 'yesterday', 'Вчера Алья знала ответ.']],
    ['lead', 'led', 'led', 'вести, руководить', ['liːd', 'led', 'led'], ['Ladybug', 'the team', 'last night', 'Прошлой ночью Леди Баг вела команду.']],
    ['learn', 'learned/learnt', 'learned/learnt', 'учить, узнавать', ['lɜːn', 'lɜːnd / lɜːnt', 'lɜːnd / lɜːnt'], ['Marinette', 'a new song', 'last week', 'На прошлой неделе Маринетт выучила новую песню.']],
    ['leave', 'left', 'left', 'уходить, оставлять', ['liːv', 'left', 'left'], ['Adrien', 'the house', 'this morning', 'Этим утром Адриан ушёл из дома.']],
    ['lend', 'lent', 'lent', 'одалживать', ['lend', 'lent', 'lent'], ['Nino', 'Adrien his pen', 'yesterday', 'Вчера Нино одолжил Адриану ручку.']],
    ['let', 'let', 'let', 'позволять', ['let', 'let', 'let'], ['Ladybug', 'Cat Noir go first', 'yesterday', 'Вчера Леди Баг позволила Супер-Коту пойти первым.']],
    ['lie', 'lay', 'lain', 'лежать', ['laɪ', 'leɪ', 'leɪn'], ['The cat', 'on the sofa', 'yesterday', 'Вчера кот лежал на диване.']],
    ['light', 'lit', 'lit', 'зажигать', ['laɪt', 'lɪt', 'lɪt'], ['Marinette', 'the candles', 'last night', 'Вчера вечером Маринетт зажгла свечи.']],
    ['lose', 'lost', 'lost', 'терять', ['luːz', 'lɒst', 'lɒst'], ['Cat Noir', 'his staff', 'yesterday', 'Вчера Супер-Кот потерял свой посох.']],
    ['make', 'made', 'made', 'делать, создавать', ['meɪk', 'meɪd', 'meɪd'], ['Marinette', 'a scarf for Adrien', 'last year', 'В прошлом году Маринетт сделала шарф для Адриана.']],
    ['mean', 'meant', 'meant', 'значить, иметь в виду', ['miːn', 'ment', 'ment'], ['Ladybug', 'every word', 'yesterday', 'Вчера Леди Баг говорила всерьёз — каждое слово.']],
    ['meet', 'met', 'met', 'встречать', ['miːt', 'met', 'met'], ['Marinette', 'Adrien in the park', 'yesterday', 'Вчера Маринетт встретила Адриана в парке.']],
    ['pay', 'paid', 'paid', 'платить', ['peɪ', 'peɪd', 'peɪd'], ['Alya', 'for the pizza', 'last night', 'Вчера вечером Алья заплатила за пиццу.']],
    ['put', 'put', 'put', 'класть, ставить', ['pʊt', 'pʊt', 'pʊt'], ['Ladybug', 'the box on the table', 'yesterday', 'Вчера Леди Баг положила шкатулку на стол.']],
    ['read', 'read', 'read', 'читать', ['riːd', 'red', 'red'], ['Alya', 'the Ladyblog news', 'this morning', 'Этим утром Алья прочитала новости Ледиблога.']],
    ['ride', 'rode', 'ridden', 'ехать верхом / на велосипеде', ['raɪd', 'rəʊd', 'ˈrɪdn'], ['Marinette', 'a bike to school', 'yesterday', 'Вчера Маринетт поехала в школу на велосипеде.']],
    ['ring', 'rang', 'rung', 'звонить, звенеть', ['rɪŋ', 'ræŋ', 'rʌŋ'], ['The school bell', 'at noon', 'yesterday', 'Вчера школьный звонок прозвенел в полдень.']],
    ['run', 'ran', 'run', 'бегать, бежать', ['rʌn', 'ræn', 'rʌn'], ['Cat Noir', 'across the roofs', 'last night', 'Прошлой ночью Супер-Кот бежал по крышам.']],
    ['say', 'said', 'said', 'сказать', ['seɪ', 'sed', 'sed'], ['Ladybug', 'hello to Cat Noir', 'yesterday', 'Вчера Леди Баг поздоровалась с Супер-Котом.']],
    ['see', 'saw', 'seen', 'видеть', ['siː', 'sɔː', 'siːn'], ['Ladybug', 'the villain', 'yesterday', 'Вчера Леди Баг увидела злодея.']],
    ['sell', 'sold', 'sold', 'продавать', ['sel', 'səʊld', 'səʊld'], ['Tom', 'fresh bread', 'yesterday', 'Вчера Том продавал свежий хлеб.']],
    ['send', 'sent', 'sent', 'посылать', ['send', 'sent', 'sent'], ['Alya', 'a video to Ladybug', 'last night', 'Вчера вечером Алья отправила видео Леди Баг.']],
    ['set', 'set', 'set', 'устанавливать', ['set', 'set', 'set'], ['Ladybug', 'a trap for the akuma', 'yesterday', 'Вчера Леди Баг поставила ловушку для акумы.']],
    ['shine', 'shone', 'shone', 'светить, сиять', ['ʃaɪn', 'ʃɒn', 'ʃɒn'], ['The moon', 'over Paris', 'last night', 'Прошлой ночью луна светила над Парижем.']],
    ['show', 'showed', 'shown', 'показывать', ['ʃəʊ', 'ʃəʊd', 'ʃəʊn'], ['Marinette', 'her sketches to the class', 'yesterday', 'Вчера Маринетт показала классу свои эскизы.']],
    ['shut', 'shut', 'shut', 'закрывать', ['ʃʌt', 'ʃʌt', 'ʃʌt'], ['Chloé', 'the door', 'yesterday', 'Вчера Хлоя закрыла дверь.']],
    ['sing', 'sang', 'sung', 'петь', ['sɪŋ', 'sæŋ', 'sʌŋ'], ['Jagged Stone', 'a new song', 'last night', 'Вчера вечером Джаггед Стоун спел новую песню.']],
    ['sit', 'sat', 'sat', 'сидеть', ['sɪt', 'sæt', 'sæt'], ['Adrien', 'next to Nino', 'yesterday', 'Вчера Адриан сидел рядом с Нино.']],
    ['sleep', 'slept', 'slept', 'спать', ['sliːp', 'slept', 'slept'], ['Plagg', 'in the cheese box', 'last night', 'Прошлой ночью Плагг спал в коробке из-под сыра.']],
    ['smell', 'smelled/smelt', 'smelled/smelt', 'нюхать, пахнуть', ['smel', 'smeld / smelt', 'smeld / smelt'], ['Tikki', 'fresh cookies', 'this morning', 'Этим утром Тикки почуяла свежее печенье.']],
    ['speak', 'spoke', 'spoken', 'говорить', ['spiːk', 'spəʊk', 'ˈspəʊkən'], ['Ladybug', 'to the people of Paris', 'yesterday', 'Вчера Леди Баг обратилась к жителям Парижа.']],
    ['spend', 'spent', 'spent', 'тратить, проводить (время)', ['spend', 'spent', 'spent'], ['Chloé', 'all her money', 'last week', 'На прошлой неделе Хлоя потратила все свои деньги.']],
    ['spill', 'spilled/spilt', 'spilled/spilt', 'проливать', ['spɪl', 'spɪld / spɪlt', 'spɪld / spɪlt'], ['Nino', 'his juice', 'yesterday', 'Вчера Нино пролил свой сок.']],
    ['stand', 'stood', 'stood', 'стоять', ['stænd', 'stʊd', 'stʊd'], ['Cat Noir', 'on the roof', 'last night', 'Прошлой ночью Супер-Кот стоял на крыше.']],
    ['steal', 'stole', 'stolen', 'красть', ['stiːl', 'stəʊl', 'ˈstəʊlən'], ['The akuma', 'the museum key', 'last night', 'Прошлой ночью акума украл ключ от музея.']],
    ['swim', 'swam', 'swum', 'плавать', ['swɪm', 'swæm', 'swʌm'], ['Adrien', 'in the pool', 'yesterday', 'Вчера Адриан плавал в бассейне.']],
    ['take', 'took', 'taken', 'брать', ['teɪk', 'tʊk', 'ˈteɪkən'], ['Alya', 'a photo of Ladybug', 'yesterday', 'Вчера Алья сделала фото Леди Баг.']],
    ['teach', 'taught', 'taught', 'учить, обучать', ['tiːtʃ', 'tɔːt', 'tɔːt'], ['Master Fu', 'Marinette a new trick', 'last week', 'На прошлой неделе Мастер Фу научил Маринетт новому трюку.']],
    ['tear', 'tore', 'torn', 'рвать', ['teə', 'tɔː', 'tɔːn'], ['The akuma', 'the poster', 'yesterday', 'Вчера акума порвал плакат.']],
    ['tell', 'told', 'told', 'рассказывать', ['tel', 'təʊld', 'təʊld'], ['Marinette', 'Alya a secret', 'yesterday', 'Вчера Маринетт рассказала Алье секрет.']],
    ['think', 'thought', 'thought', 'думать', ['θɪŋk', 'θɔːt', 'θɔːt'], ['Cat Noir', 'about Ladybug', 'last night', 'Прошлой ночью Супер-Кот думал о Леди Баг.']],
    ['throw', 'threw', 'thrown', 'бросать', ['θrəʊ', 'θruː', 'θrəʊn'], ['Ladybug', 'her yo-yo', 'yesterday', 'Вчера Леди Баг бросила свой йо-йо.']],
    ['understand', 'understood', 'understood', 'понимать', ['ˌʌndəˈstænd', 'ˌʌndəˈstʊd', 'ˌʌndəˈstʊd'], ['Marinette', 'the rule', 'yesterday', 'Вчера Маринетт поняла правило.']],
    ['wake', 'woke', 'woken', 'просыпаться, будить', ['weɪk', 'wəʊk', 'ˈwəʊkən'], ['Marinette', 'up late', 'yesterday', 'Вчера Маринетт проснулась поздно.']],
    ['wear', 'wore', 'worn', 'носить (одежду)', ['weə', 'wɔː', 'wɔːn'], ['Adrien', 'a blue scarf', 'yesterday', 'Вчера Адриан носил синий шарф.']],
    ['win', 'won', 'won', 'побеждать, выигрывать', ['wɪn', 'wʌn', 'wʌn'], ['Kagami', 'the fencing match', 'last week', 'На прошлой неделе Кагами выиграла фехтовальный поединок.']],
    ['write', 'wrote', 'written', 'писать', ['raɪt', 'rəʊt', 'ˈrɪtn'], ['Marinette', 'a letter to Adrien', 'last night', 'Вчера вечером Маринетт написала письмо Адриану.']]
  ];

  // Особые замечания и дополнительные допустимые ответы (из таблицы)
  const NOTES = {
    be: 'was — с I / he / she / it; were — с you / we / they.',
    go: 'В таблице для V3 также указано been: «has been» = «побывал где-то». «has gone» = «ушёл и ещё не вернулся».',
    read: 'Пишется одинаково, но звучит по-разному: read [riːd] → read [red] → read [red].',
    lie: 'lie — lay — lain = «лежать». Не путай с lay (класть)!',
    get: 'В британском английском V3 — got. (В американском бывает gotten.)',
    tear: 'tear [teə] — рвать. (tear [tɪə] — это «слеза», другое слово.)',
    lead: 'lead [liːd] → led [led] → led [led].',
    show: 'showed — Past Simple, shown — Past Participle.',
    run: 'V1 и V3 совпадают: run — ran — run.',
    come: 'V1 и V3 совпадают: come — came — come.',
    become: 'V1 и V3 совпадают: become — became — become.',
    dream: 'Обе формы правильные: dreamed и dreamt.',
    learn: 'Обе формы правильные: learned и learnt.',
    burn: 'Обе формы правильные: burned и burnt.',
    smell: 'Обе формы правильные: smelled и smelt.',
    spill: 'Обе формы правильные: spilled и spilt.'
  };
  const EXTRA_ACCEPT = { go: { v3: ['been'] } };

  // Как говорить форму вслух, если синтезатор может ошибиться
  const SPEAK_AS = {
    read: ['read', 'red', 'red'],
    tear: ['tare', 'tore', 'torn'],
    lead: ['lead', 'led', 'led'],
    wind: null
  };

  // Порядок знакомства с глаголами: от самых частых к редким
  const CURRICULUM = ['go', 'see', 'do', 'eat', 'take', 'write', 'buy', 'have', 'make', 'come',
    'be', 'swim', 'drink', 'run', 'sing', 'fly', 'get', 'give', 'know', 'speak',
    'break', 'begin', 'read', 'find', 'think', 'say', 'tell', 'put', 'cut', 'lose',
    'catch', 'bring', 'teach', 'fall', 'forget', 'draw', 'drive', 'ride', 'choose', 'win',
    'meet', 'sleep', 'feel', 'leave', 'hear', 'sit', 'stand', 'send', 'spend', 'pay',
    'sell', 'build', 'become', 'wear', 'throw', 'grow', 'hide', 'steal', 'wake', 'ring',
    'learn', 'dream', 'understand', 'hold', 'keep', 'fight', 'let', 'hit', 'hurt', 'show',
    'shut', 'cost', 'set', 'lie', 'lead', 'lend', 'light', 'mean', 'feed', 'dig',
    'shine', 'tear', 'forgive', 'burn', 'smell', 'spill'];

  const HARD = ['be', 'go', 'lie', 'read', 'begin', 'drink', 'sing', 'ring', 'swim', 'write',
    'break', 'choose', 'speak', 'steal', 'forget', 'forgive', 'fly', 'throw', 'know', 'grow',
    'draw', 'drive', 'ride', 'hide', 'eat', 'fall', 'give', 'take', 'tear', 'wear', 'wake',
    'see', 'do', 'show', 'run', 'come', 'become'];

  const split = (s) => s.split('/').map((x) => x.trim()).filter(Boolean);

  const VERBS = RAW.map((r, idx) => {
    const [v1, v2, v3, ru, ipa, sent] = r;
    const v = {
      id: v1, idx,
      v1: v1, v2: split(v2), v3: split(v3),
      ru, ipa,
      note: NOTES[v1] || '',
      speak: SPEAK_AS[v1] || null,
      s: { subj: sent[0], rest: sent[1], time: sent[2], ru: sent[3], plural: !!sent[4] },
      accept: { v1: [v1], v2: split(v2), v3: split(v3) }
    };
    if (EXTRA_ACCEPT[v1]) {
      for (const k in EXTRA_ACCEPT[v1]) v.accept[k] = v.accept[k].concat(EXTRA_ACCEPT[v1][k]);
    }
    // Группа
    const a = v.v1, b = v.v2.join('/'), c = v.v3.join('/');
    if (v.v2.length > 1 && v1 !== 'be') v.group = 'variants';
    else if (v1 === 'be' || v1 === 'go') v.group = 'tricky';
    else if (a === b && b === c) v.group = 'same3';
    else if (b === c) v.group = 'v2v3';
    else if (a === c) v.group = 'v1v3';
    else v.group = 'all3';
    v.tricky = ['be', 'go', 'lie', 'read', 'get'].includes(v1);
    v.hard = HARD.includes(v1);
    return v;
  });

  const BY_ID = {};
  VERBS.forEach((v) => (BY_ID[v.id] = v));

  const GROUPS = [
    { id: 'same3', title: 'Три одинаковые формы', ru: 'V1 = V2 = V3', ex: 'cut — cut — cut' },
    { id: 'v2v3', title: 'V2 и V3 совпадают', ru: 'V2 = V3', ex: 'buy — bought — bought' },
    { id: 'all3', title: 'Все три разные', ru: 'V1 ≠ V2 ≠ V3', ex: 'begin — began — begun' },
    { id: 'v1v3', title: 'V1 и V3 совпадают', ru: 'V1 = V3', ex: 'come — came — come' },
    { id: 'tricky', title: 'Сложные исключения', ru: 'особые случаи', ex: 'go — went — gone' },
    { id: 'variants', title: 'Две формы на выбор', ru: 'обе правильные', ex: 'dream — dreamed/dreamt' }
  ];
  function inGroup(v, gid) {
    if (gid === 'tricky') return v.tricky || v.group === 'tricky';
    return v.group === gid;
  }

  // Строка формы для показа
  function formText(v, f) {
    if (f === 1 || f === 'v1') return v.v1;
    const arr = (f === 2 || f === 'v2') ? v.v2 : v.v3;
    return arr.join(' / ');
  }
  function forms(v, f) { return f === 1 ? [v.v1] : f === 2 ? v.v2 : v.v3; }

  // Нормализация ввода: регистр, пробелы, апострофы
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
  }
  // Проверка ответа для формы f (1,2,3). Принимает все допустимые варианты
  function check(v, f, input) {
    const t = norm(input);
    if (!t) return false;
    const ok = v.accept['v' + f];
    if (ok.includes(t)) return true;
    // «dreamed/dreamt», «was / were», «was, were», «were or was»
    const parts = t.split(/\s*(?:\/|,|\bor\b|\s)\s*/).filter(Boolean);
    if (parts.length > 1 && parts.every((p) => ok.includes(p))) return true;
    return false;
  }

  // Все формы, в которых встречается слово (для метро: V1/V2/V3)
  const FORM_INDEX = {};
  VERBS.forEach((v) => {
    [1, 2, 3].forEach((f) => forms(v, f).forEach((w) => {
      (FORM_INDEX[w] = FORM_INDEX[w] || []).push({ id: v.id, f });
    }));
  });
  function categoriesOf(word) { return (FORM_INDEX[word] || []).map((x) => x.f).filter((x, i, a) => a.indexOf(x) === i); }
  function isAnyForm(word) { return !!FORM_INDEX[norm(word)]; }

  // Ложная «правильная» форма (для ловушек) — goed, swimmed, taked
  function regularize(v1) {
    if (v1 === 'be') return 'beed';
    if (/e$/.test(v1)) return v1 + 'd';
    if (/[^aeiou]y$/.test(v1)) return v1.slice(0, -1) + 'ied';
    if (/^[^aeiou]*[aeiou][^aeiouwy]$/.test(v1)) return v1 + v1.slice(-1) + 'ed';
    return v1 + 'ed';
  }

  // ===== Самопроверка базы =====
  function validate() {
    const errors = [];
    const word = /^[a-z][a-z'-]*$/;
    VERBS.forEach((v) => {
      if (!v.v1 || !word.test(v.v1)) errors.push(v.id + ': V1');
      if (!v.v2.length || v.v2.some((x) => !word.test(x))) errors.push(v.id + ': V2');
      if (!v.v3.length || v.v3.some((x) => !word.test(x))) errors.push(v.id + ': V3');
      if (!v.ru) errors.push(v.id + ': перевод');
      if (!v.ipa || v.ipa.length !== 3) errors.push(v.id + ': IPA');
      if (!v.s.subj || !v.s.time || !v.s.ru) errors.push(v.id + ': пример');
    });
    const ids = new Set(VERBS.map((v) => v.id));
    if (ids.size !== VERBS.length) errors.push('дубликаты');
    CURRICULUM.forEach((id) => { if (!BY_ID[id]) errors.push('curriculum: ' + id); });
    VERBS.forEach((v) => { if (!CURRICULUM.includes(v.id)) errors.push('нет в curriculum: ' + v.id); });
    if (VERBS.length !== 86) errors.push('ожидалось 86 глаголов, найдено ' + VERBS.length);
    return { ok: errors.length === 0, count: VERBS.length, errors };
  }

  // ===== Банк предложений с was/were =====
  const WASWERE = [
    ['Ladybug ___ on the roof.', 'was', 'Леди Баг была на крыше.'],
    ['Ladybug and Cat Noir ___ tired after the battle.', 'were', 'Леди Баг и Супер-Кот устали после битвы.'],
    ['The akuma ___ very angry.', 'was', 'Акума был очень зол.'],
    ['We ___ at school yesterday.', 'were', 'Вчера мы были в школе.'],
    ['I ___ scared of the dark.', 'was', 'Я боялся темноты.'],
    ['You ___ amazing yesterday!', 'were', 'Вчера ты был великолепен!'],
    ['Marinette\'s parents ___ in the bakery.', 'were', 'Родители Маринетт были в пекарне.'],
    ['It ___ a magic night in Paris.', 'was', 'Это была волшебная ночь в Париже.'],
    ['Tikki and Plagg ___ hungry.', 'were', 'Тикки и Плагг были голодны.'],
    ['Adrien ___ late for class.', 'was', 'Адриан опоздал на урок.'],
    ['The streets ___ empty last night.', 'were', 'Прошлой ночью улицы были пусты.'],
    ['Hawk Moth ___ in his secret room.', 'was', 'Бражник был в своей тайной комнате.']
  ];

  // ===== Банк для «Perfect Energy»: V2 или V3? =====
  // [предложение, верб id, правильная форма (2|3), перевод]
  const PERFECT = [
    ['Yesterday Marinette ___ to the bakery.', 'go', 2, 'Вчера Маринетт ходила в пекарню.'],
    ['Marinette has ___ to the bakery.', 'go', 3, 'Маринетт ушла в пекарню (её сейчас нет).'],
    ['Look! Cat Noir has ___ the akuma!', 'see', 3, 'Смотри! Супер-Кот увидел акуму!'],
    ['Ladybug ___ the akuma two minutes ago.', 'see', 2, 'Леди Баг увидела акуму две минуты назад.'],
    ['Alya ___ a video two days ago.', 'take', 2, 'Алья сняла видео два дня назад.'],
    ['Alya has ___ a great photo!', 'take', 3, 'Алья сделала отличное фото!'],
    ['The bell has ___! Run!', 'ring', 3, 'Звонок прозвенел! Бежим!'],
    ['The bell ___ at nine yesterday.', 'ring', 2, 'Вчера звонок прозвенел в девять.'],
    ['Oh no! Nino has ___ his headphones again.', 'forget', 3, 'О нет! Нино опять забыл наушники.'],
    ['Plagg ___ all the cheese last night.', 'eat', 2, 'Прошлой ночью Плагг съел весь сыр.'],
    ['Plagg has ___ all the cheese! The box is empty.', 'eat', 3, 'Плагг съел весь сыр! Коробка пуста.'],
    ['Marinette has ___ a letter. Here it is!', 'write', 3, 'Маринетт написала письмо. Вот оно!'],
    ['Marinette ___ a letter last night.', 'write', 2, 'Маринетт написала письмо вчера вечером.'],
    ['Ladybug ___ over Paris last week.', 'fly', 2, 'Леди Баг летала над Парижем на прошлой неделе.'],
    ['The akuma has ___ the clock! It doesn\'t work.', 'break', 3, 'Акума сломал часы! Они не работают.'],
    ['The akuma ___ the clock in 2015.', 'break', 2, 'Акума сломал часы в 2015 году.'],
    ['We have ___ this song many times.', 'sing', 3, 'Мы пели эту песню много раз.'],
    ['We ___ this song at the party yesterday.', 'sing', 2, 'Вчера мы пели эту песню на вечеринке.'],
    ['Cat Noir has ___ his ring! Where is it?', 'lose', 3, 'Супер-Кот потерял кольцо! Где оно?'],
    ['Have you ever ___ in the Seine?', 'swim', 3, 'Ты когда-нибудь плавал в Сене?'],
    ['Adrien ___ in the pool on Monday.', 'swim', 2, 'Адриан плавал в бассейне в понедельник.'],
    ['Tikki has ___ all the juice.', 'drink', 3, 'Тикки выпила весь сок.'],
    ['Tikki ___ some juice an hour ago.', 'drink', 2, 'Тикки выпила сок час назад.']
  ].filter((p) => p[1] !== 'lose'); // у lose V2 = V3, такой выбор был бы спорным

  // ===== Места на карте =====
  const LOCATIONS = [
    { id: 'bridge', name: 'Хрономост', place: 'Мост Искусств', game: 'bridge', x: 15, y: 70, desc: 'Собери мост из форм глагола.', hero: 'ladybug' },
    { id: 'rooftops', name: 'Погоня по крышам', place: 'Крыши Парижа', game: 'rooftop', x: 29, y: 44, desc: 'Беги по верной дорожке!', hero: 'ladybug' },
    { id: 'library', name: 'Библиотека воспоминаний', place: 'Старая библиотека', game: 'memory', x: 45, y: 66, desc: 'Найди три связанные формы.', hero: 'catnoir' },
    { id: 'tower', name: 'Исправь прошлое', place: 'Часовая башня', game: 'timeline', x: 57, y: 33, desc: 'Верни события на место.', hero: 'catnoir' },
    { id: 'lab', name: 'Лаборатория трёх форм', place: 'Секретная лаборатория', game: 'laboratory', x: 70, y: 62, desc: 'Вращай кольца, собери кристалл.', hero: 'marinette' },
    { id: 'metro', name: 'Метро времени', place: 'Станция «Хронос»', game: 'metro', x: 84, y: 42, desc: 'Рассади слова по вагонам.', hero: 'ladybug' },
    { id: 'rift', name: 'Центр хроноразлома', place: 'Эйфелева башня', game: 'finale', x: 50, y: 15, desc: 'Финальная битва за время.', hero: 'ladybug' }
  ];

  const CHARACTERS = {
    ladybug: { name: 'Леди Баг', img: 'assets/characters/ladybug.jpg', color: '#F24971' },
    catnoir: { name: 'Супер-Кот', img: 'assets/characters/catnoir.jpg', color: '#9BE564' },
    marinette: { name: 'Маринетт', img: 'assets/characters/marinette.jpg', color: '#FF9EC4' },
    hawkmoth: { name: 'Бражник', img: 'assets/characters/hawkmoth.jpg', color: '#B48CFF' },
    phantom: { name: 'Хронофантом', img: null, color: '#4ED9E8' },
    duo: { name: 'Леди Баг и Супер-Кот', img: 'assets/characters/duo-shocked.jpg', color: '#FFD66D' }
  };

  Object.assign(CR, {
    VERBS, BY_ID, GROUPS, CURRICULUM, WASWERE, PERFECT, LOCATIONS, CHARACTERS,
    inGroup, formText, forms, norm, check, categoriesOf, isAnyForm, regularize, validate,
    FORM_INDEX
  });
})();
