export function isLeadingSurrogate(charCode: number) {
	return typeof charCode === "number" && charCode >= 0xd800 && charCode <= 0xdbff;
}
