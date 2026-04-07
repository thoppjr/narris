import { Mark, mergeAttributes } from "@tiptap/core";

export interface CommentHighlightOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentHighlight: {
      setCommentHighlight: (attrs: { commentId: string; color?: string }) => ReturnType;
      unsetCommentHighlight: () => ReturnType;
      removeCommentHighlightById: (commentId: string) => ReturnType;
    };
  }
}

export const CommentHighlight = Mark.create<CommentHighlightOptions>({
  name: "commentHighlight",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-id"),
        renderHTML: (attrs) => ({ "data-comment-id": attrs.commentId }),
      },
      color: {
        default: "#f59e0b40",
        parseHTML: (el) => el.getAttribute("data-comment-color"),
        renderHTML: (attrs) => ({
          "data-comment-color": attrs.color,
          style: `background-color: ${attrs.color}`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "mark[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCommentHighlight:
        (attrs) =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      unsetCommentHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      removeCommentHighlightById:
        (commentId: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          const markType = state.schema.marks[this.name];
          if (!markType) return false;

          doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type === markType && mark.attrs.commentId === commentId) {
                tr.removeMark(pos, pos + node.nodeSize, mark);
              }
            });
          });

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

export default CommentHighlight;
