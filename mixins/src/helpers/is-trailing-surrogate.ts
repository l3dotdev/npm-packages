export function isTrailingSurrogate(charCode: number) {
	return typeof charCode === "number" && charCode >= 0xdc00 && charCode <= 0xdfff;
}
