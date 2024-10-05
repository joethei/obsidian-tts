import {App, Modal, Setting, TextComponent} from "obsidian";

//slightly modified version from https://github.com/zsviczian/obsidian-excalidraw-plugin
export class TextInputPrompt extends Modal {
    private resolve: (value: TextComponent) => void;
    private textComponent: TextComponent;

	constructor(
		app: App,
		private promptText: string,
		private hint: string,
		private defaultValue: string,
		private placeholder: string,
		private buttonText: string,
		private autoClose: boolean = true
	) {
		super(app);
	}

    onOpen(): void {
        this.titleEl.setText(this.promptText);
        this.createForm();
    }

    onClose(): void {
        this.contentEl.empty();
    }

    createForm(): void {
        const div = this.contentEl.createDiv();

        const text = new Setting(div).setName(this.promptText).setDesc(this.hint).addText((textComponent) => {
            textComponent
                .setValue(this.defaultValue)
                .setPlaceholder(this.placeholder)
                .inputEl.setAttribute("size", "50");
            this.textComponent = textComponent;
        });
        text.controlEl.addClass("tts-text-input");

        new Setting(div).addButton((b) => {
            b
                .setButtonText(this.buttonText)
                .onClick(async () => {
                    this.resolve(this.textComponent);
					if (this.autoClose) {
						this.close();
					}
                });
            return b;
        });
    }

    async openAndGetValue(resolve: (value: TextComponent) => void): Promise<void> {
        this.resolve = resolve;
        await this.open();
    }
}
