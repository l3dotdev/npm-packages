export interface IMeta {
	name: string;
	title: string | null;
	description: string | null;

	setTitle(title: string): this;
	setDescription(description: string): this;
}
