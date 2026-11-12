import { taskGoal } from "./chapter.js";

export function taskObjective(task) {
  if (task.type === "take")
    return `有${task.initial}個${task.name}，送出${task.change}個。`;
  if (task.type === "fill")
    return `已有${task.initial}個${task.name}，把${task.target}格的盤子補滿。`;
  return `有${task.initial}個${task.name}，再放進${task.change}個。`;
}
export function nextGuide(task, moved, selected) {
  if (moved >= taskGoal(task)) {
    return task.type === "fill"
      ? {
          target: "confirm",
          icon: "✅",
          text: "補滿了！點綠色按鈕。",
          key: "confirm",
        }
      : {
          target: "answers",
          icon: "🔢",
          text:
            task.type === "take"
              ? "左邊還剩幾個？選下面的數字卡。"
              : "右邊共有幾個？選下面的數字卡。",
          key: "answers",
        };
  }
  if (selected !== null)
    return {
      target: "destination",
      icon: "🍽️",
      text: `點亮亮的${task.destination}，放進去。`,
      key: `destination-${moved}`,
    };
  return {
    target: "source",
    icon: "👆",
    text: `點一個${task.name}${moved ? "，再移一次" : ""}。`,
    key: `source-${moved}`,
  };
}
