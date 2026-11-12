export const episodes = [
  {
    id: "opening",
    title: "第一爐麵包",
    icon: "🥖",
    place: "廚房",
    intro:
      "我是小狐狸阿栗！今天要開一家麵包店。先陪我烤第一爐麵包，再把展示盤準備好吧！",
    ending:
      "第一爐麵包香噴噴！謝謝你幫我準備好展示盤。送你狐狸招牌，下一次我們一起迎接第一位客人。",
    reward: "sign",
    tasks: [
      {
        type: "merge",
        item: "🥖",
        name: "麵包",
        initial: 2,
        change: 1,
        title: "剛出爐的麵包",
        prompt: "籃子裡有兩個麵包。把新烤好的一個移進籃子，看看一共有幾個。",
        source: "烤箱",
        destination: "麵包籃",
      },
      {
        type: "fill",
        item: "🥐",
        name: "可頌",
        initial: 2,
        target: 4,
        title: "補滿展示盤",
        prompt: "展示盤可以放四個可頌，已經有兩個。把空位補滿吧！",
        source: "點心架",
        destination: "展示盤",
      },
    ],
  },
  {
    id: "rabbit",
    title: "小兔子的早餐",
    icon: "🐰",
    place: "櫃檯",
    intro:
      "你準備的展示盤吸引了第一位客人！小兔子想買早餐。一起裝進袋子，再準備明天的點心吧。",
    ending:
      "小兔子帶著早餐開心回家了！她送來一盆花，還說要邀請小熊來。把花放在店門口吧。",
    reward: "flowers",
    tasks: [
      {
        type: "take",
        item: "🥐",
        name: "可頌",
        initial: 4,
        change: 1,
        title: "早餐裝袋",
        prompt:
          "盤子裡有四個可頌。小兔子要買一個，移到她的袋子裡，看看盤子還剩幾個。",
        source: "展示盤",
        destination: "小兔子的袋子",
      },
      {
        type: "merge",
        item: "🍞",
        name: "吐司",
        initial: 1,
        change: 2,
        title: "明天的點心",
        prompt: "籃子裡有一片吐司，再放進兩片，一共有幾片呢？",
        source: "烤箱",
        destination: "吐司籃",
      },
    ],
  },
  {
    id: "bear",
    title: "小熊的野餐籃",
    icon: "🐻",
    place: "野餐區",
    intro:
      "小兔子介紹小熊來買點心了！小熊要和朋友野餐。我們幫他補滿餐盒，再把餅乾分給朋友。",
    ending:
      "小熊和朋友的野餐好熱鬧！他們送你一串彩旗。下一次，小鳥想邀請大家參加下午茶。",
    reward: "flags",
    tasks: [
      {
        type: "fill",
        item: "🧁",
        name: "蛋糕",
        initial: 2,
        target: 5,
        title: "野餐盒還有空位",
        prompt: "餐盒可以放五個蛋糕，現在有兩個。幫小熊補滿所有空位吧。",
        source: "蛋糕架",
        destination: "野餐盒",
      },
      {
        type: "take",
        item: "🍪",
        name: "餅乾",
        initial: 5,
        change: 2,
        title: "送給野餐朋友",
        prompt: "盤子裡有五個餅乾。送兩個給朋友，看看盤子裡還剩幾個。",
        source: "餅乾盤",
        destination: "朋友的餐盒",
      },
    ],
  },
  {
    id: "tea",
    title: "花園下午茶",
    icon: "🐦",
    place: "花園",
    intro:
      "小鳥看見你的彩旗，好想在花園辦下午茶！先把水果合在一起，再為每個座位準備點心。",
    ending:
      "每位朋友都有點心了！阿栗送你一張花園桌，歡迎隨時來坐坐。大家正在悄悄準備開店慶典呢。",
    reward: "table",
    tasks: [
      {
        type: "merge",
        item: "🍓",
        name: "草莓",
        initial: 2,
        change: 2,
        title: "兩籃草莓合起來",
        prompt: "盤子裡有兩顆草莓，再把籃子裡的兩顆移進來。一共有幾顆？",
        source: "水果籃",
        destination: "水果盤",
      },
      {
        type: "fill",
        item: "🍪",
        name: "餅乾",
        initial: 1,
        target: 4,
        title: "每個座位一個點心",
        prompt: "四個座位各需要一個餅乾，已經放好一個。把另外三個空位補滿吧。",
        source: "餅乾盒",
        destination: "四個座位",
      },
    ],
  },
  {
    id: "party",
    title: "星光開店慶典",
    icon: "✨",
    place: "星光廣場",
    intro:
      "小兔子、小熊和小鳥都來了！謝謝你一路幫忙。準備最後一盤點心，我們就能一起點亮麵包店！",
    ending:
      "麵包店正式開張啦！你學會把點心合起來、送出去，還會把空位補滿。這盞星星燈送給你。故事完成了，隨時回來自由烘焙、布置自己的店吧！",
    reward: "lamp",
    tasks: [
      {
        type: "merge",
        item: "🧁",
        name: "蛋糕",
        initial: 3,
        change: 2,
        title: "慶典點心集合",
        prompt: "桌上有三個蛋糕，朋友又送來兩個。把它們放在一起，一共有幾個？",
        source: "朋友的禮盒",
        destination: "慶典餐桌",
      },
      {
        type: "take",
        item: "🧁",
        name: "蛋糕",
        initial: 5,
        change: 3,
        title: "把快樂分享出去",
        prompt: "五個蛋糕裡，送三個給朋友。看看餐桌上還剩幾個，留給你和阿栗。",
        source: "慶典餐桌",
        destination: "朋友的盤子",
      },
    ],
  },
];

export const rewards = [
  { id: "sign", emoji: "🦊", name: "狐狸招牌", location: "店門上方" },
  { id: "flowers", emoji: "🌷", name: "門口花盆", location: "門口左邊" },
  { id: "flags", emoji: "🎏", name: "慶典彩旗", location: "屋簷下方" },
  { id: "table", emoji: "🪑", name: "花園小桌", location: "門口右邊" },
  { id: "lamp", emoji: "⭐", name: "星星燈", location: "窗邊" },
];

export const taskGoal = (task) =>
  task.type === "fill" ? task.target - task.initial : task.change;
export const taskAnswer = (task) =>
  task.type === "take"
    ? task.initial - task.change
    : task.type === "fill"
      ? task.target
      : task.initial + task.change;
export function taskExplanation(task) {
  if (task.type === "take")
    return `原本有${task.initial}個，送出${task.change}個，還剩${taskAnswer(task)}個。`;
  if (task.type === "fill")
    return `原本有${task.initial}個，再補${taskGoal(task)}個，剛好${task.target}個！`;
  return `${task.initial}個和${task.change}個合起來，一共有${taskAnswer(task)}個！`;
}
