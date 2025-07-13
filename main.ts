import { Plugin } from "obsidian";

export default class MdcSupportPlugin extends Plugin {
	async onload() {
		this.registerMarkdownPostProcessor((el, ctx) => {
			const paragraphs = el.querySelectorAll('p');
			paragraphs.forEach(p => {
				const text = p.textContent || '';
				if (text.startsWith('::') && text.includes('::')) {
					this.processMdcBlock(p);
				}
			});
		});
	}

	private processMdcBlock(p: HTMLElement) {
		const fullText = this.getFullBlockText(p);
		const match = fullText.match(/^::(\w+)\s*\n([\s\S]*?)\n::$/m);
		
		if (match) {
			const [, tag, content] = match;
			const mdcEl = this.createMdcElement(tag, content);
			this.replaceBlockElements(p, mdcEl, fullText);
		}
	}

	private getFullBlockText(startEl: HTMLElement): string {
		let text = '';
		let current: Element | null = startEl;
		
		while (current) {
			text += (current.textContent || '') + '\n';
			if (current.textContent?.includes('::') && current !== startEl) break;
			current = current.nextElementSibling;
		}
		
		return text.trim();
	}

	private replaceBlockElements(startEl: HTMLElement, replacement: HTMLElement, blockText: string) {
		const lines = blockText.split('\n');
		let current: Element | null = startEl;
		const toRemove: Element[] = [];
		let lineCount = 0;
		
		while (current && lineCount < lines.length) {
			toRemove.push(current);
			lineCount++;
			if (current.textContent?.includes('::') && current !== startEl) break;
			current = current.nextElementSibling;
		}
		
		startEl.parentNode?.insertBefore(replacement, startEl);
		toRemove.forEach(el => el.remove());
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

		// Add title if present
		if (props.title) {
			const titleEl = document.createElement("div");
			titleEl.className = "mdc-embed-title";
			titleEl.textContent = props.title.replace(/"/g, '');
			container.appendChild(titleEl);
		}

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
