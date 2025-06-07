if (typeof String.prototype.toTitleCase !== "function") {
	String.prototype.toTitleCase = function (this: string) {
		return this[0].toUpperCase() + this.slice(1);
	};
}

String.prototype.toSlug = function (this: string) {
	return this.replace(/[^a-zA-Z0-9]+/g, " ")
		.trim()
		.replace(/ +/g, "-")
		.toLowerCase();
};
