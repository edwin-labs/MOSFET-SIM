import { visit } from 'unist-util-visit';
import katex from 'katex';
import type { Root, Element } from 'hast';

/**
 * Rehype plugin to convert code blocks with language "math" to KaTeX rendered HTML.
 * This avoids MDX JSX parsing issues with curly braces in LaTeX.
 *
 * Usage in MDX:
 * ```math
 * V_{th} = V_{FB} + 2\phi_F
 * ```
 */
export function rehypeMathCodeBlock() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      // Find <pre><code class="language-math">...</code></pre>
      if (
        node.tagName === 'pre' &&
        node.children.length === 1 &&
        node.children[0].type === 'element' &&
        node.children[0].tagName === 'code'
      ) {
        const codeNode = node.children[0] as Element;
        const className = codeNode.properties?.className;

        if (
          Array.isArray(className) &&
          className.some((c) => String(c) === 'language-math')
        ) {
          // Extract the math content
          const mathContent = codeNode.children
            .filter((child) => child.type === 'text')
            .map((child) => (child as { value: string }).value)
            .join('');

          try {
            const html = katex.renderToString(mathContent.trim(), {
              displayMode: true,
              throwOnError: false,
            });

            // Replace the pre node with a div containing rendered KaTeX
            const newNode: Element = {
              type: 'element',
              tagName: 'div',
              properties: { className: ['katex-display-wrapper'] },
              children: [
                {
                  type: 'raw',
                  value: html,
                } as unknown as Element,
              ],
            };

            if (parent && typeof index === 'number') {
              (parent.children as Element[])[index] = newNode;
            }
          } catch {
            // If KaTeX fails, leave the code block as-is
          }
        }
      }
    });
  };
}
