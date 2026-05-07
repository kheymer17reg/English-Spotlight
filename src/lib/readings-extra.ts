import type { ReadingText } from "@/types";

/**
 * Hand-curated extra reading bank — 5 texts per grade (2 → 8) = 35 texts.
 * These supplement the auto-generated `readings.ts`. Stable ids prefixed
 * `rx-`. All texts cap at ~110 words for the page-3 graders, ~160 words
 * for the rest. Each has a 4-6 entry glossary and 3 comprehension Qs.
 */
export const READINGS_EXTRA: ReadingText[] = [
  // ============== Grade 2 ==============
  {
    id: "rx-g2-1",
    grade: 2,
    module: 1,
    title: "My Cosy Room",
    level: "A1",
    text:
      "This is my room. I have a small bed near the window. My teddy bear is on the bed. My books are on the shelf. There is a yellow lamp on the table. I love my room. It is small but very cosy.",
    glossary: [
      { word: "cosy", translation: "уютный" },
      { word: "shelf", translation: "полка" },
      { word: "lamp", translation: "лампа" },
      { word: "near", translation: "рядом с" },
    ],
    questions: [
      { q: "Where is the teddy bear?", a: "On the bed." },
      { q: "What colour is the lamp?", a: "Yellow." },
      { q: "Is the room big or small?", a: "Small." },
    ],
  },
  {
    id: "rx-g2-2",
    grade: 2,
    module: 2,
    title: "My Birthday Cake",
    level: "A1",
    text:
      "Today is my birthday. I am eight years old. My mum has a big cake for me. There are eight candles on the cake. My friends come to my party. We sing a song and we dance. I am very happy!",
    glossary: [
      { word: "birthday", translation: "день рождения" },
      { word: "candles", translation: "свечи" },
      { word: "party", translation: "вечеринка" },
      { word: "happy", translation: "счастливый" },
    ],
    questions: [
      { q: "How old is the boy?", a: "Eight." },
      { q: "How many candles are on the cake?", a: "Eight." },
      { q: "How does he feel?", a: "Happy." },
    ],
  },
  {
    id: "rx-g2-3",
    grade: 2,
    module: 3,
    title: "A Frog and a Fish",
    level: "A1",
    text:
      "A small frog lives near a pond. A little fish lives in the pond. The frog can jump and swim. The fish can swim but it can't jump. They are good friends. Every day they play together near the water.",
    glossary: [
      { word: "frog", translation: "лягушка" },
      { word: "pond", translation: "пруд" },
      { word: "jump", translation: "прыгать" },
      { word: "swim", translation: "плавать" },
    ],
    questions: [
      { q: "Where does the frog live?", a: "Near a pond." },
      { q: "Can the fish jump?", a: "No, it can't." },
      { q: "Are they friends?", a: "Yes, they are." },
    ],
  },
  {
    id: "rx-g2-4",
    grade: 2,
    module: 4,
    title: "Tom's Toys",
    level: "A1",
    text:
      "Tom has many toys. His ball is under the chair. His teddy bear is on the bed. His toy car is in the box. His kite is behind the door. Tom likes to play with his toys every day.",
    glossary: [
      { word: "toys", translation: "игрушки" },
      { word: "under", translation: "под" },
      { word: "behind", translation: "за" },
      { word: "kite", translation: "воздушный змей" },
    ],
    questions: [
      { q: "Where is the ball?", a: "Under the chair." },
      { q: "Where is the kite?", a: "Behind the door." },
      { q: "What is in the box?", a: "His toy car." },
    ],
  },
  {
    id: "rx-g2-5",
    grade: 2,
    module: 1,
    title: "My Family in the Garden",
    level: "A1",
    text:
      "It is Sunday. My family is in the garden. My dad is reading a book. My mum is making sandwiches. My little brother is running with the dog. I am playing with my doll. We are very happy together.",
    glossary: [
      { word: "garden", translation: "сад" },
      { word: "Sunday", translation: "воскресенье" },
      { word: "sandwiches", translation: "бутерброды" },
      { word: "together", translation: "вместе" },
    ],
    questions: [
      { q: "What is dad doing?", a: "Reading a book." },
      { q: "What is the brother doing?", a: "Running with the dog." },
      { q: "What day is it?", a: "Sunday." },
    ],
  },

  // ============== Grade 3 ==============
  {
    id: "rx-g3-1",
    grade: 3,
    module: 1,
    title: "A Day at School",
    level: "A1",
    text:
      "I go to school at eight o'clock. My first lesson is Maths. After Maths we have English. Then we have a break. We play in the yard. After the break we have Science. Our teacher is very kind. I always do my homework. I really like school!",
    glossary: [
      { word: "lesson", translation: "урок" },
      { word: "break", translation: "перемена" },
      { word: "yard", translation: "школьный двор" },
      { word: "homework", translation: "домашнее задание" },
    ],
    questions: [
      { q: "What is the first lesson?", a: "Maths." },
      { q: "Where do they play during break?", a: "In the yard." },
      { q: "How is the teacher?", a: "Very kind." },
    ],
  },
  {
    id: "rx-g3-2",
    grade: 3,
    module: 2,
    title: "Sunday with Grandma",
    level: "A1",
    text:
      "Every Sunday I go to my grandma's house. She lives in a small village. My cousin is there too. We help grandma in the garden. Then she gives us hot tea and a big apple pie. In the evening grandpa tells us funny stories. I love my family.",
    glossary: [
      { word: "grandma", translation: "бабушка" },
      { word: "village", translation: "деревня" },
      { word: "cousin", translation: "двоюродный брат/сестра" },
      { word: "stories", translation: "рассказы" },
    ],
    questions: [
      { q: "Where does grandma live?", a: "In a small village." },
      { q: "What does she give them?", a: "Hot tea and apple pie." },
      { q: "Who tells stories?", a: "Grandpa." },
    ],
  },
  {
    id: "rx-g3-3",
    grade: 3,
    module: 3,
    title: "My Favourite Food",
    level: "A1",
    text:
      "I like food. For breakfast I eat cereal with milk and a banana. For lunch at school I have a sandwich and an apple. After school I drink juice. For dinner my mum cooks pasta or rice with vegetables. On Sundays we eat pizza together. Yummy!",
    glossary: [
      { word: "breakfast", translation: "завтрак" },
      { word: "lunch", translation: "обед" },
      { word: "dinner", translation: "ужин" },
      { word: "vegetables", translation: "овощи" },
    ],
    questions: [
      { q: "What does the boy eat for breakfast?", a: "Cereal with milk and a banana." },
      { q: "What does he drink after school?", a: "Juice." },
      { q: "What do they eat on Sundays?", a: "Pizza." },
    ],
  },
  {
    id: "rx-g3-4",
    grade: 3,
    module: 4,
    title: "A Rainy Day",
    level: "A1",
    text:
      "It is raining today. I am at home with my brother. We don't go outside. In my room there are many toys. We play with the train and the lego. Then we play chess. My brother always wins! I don't like losing but the day is fun.",
    glossary: [
      { word: "raining", translation: "идёт дождь" },
      { word: "outside", translation: "на улицу" },
      { word: "lego", translation: "лего" },
      { word: "wins", translation: "выигрывает" },
    ],
    questions: [
      { q: "What is the weather like?", a: "It is raining." },
      { q: "What do they play first?", a: "Train and lego." },
      { q: "Who wins at chess?", a: "His brother." },
    ],
  },
  {
    id: "rx-g3-5",
    grade: 3,
    module: 2,
    title: "My Best Friend",
    level: "A1",
    text:
      "My best friend is Anna. She is nine years old. She has long brown hair and big green eyes. She is very kind and funny. We go to school together. After school we ride our bikes in the park. Anna can sing very well. I love my best friend.",
    glossary: [
      { word: "best friend", translation: "лучший друг" },
      { word: "kind", translation: "добрая" },
      { word: "funny", translation: "смешная" },
      { word: "park", translation: "парк" },
    ],
    questions: [
      { q: "How old is Anna?", a: "Nine." },
      { q: "What colour are her eyes?", a: "Green." },
      { q: "Where do they ride bikes?", a: "In the park." },
    ],
  },

  // ============== Grade 4 ==============
  {
    id: "rx-g4-1",
    grade: 4,
    module: 1,
    title: "My New Classmate",
    level: "A2",
    text:
      "We have a new classmate this year. His name is Mark. He is tall and has short black hair. At first he was very shy and didn't talk to anyone. But now we are friends. He is funny and clever, and he tells great jokes. Mark loves football, just like me. After school we play together every day.",
    glossary: [
      { word: "classmate", translation: "одноклассник" },
      { word: "shy", translation: "застенчивый" },
      { word: "clever", translation: "умный" },
      { word: "joke", translation: "шутка" },
    ],
    questions: [
      { q: "What does Mark look like?", a: "Tall, with short black hair." },
      { q: "How was he at first?", a: "Very shy." },
      { q: "What sport do they play together?", a: "Football." },
    ],
  },
  {
    id: "rx-g4-2",
    grade: 4,
    module: 2,
    title: "A Day in Dad's Life",
    level: "A2",
    text:
      "My dad is a doctor. He works in a big hospital. He gets up at six o'clock. He drives to work in his car. He helps many sick people every day. He listens to them and gives them medicine. Sometimes he comes home very late. My dad is tired but he likes his job. I am proud of him.",
    glossary: [
      { word: "doctor", translation: "врач" },
      { word: "hospital", translation: "больница" },
      { word: "medicine", translation: "лекарство" },
      { word: "proud", translation: "горжусь" },
    ],
    questions: [
      { q: "What does dad do?", a: "He is a doctor." },
      { q: "When does he get up?", a: "At six o'clock." },
      { q: "How does he go to work?", a: "By car." },
    ],
  },
  {
    id: "rx-g4-3",
    grade: 4,
    module: 3,
    title: "Mum's Apple Pie",
    level: "A2",
    text:
      "Saturday is baking day at our house. My mum makes the best apple pie in the world. She needs flour, sugar, butter, eggs and red apples. First she mixes everything in a big bowl. Then she puts the pie in the hot oven for forty minutes. The whole house smells of apples and cinnamon. My friends come over for a slice. We are very lucky!",
    glossary: [
      { word: "baking", translation: "выпечка" },
      { word: "flour", translation: "мука" },
      { word: "oven", translation: "духовка" },
      { word: "slice", translation: "кусок" },
    ],
    questions: [
      { q: "What day is baking day?", a: "Saturday." },
      { q: "What does the pie need?", a: "Flour, sugar, butter, eggs and apples." },
      { q: "How long is the pie in the oven?", a: "Forty minutes." },
    ],
  },
  {
    id: "rx-g4-4",
    grade: 4,
    module: 4,
    title: "A Trip to the Zoo",
    level: "A2",
    text:
      "Last Sunday our class went to the zoo. We saw many animals. The lion was sleeping in the sun. The monkeys were jumping from tree to tree. The giraffe was tall, taller than our teacher! The peacock had a beautiful tail. My favourite animals were the seals. They were swimming and playing together. We had a wonderful day.",
    glossary: [
      { word: "zoo", translation: "зоопарк" },
      { word: "monkeys", translation: "обезьяны" },
      { word: "giraffe", translation: "жираф" },
      { word: "seals", translation: "тюлени" },
    ],
    questions: [
      { q: "When did they go to the zoo?", a: "Last Sunday." },
      { q: "What was the lion doing?", a: "Sleeping in the sun." },
      { q: "Which animals were the favourite?", a: "The seals." },
    ],
  },
  {
    id: "rx-g4-5",
    grade: 4,
    module: 1,
    title: "My Best Friend Lily",
    level: "A2",
    text:
      "Lily and I have been best friends since we were five. She is kind, friendly and a little shy with new people. We have a lot in common. We both love drawing, reading fairy tales and eating ice cream. When I am sad, Lily makes me laugh. When she is angry, I help her calm down. A best friend is a real treasure.",
    glossary: [
      { word: "since", translation: "с тех пор как" },
      { word: "in common", translation: "общего" },
      { word: "calm down", translation: "успокоиться" },
      { word: "treasure", translation: "сокровище" },
    ],
    questions: [
      { q: "How long have they been friends?", a: "Since they were five." },
      { q: "What do they both like?", a: "Drawing, fairy tales and ice cream." },
      { q: "What does Lily do when the narrator is sad?", a: "She makes the narrator laugh." },
    ],
  },

  // ============== Grade 5 ==============
  {
    id: "rx-g5-1",
    grade: 5,
    module: 1,
    title: "Welcome to Brookfield School",
    level: "A2",
    text:
      "Brookfield is a typical British secondary school. Lessons start at 8:45 and finish at 3:30. Students wear a blue uniform with a school tie. There are forty-five minutes for each lesson and a long break for lunch in the canteen. The favourite subjects are PE, IT and Drama. Every Friday afternoon there are clubs: chess, robotics, debate and football. The library is open until five.",
    glossary: [
      { word: "secondary school", translation: "средняя школа" },
      { word: "uniform", translation: "форма" },
      { word: "canteen", translation: "столовая" },
      { word: "club", translation: "кружок" },
    ],
    questions: [
      { q: "When do lessons start?", a: "At 8:45." },
      { q: "What do students wear?", a: "A blue uniform with a tie." },
      { q: "When is the chess club?", a: "Every Friday afternoon." },
    ],
  },
  {
    id: "rx-g5-2",
    grade: 5,
    module: 2,
    title: "A Postcard from Madrid",
    level: "A2",
    text:
      "Hi Anna! I'm in Madrid, the capital of Spain. The city is amazing. The buildings are very old and beautiful. People here speak Spanish very fast. The food is delicious — I love paella and churros. Today we visited the Royal Palace. Tomorrow we are going to a famous football match. I miss you. See you next week. Love, Mike.",
    glossary: [
      { word: "capital", translation: "столица" },
      { word: "delicious", translation: "вкусный" },
      { word: "palace", translation: "дворец" },
      { word: "miss", translation: "скучать" },
    ],
    questions: [
      { q: "Where is Mike?", a: "In Madrid." },
      { q: "What language do people speak there?", a: "Spanish." },
      { q: "What is he going to tomorrow?", a: "A football match." },
    ],
  },
  {
    id: "rx-g5-3",
    grade: 5,
    module: 3,
    title: "Our Country Cottage",
    level: "A2",
    text:
      "My grandparents have a small cottage in the countryside. It has only four rooms but I love it. The kitchen has an old wooden table and a big fridge. The living room has a sofa, two armchairs and a fireplace. There is no TV — only a bookcase full of interesting books. The garden behind the house has apple trees and vegetables. It is the most peaceful place in the world.",
    glossary: [
      { word: "cottage", translation: "коттедж" },
      { word: "fireplace", translation: "камин" },
      { word: "bookcase", translation: "книжный шкаф" },
      { word: "peaceful", translation: "мирный, спокойный" },
    ],
    questions: [
      { q: "How many rooms does the cottage have?", a: "Four." },
      { q: "Is there a TV?", a: "No, there isn't." },
      { q: "What grows in the garden?", a: "Apple trees and vegetables." },
    ],
  },
  {
    id: "rx-g5-4",
    grade: 5,
    module: 4,
    title: "My Big Family",
    level: "A2",
    text:
      "I come from a big family. I have two sisters and one brother. My older sister Olga is a brave doctor. My twin brother Petya is very clever and a bit lazy. My younger sister Masha is only four — she is noisy but everybody loves her. My parents are patient and kind. We also have a dog called Lucky. My family tree is full of interesting people.",
    glossary: [
      { word: "twin", translation: "близнец" },
      { word: "younger", translation: "младший" },
      { word: "patient", translation: "терпеливый" },
      { word: "family tree", translation: "генеалогическое древо" },
    ],
    questions: [
      { q: "How many sisters does the narrator have?", a: "Two." },
      { q: "How is the twin brother described?", a: "Clever and a bit lazy." },
      { q: "What is the dog's name?", a: "Lucky." },
    ],
  },
  {
    id: "rx-g5-5",
    grade: 5,
    module: 1,
    title: "Exam Week",
    level: "A2",
    text:
      "Next week our class has the end-of-term exams. I'm a bit nervous about Maths because the formulas are difficult. My best friend Tom is good at Maths and he is helping me. We meet in the library after school and study together for an hour. For English, our teacher gave us a list of new words to learn. I want to get a good mark, so I work hard every day.",
    glossary: [
      { word: "nervous", translation: "нервный" },
      { word: "formula", translation: "формула" },
      { word: "library", translation: "библиотека" },
      { word: "mark", translation: "оценка" },
    ],
    questions: [
      { q: "When are the exams?", a: "Next week." },
      { q: "Who helps the narrator with Maths?", a: "Tom." },
      { q: "Where do they study?", a: "In the library." },
    ],
  },

  // ============== Grade 6 ==============
  {
    id: "rx-g6-1",
    grade: 6,
    module: 1,
    title: "An Online ID",
    level: "A2",
    text:
      "When you sign up for any website today, you create an online ID. You usually need a nickname, a strong password, an email address and sometimes a phone number. Never share your full name, address or postcode with strangers online. A clever nickname is fun and protects your privacy. Remember: only your friends and family really need to know who you are.",
    glossary: [
      { word: "sign up", translation: "регистрироваться" },
      { word: "nickname", translation: "ник, прозвище" },
      { word: "password", translation: "пароль" },
      { word: "privacy", translation: "конфиденциальность" },
    ],
    questions: [
      { q: "What do you usually need to sign up?", a: "Nickname, password, email and sometimes phone number." },
      { q: "What should you never share?", a: "Full name, address or postcode." },
      { q: "Why use a nickname?", a: "To protect your privacy." },
    ],
  },
  {
    id: "rx-g6-2",
    grade: 6,
    module: 2,
    title: "Maslenitsa Week",
    level: "A2",
    text:
      "Maslenitsa is one of the oldest Russian celebrations. It happens at the end of winter, usually in February or early March. For a whole week people eat hot pancakes with butter, honey, jam or salty fish. Children play in the snow, ride sledges and burn a big straw doll on the last day. Every weekday has its own name and traditions. Maslenitsa is a happy farewell to winter and a warm welcome to spring.",
    glossary: [
      { word: "celebration", translation: "праздник" },
      { word: "pancakes", translation: "блины" },
      { word: "sledge", translation: "санки" },
      { word: "farewell", translation: "прощание" },
    ],
    questions: [
      { q: "When does Maslenitsa take place?", a: "At the end of winter (February or March)." },
      { q: "What do people eat?", a: "Hot pancakes with butter, honey, jam or fish." },
      { q: "What is burnt on the last day?", a: "A big straw doll." },
    ],
  },
  {
    id: "rx-g6-3",
    grade: 6,
    module: 3,
    title: "Travelling Around London",
    level: "A2",
    text:
      "London has one of the best public transport networks in the world. The famous red double-decker buses go everywhere. The underground, called the Tube, has eleven lines and 272 stations. You can also take a black taxi or rent a bicycle from the city scheme. For the river there are ferries that go from Greenwich to Westminster. The cheapest way to travel is to buy an Oyster card.",
    glossary: [
      { word: "double-decker", translation: "двухэтажный" },
      { word: "underground", translation: "метро" },
      { word: "ferry", translation: "паром" },
      { word: "scheme", translation: "программа" },
    ],
    questions: [
      { q: "What is London's underground called?", a: "The Tube." },
      { q: "How many lines does it have?", a: "Eleven." },
      { q: "What is the cheapest way to travel?", a: "Buy an Oyster card." },
    ],
  },
  {
    id: "rx-g6-4",
    grade: 6,
    module: 4,
    title: "Sam's Routine",
    level: "A2",
    text:
      "Sam is fourteen and he is very organised. His alarm clock rings at 6:45. He gets up, takes a quick shower and brushes his teeth. He has cereal and orange juice for breakfast. School starts at 8:30. After school Sam plays the guitar for an hour. He does his homework before dinner. In his spare time he reads science fiction. He goes to bed at 10 o'clock — never later.",
    glossary: [
      { word: "organised", translation: "организованный" },
      { word: "alarm clock", translation: "будильник" },
      { word: "spare time", translation: "свободное время" },
      { word: "science fiction", translation: "научная фантастика" },
    ],
    questions: [
      { q: "When does Sam get up?", a: "At 6:45." },
      { q: "What does he do after school?", a: "Plays the guitar for an hour." },
      { q: "When does he go to bed?", a: "At 10 o'clock." },
    ],
  },
  {
    id: "rx-g6-5",
    grade: 6,
    module: 2,
    title: "British Christmas",
    level: "A2",
    text:
      "Christmas is the most important holiday in Britain. People decorate their houses with lights, holly and a green Christmas tree. On the 24th of December children hang stockings near the chimney. The next morning Santa Claus has filled them with small gifts. Families have a big lunch with roast turkey, potatoes and Christmas pudding. The Queen's speech on TV is a tradition for many people.",
    glossary: [
      { word: "decorate", translation: "украшать" },
      { word: "stocking", translation: "чулок" },
      { word: "chimney", translation: "дымоход" },
      { word: "tradition", translation: "традиция" },
    ],
    questions: [
      { q: "What do people decorate?", a: "Their houses." },
      { q: "Where do children hang stockings?", a: "Near the chimney." },
      { q: "What is for Christmas lunch?", a: "Roast turkey, potatoes and pudding." },
    ],
  },

  // ============== Grade 7 ==============
  {
    id: "rx-g7-1",
    grade: 7,
    module: 1,
    title: "Country Mouse, City Mouse",
    level: "B1",
    text:
      "Anna lives in a tiny village in the Russian countryside. She wakes up to roosters, breathes clean air and knows everyone in her neighbourhood. Her cousin Ivan lives in central Moscow on the 18th floor of a skyscraper. He sees the underground every morning and never has time to talk to his neighbours. Both lifestyles have their charm: peace and quiet versus opportunity and energy. Which would you choose?",
    glossary: [
      { word: "rooster", translation: "петух" },
      { word: "neighbourhood", translation: "район" },
      { word: "skyscraper", translation: "небоскрёб" },
      { word: "opportunity", translation: "возможность" },
    ],
    questions: [
      { q: "Where does Anna live?", a: "In a tiny village in the countryside." },
      { q: "What floor does Ivan live on?", a: "The 18th." },
      { q: "What does Ivan never have time for?", a: "To talk to his neighbours." },
    ],
  },
  {
    id: "rx-g7-2",
    grade: 7,
    module: 2,
    title: "The Brave Little Tailor",
    level: "B1",
    text:
      "Once upon a time there was a poor tailor. One morning seven flies sat on his bread, so he hit them all in one blow. He was so proud that he sewed himself a belt that said «Seven at one blow». People believed he was a great hero. The king sent him to fight a giant. With his clever mind, not his sword, the little tailor won every challenge. In the end he became the king of the country.",
    glossary: [
      { word: "tailor", translation: "портной" },
      { word: "blow", translation: "удар" },
      { word: "hero", translation: "герой" },
      { word: "challenge", translation: "испытание" },
    ],
    questions: [
      { q: "How many flies did he kill?", a: "Seven." },
      { q: "What did the king send him to do?", a: "Fight a giant." },
      { q: "What helped the tailor win?", a: "His clever mind." },
    ],
  },
  {
    id: "rx-g7-3",
    grade: 7,
    module: 3,
    title: "A Profile of J.K. Rowling",
    level: "B1",
    text:
      "Joanne Rowling, known as J.K. Rowling, was born in England in 1965. She loved reading and writing stories from a very young age. The idea of Harry Potter came to her on a delayed train in 1990. For seven years she was an unemployed single mother, writing the first book in cafés. Twelve publishers rejected the manuscript before one accepted it. Today she is one of the most generous and creative authors in the world.",
    glossary: [
      { word: "delayed", translation: "задержанный" },
      { word: "unemployed", translation: "безработный" },
      { word: "manuscript", translation: "рукопись" },
      { word: "rejected", translation: "отклонили" },
    ],
    questions: [
      { q: "When was Rowling born?", a: "In 1965." },
      { q: "Where did the idea of Harry Potter come?", a: "On a delayed train." },
      { q: "How many publishers rejected the book?", a: "Twelve." },
    ],
  },
  {
    id: "rx-g7-4",
    grade: 7,
    module: 4,
    title: "Behind the News",
    level: "B1",
    text:
      "Every news story has at least three sources behind it. A journalist starts with a tip, then verifies the facts, contacts witnesses and looks at official documents. Only after that the news reaches the headline. A good newspaper is honest about what it knows and what it doesn't. Modern readers should also do their part — check the source, compare different channels and avoid spreading gossip and scandal as if it were truth.",
    glossary: [
      { word: "source", translation: "источник" },
      { word: "verify", translation: "проверять" },
      { word: "witness", translation: "свидетель" },
      { word: "spread", translation: "распространять" },
    ],
    questions: [
      { q: "How many sources should a story have?", a: "At least three." },
      { q: "What should readers check?", a: "The source and different channels." },
      { q: "What should readers avoid?", a: "Spreading gossip and scandal." },
    ],
  },
  {
    id: "rx-g7-5",
    grade: 7,
    module: 1,
    title: "Smog Day in Beijing",
    level: "B1",
    text:
      "Last Tuesday Beijing had its worst smog day of the year. The air was so polluted that schools closed and traffic almost stopped. Many people wore masks and stayed at home. The crowded streets, the busy factories and millions of cars all contributed. Local authorities promised more electric buses and tighter rules for industry. Air pollution is no longer just a city problem — it affects everyone, everywhere.",
    glossary: [
      { word: "smog", translation: "смог" },
      { word: "polluted", translation: "загрязнённый" },
      { word: "factory", translation: "фабрика" },
      { word: "authorities", translation: "власти" },
    ],
    questions: [
      { q: "Where did the smog day happen?", a: "In Beijing." },
      { q: "What closed because of the air?", a: "Schools." },
      { q: "What did local authorities promise?", a: "More electric buses and tighter rules." },
    ],
  },

  // ============== Grade 8 ==============
  {
    id: "rx-g8-1",
    grade: 8,
    module: 1,
    title: "Body Language Across Cultures",
    level: "B1",
    text:
      "When you travel, your body says as much as your words. A friendly thumbs-up in Britain is rude in parts of the Middle East. A direct stare can mean honesty in the Netherlands and disrespect in Japan. Even a smile is interpreted differently — Americans smile at strangers while Russians often consider that fake. Polite manners therefore include not only the right phrases but also the right gestures. Effective communication starts with cultural awareness.",
    glossary: [
      { word: "thumbs-up", translation: "большой палец вверх" },
      { word: "stare", translation: "пристальный взгляд" },
      { word: "disrespect", translation: "неуважение" },
      { word: "awareness", translation: "осведомлённость" },
    ],
    questions: [
      { q: "What does a thumbs-up mean in parts of the Middle East?", a: "It is considered rude." },
      { q: "How is a smile seen in Russia?", a: "Smiling at strangers is often considered fake." },
      { q: "What does effective communication start with?", a: "Cultural awareness." },
    ],
  },
  {
    id: "rx-g8-2",
    grade: 8,
    module: 2,
    title: "Black Friday and Real Bargains",
    level: "B1",
    text:
      "Black Friday is the biggest shopping day of the year in the USA and now in many other countries. Shops slash prices, customers form long queues and trolleys overflow with electronics and clothes. But not every label says the truth. Many «discounts» are based on inflated original prices. A real bargain hunter compares prices for weeks before the sale, checks reviews and keeps every receipt for a possible refund. Smart shopping is a skill, not a sport.",
    glossary: [
      { word: "slash prices", translation: "резко снижать цены" },
      { word: "queue", translation: "очередь" },
      { word: "inflated", translation: "завышенный" },
      { word: "receipt", translation: "чек" },
    ],
    questions: [
      { q: "What do shops do on Black Friday?", a: "They slash prices." },
      { q: "Why are some discounts not real?", a: "Because original prices were inflated." },
      { q: "What should a smart shopper keep?", a: "Every receipt." },
    ],
  },
  {
    id: "rx-g8-3",
    grade: 8,
    module: 3,
    title: "Marie Curie — A Mind on Fire",
    level: "B1",
    text:
      "Marie Curie was a Polish-French physicist and chemist who lived from 1867 to 1934. She was the first woman to win a Nobel Prize and the only person ever to win it in two different sciences. Together with her husband Pierre she discovered the elements polonium and radium. She worked in a tiny, cold laboratory and often had no money for proper equipment. Her research opened the door to modern medicine and X-ray technology.",
    glossary: [
      { word: "physicist", translation: "физик" },
      { word: "chemist", translation: "химик" },
      { word: "discover", translation: "открывать" },
      { word: "equipment", translation: "оборудование" },
    ],
    questions: [
      { q: "What did Marie Curie discover?", a: "The elements polonium and radium." },
      { q: "How many Nobel Prizes did she win?", a: "Two, in different sciences." },
      { q: "What did her research open the door to?", a: "Modern medicine and X-ray technology." },
    ],
  },
  {
    id: "rx-g8-4",
    grade: 8,
    module: 4,
    title: "Be Yourself, Not a Brand",
    level: "B1",
    text:
      "Today's teenagers face huge pressure to dress in the trendiest brand of jeans, the most expensive sneakers and the most fashionable jacket. Social media tells them that without these clothes they are nothing. But real style is not about price tags. A simple shirt with a smile, a scarf you knitted yourself, an outfit that feels comfortable — these tell people who you really are. Fashion changes every season, but personality lasts forever.",
    glossary: [
      { word: "pressure", translation: "давление" },
      { word: "brand", translation: "бренд" },
      { word: "knit", translation: "вязать" },
      { word: "personality", translation: "личность" },
    ],
    questions: [
      { q: "What pressure do teenagers face?", a: "To dress in trendy brands." },
      { q: "What is real style not about?", a: "Price tags." },
      { q: "What lasts forever?", a: "Personality." },
    ],
  },
  {
    id: "rx-g8-5",
    grade: 8,
    module: 1,
    title: "Small Talk in English",
    level: "B1",
    text:
      "Many learners of English are afraid of small talk. They believe a real conversation must be deep and clever. In fact, small talk is a polite social skill — a short, light exchange that opens the door to bigger things. Safe topics include the weather, weekend plans, sports, films and food. Avoid politics and personal money matters at first meetings. A friendly smile, a couple of open questions, and you are already halfway to a new friend.",
    glossary: [
      { word: "small talk", translation: "светская беседа" },
      { word: "exchange", translation: "обмен" },
      { word: "topic", translation: "тема" },
      { word: "halfway", translation: "на полпути" },
    ],
    questions: [
      { q: "What do many learners think a real conversation must be?", a: "Deep and clever." },
      { q: "What are safe small-talk topics?", a: "Weather, weekend plans, sports, films, food." },
      { q: "What should you avoid at first meetings?", a: "Politics and personal money matters." },
    ],
  },
];
