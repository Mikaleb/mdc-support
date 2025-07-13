import { Plugin } from "obsidian";

export default class MdcSupportPlugin extends Plugin {
	async onload() {
		this.registerMarkdownPostProcessor((el, ctx) => {
			const text = el.innerText;
			if (text.includes("::")) {
				this.processMdcBlocks(el);
			}
		});
	}

	private processMdcBlocks(el: HTMLElement) {
		const text = el.innerHTML;
		const regex = /::(\w+)<br>([\s\S]*?)<br>::/g;
		const newHtml = text.replace(regex, (match, tag, content) => {
			return this.createMdcElement(tag, content.replace(/<br>/g, '\n')).outerHTML;
		});
		
		if (newHtml !== text) {
			el.innerHTML = newHtml;
		}
	}

	private createMdcElement(tag: string, source: string): HTMLElement {
		const lines = source.split("\n");
		let frontmatterEnd = -1;
		const props: Record<string, any> = {};

		// Parse frontmatter if it starts with ---
		if (lines[0]?.trim() === "---") {
			for (let i = 1; i < lines.length; i++) {
				if (lines[i]?.trim() === "---") {
					frontmatterEnd = i;
					break;
				}
				const line = lines[i]?.trim();
				if (line && line.includes(":")) {
					const [key, ...valueParts] = line.split(":");
					props[key.trim()] = valueParts.join(":").trim();
				}
			}
		}

		// Get content after frontmatter
		const content = lines
			.slice(frontmatterEnd + 1)
			.join("\n")
			.trim();

		// Create container
		const container = document.createElement("div");
		container.className = "mdc-embed";

		// Render content as markdown
		if (content) {
			const contentEl = document.createElement("div");
			contentEl.className = "mdc-embed-content";
			contentEl.innerHTML = this.parseMarkdown(content);
			container.appendChild(contentEl);
		}

		return container;
	}

	private parseMarkdown(text: string): string {
		return text
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			.replace(/`(.*?)`/g, "<code>$1</code>")
			.replace(/\n/g, "<br>");
	}
}
