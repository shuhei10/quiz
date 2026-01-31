import type { Question } from "../types/quiz";


export const QUESTIONS: Question[] = [
  {
    id: "yakushima-001",
    grade: 4,
    chapter: "屋久島",
    title: "屋久島で見られる代表的な植生の特徴は？",
    choices: [
      { id: "A", text: "亜熱帯のマングローブ" },
      { id: "B", text: "照葉樹林から亜寒帯性までの垂直分布" },
      { id: "C", text: "砂漠植物のオアシス" },
      { id: "D", text: "サバンナの草原" },
    ],
    answerId: "B",
    explanation: "標高差による植生の垂直分布が特徴です。",
    explanationEn: "Yakushima is known for vertical vegetation zones caused by elevation differences.",
  },
  {
    id: "amami-001",
    grade: 4,
    chapter: "奄美大島",
    title: "奄美大島などで注目される生物多様性の特徴は？",
    choices: [
      { id: "A", text: "固有種が少ない" },
      { id: "B", text: "寒冷地の氷河生物が中心" },
      { id: "C", text: "固有種が多い亜熱帯の森" },
      { id: "D", text: "海底火山のみ" },
    ],
    answerId: "C",
    explanation: "固有種が多い亜熱帯の森が特徴です。",
    explanationEn: "Amami is noted for subtropical forests with many endemic species.",
  },
];
