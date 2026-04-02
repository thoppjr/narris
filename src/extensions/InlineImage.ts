import { Node, mergeAttributes } from "@tiptap/react";

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    inlineImage: {
      insertInlineImage: (attrs: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

export const InlineImage = Node.create({
  name: "inlineImage",
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[data-inline-image]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "inline-image-wrapper", style: "text-align: center; margin: 1em 0;" },
      [
        "img",
        mergeAttributes(HTMLAttributes, {
          "data-inline-image": "",
          style: "max-width: 100%; height: auto; border-radius: 8px;",
        }),
      ],
    ];
  },

  addCommands() {
    return {
      insertInlineImage:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
