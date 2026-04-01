import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textMessage: {
      insertTextMessage: (attrs: { sender: string; text: string; side: "left" | "right"; color?: string }) => ReturnType;
    };
  }
}

export const TextMessage = Node.create({
  name: "textMessage",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      sender: { default: "" },
      text: { default: "" },
      side: { default: "left" },
      color: { default: "#4a6249" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-text-message]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const isRight = HTMLAttributes.side === "right";
    const bubbleColor = HTMLAttributes.color || "#4a6249";
    const textColor = isRight ? "#ffffff" : "#333333";
    const bgColor = isRight ? bubbleColor : "#e8e0d4";

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-text-message": "",
        class: "text-message-wrapper",
        style: `display: flex; flex-direction: column; align-items: ${isRight ? "flex-end" : "flex-start"}; margin: 8px 0; max-width: 100%;`,
      }),
      [
        "div",
        {
          class: "text-message-sender",
          style: `font-size: 11px; color: #888; margin-bottom: 2px; padding: 0 12px;`,
        },
        HTMLAttributes.sender,
      ],
      [
        "div",
        {
          class: "text-message-bubble",
          style: `background: ${bgColor}; color: ${textColor}; padding: 8px 14px; border-radius: 18px; max-width: 75%; font-size: 14px; line-height: 1.4; ${
            isRight ? "border-bottom-right-radius: 4px;" : "border-bottom-left-radius: 4px;"
          }`,
        },
        HTMLAttributes.text,
      ],
    ];
  },

  addCommands() {
    return {
      insertTextMessage:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run();
        },
    };
  },
});

export default TextMessage;
