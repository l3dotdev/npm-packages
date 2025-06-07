declare global {
	interface String {
		toTitleCase(): string;
		toSlug(): string;
	}

	interface Number {
		toBytesString(): string;
		toDurationComponents(): {
			milliseconds: number;
			seconds: number;
			minutes: number;
			hours: number;
			days: number;
		};
		toDuration(): string;
	}

	interface Date {
		toRelativeString(relativeTo?: Date): string;
		isToday(): boolean;
		isTomorrow(): boolean;
		isYesterday(): boolean;
	}

	interface RegExpConstructor {
		escape(value: string): string;
	}
}

export {};
