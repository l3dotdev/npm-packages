const k = 1024;
const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

Number.prototype.toBytesString = function (this: number) {
	if (this === 0) return "0 Bytes";

	const i = Math.floor(Math.log(this) / Math.log(k));
	return parseFloat((this / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

Number.prototype.toDurationComponents = function (this: number) {
	const seconds = Math.floor(this / 1000);
	return {
		milliseconds: this % 1000,
		seconds: seconds % 60,
		minutes: Math.floor(seconds / 60) % 60,
		hours: Math.floor(seconds / 3600) % 24,
		days: Math.floor(seconds / 86400)
	};
};

Number.prototype.toDuration = function (this: number) {
	const { days, hours, minutes, seconds } = this.toDurationComponents();

	const components: string[] = [];
	if (days > 0) {
		components.push(`${days} day${days > 1 ? "s" : ""}`);
	}
	if (hours > 0) {
		components.push(`${hours} hour${hours > 1 ? "s" : ""}`);
	}
	if (minutes > 0) {
		components.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
	}
	if (seconds > 0) {
		components.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
	}
	return components.join(" ");
};
