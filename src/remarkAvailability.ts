import type { Root, RootContent } from "mdast";
import { parse } from "yaml";

/* Zudoku's `content-before` slot renders above the page title, so a slot
   cannot put the block under the H1. This plugin reads `availability` from
   the frontmatter and inserts the component as the first body node instead.
   Zudoku runs it after `remark-frontmatter`, so the YAML node is already in
   the tree. */
export const remarkAvailability = () => (tree: Root) => {
  const yamlNode = tree.children.find((node) => node.type === "yaml");
  if (!yamlNode || yamlNode.type !== "yaml") return;

  const data = parse(yamlNode.value) ?? {};
  if (!data.availability) return;

  const element = {
    type: "mdxJsxFlowElement",
    name: "Availability",
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "spec",
        value: JSON.stringify(data.availability),
      },
    ],
    children: [],
  } as unknown as RootContent;

  /* Import and export statements must stay in front of the element, so the
     element goes after the last YAML or ESM node at the top of the tree. */
  let index = 0;
  while (
    index < tree.children.length &&
    ["yaml", "mdxjsEsm"].includes(tree.children[index]!.type)
  ) {
    index++;
  }
  tree.children.splice(index, 0, element);
};
