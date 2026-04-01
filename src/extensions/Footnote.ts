import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (text: string) => ReturnType;
    };
  }
}

export const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: { default: "" },
      number: { default: 1 },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-footnote]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-footnote": "",
        class: "footnote-marker",
        title: HTMLAttributes.text,
      }),
      ["sup", {}, `${HTMLAttributes.number}`],
    ];
  },

  addCommands() {
    return {
      insertFootnote:
        (text: string) =>
        ({ chain, state }) => {
          // Count existing footnotes to determine number
          let count = 0;
          state.doc.descendants((node) => {
            if (node.type.name === "footnote") count++;
          });

          return chain()
            .insertContent({
              type: this.name,
              attrs: { text, number: count + 1 },
            })
            .run();
        },
    };
  },
});

export default Footnote;
