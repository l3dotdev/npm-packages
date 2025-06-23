import util from "node:util";

export enum LogLevel {
	Debug,
	Log,
	Audit,
	Info,
	Warn,
	Error,
	Fatal
}

export type OnWriteLog = (logLevel: LogLevel, message: string, args: any[]) => void;

export type LoggerOptions = {
	stdout?: NodeJS.WriteStream;
	stderr?: NodeJS.WriteStream;
	prefix?: string;
	timestamps?: boolean;
	level?: LogLevel;
	onWrite?: OnWriteLog;
};

export interface ILogger {
	debug(...params: any[]): void;
	log(...params: any[]): void;
	audit<TActor extends { type: string; id: string | number }>(
		actor: TActor,
		message: string,
		data?: any
	): void;
	info(...params: any[]): void;
	warn(...params: any[]): void;
	error(...params: any[]): void;
	fatal(...params: any[]): void;
}

export class Logger implements ILogger {
	public static readonly FOREGROUND_COLORS = {
		black: "\x1b[30m",
		red: "\x1b[31m",
		green: "\x1b[32m",
		yellow: "\x1b[33m",
		blue: "\x1b[34m",
		magenta: "\x1b[35m",
		cyan: "\x1b[36m",
		white: "\x1b[37m",
		gray: "\x1b[90m"
	};

	public static readonly BACKGROUND_COLORS = {
		black: "\x1b[40m",
		red: "\x1b[41m",
		green: "\x1b[42m",
		yellow: "\x1b[44m",
		blue: "\x1b[44m",
		magenta: "\x1b[45m",
		cyan: "\x1b[46m",
		white: "\x1b[47m",
		gray: "\x1b[100m"
	};

	public static readonly MODIFIERS = {
		reset: "\x1b[0m",
		bright: "\x1b[1m",
		dim: "\x1b[2m",
		underscore: "\x1b[4m",
		blink: "\x1b[5m",
		reverse: "\x1b[7m",
		hidden: "\x1b[8m"
	};

	private readonly stdout: NodeJS.WriteStream;
	private readonly stderr: NodeJS.WriteStream;
	private readonly prefix: string;
	private readonly timestamps: boolean;
	private readonly level: LogLevel;
	private readonly onWrite?: OnWriteLog;

	constructor(options?: LoggerOptions) {
		this.stdout = options?.stdout ?? process.stdout;
		this.stderr = options?.stderr ?? process.stderr;
		this.prefix = options?.prefix ? `${options.prefix} ` : "";
		this.timestamps = options?.timestamps ?? false;
		this.level =
			options?.level ??
			(!process.env.NODE_ENV || process.env.NODE_ENV.trim() === "production"
				? LogLevel.Log
				: LogLevel.Debug);
		this.onWrite = options?.onWrite;
	}

	public extend(options: LoggerOptions) {
		return createLogger({
			stdout: this.stdout,
			stderr: this.stderr,
			level: this.level,
			timestamps: this.timestamps,
			...options,
			prefix: `${this.prefix}${options.prefix ?? ""}`.trim()
		});
	}

	public debug(...params: any[]) {
		this.internalLog(this.stdout, LogLevel.Debug, ...params);
	}

	public log(...params: any[]) {
		this.internalLog(this.stdout, LogLevel.Log, ...params);
	}

	public audit<TActor extends { type: string; id: string | number }>(
		actor: TActor,
		message: string,
		data?: any
	) {
		const msg = [];
		msg.push(Logger.style(`${actor.type}:${actor.id}`, { fg: "white", modifier: "bright" }));
		msg.push(message);

		this.internalLog(this.stdout, LogLevel.Audit, msg.join(" "), { actor, data });
	}

	public info(...params: any[]) {
		this.internalLog(this.stdout, LogLevel.Info, ...params);
	}

	public warn(...params: any[]) {
		this.internalLog(this.stdout, LogLevel.Warn, ...params);
	}

	public error(...params: any[]) {
		this.internalLog(this.stderr, LogLevel.Error, ...params);
	}

	public fatal(...params: any[]) {
		this.internalLog(this.stderr, LogLevel.Fatal, ...params);
	}

	private internalLog(stream: NodeJS.WriteStream, logLevel: LogLevel, ...params: any[]) {
		if (logLevel < this.level) return;

		const [message, args] = Logger.getPrimaryMessage(...params);
		const log = util
			.formatWithOptions(
				{
					colors: true,
					depth: 3,
					maxArrayLength: 10,
					compact: true,
					breakLength: 512
				},
				`${this.prefix}${Logger.stylePrimaryMessage(logLevel, message)}${args.length > 0 ? "\n" : ""}`,
				...args
			)
			.trimEnd();

		stream.write((this.timestamps ? `(${new Date().toISOString()}) ` : "") + log + "\n");
		if (this.onWrite) this.onWrite(logLevel, message, args);
	}

	private static stylePrimaryMessage(logLevel: LogLevel, message: any) {
		if (logLevel === LogLevel.Log) {
			return message;
		} else if (logLevel === LogLevel.Audit) {
			return Logger.style(`DEBUG ${message}`, { fg: "gray" });
		} else if (logLevel === LogLevel.Debug) {
			return Logger.style(`AUDIT ${message}`, { fg: "cyan" });
		} else if (logLevel === LogLevel.Info) {
			return `${Logger.style("INFO", { fg: "blue" })} ${message}`;
		} else if (logLevel === LogLevel.Warn) {
			return `${Logger.style(" WARN ", { fg: "black", bg: "yellow" })} ${message}`;
		} else if (logLevel === LogLevel.Error) {
			return `${Logger.style(" ERROR ", { fg: "white", bg: "red" })} ${message}`;
		} else if (logLevel === LogLevel.Fatal) {
			return `${Logger.style(" FATAL ", { fg: "black", bg: "red", modifier: "bright" })} ${message}`;
		}

		return message;
	}

	private static getPrimaryMessage(...args: any[]) {
		let message: string;
		if (typeof args[0] === "string") {
			message = args.shift();
		} else {
			message = "";
		}
		return [message, args] as const;
	}

	private static style(
		message: string,
		style: {
			fg?: keyof typeof Logger.FOREGROUND_COLORS;
			bg?: keyof typeof Logger.BACKGROUND_COLORS;
			modifier?: keyof typeof Logger.MODIFIERS;
		}
	) {
		let prefix = "";
		if (style.fg) {
			prefix += Logger.FOREGROUND_COLORS[style.fg];
		}
		if (style.bg) {
			prefix += Logger.BACKGROUND_COLORS[style.bg];
		}
		if (style.modifier) {
			prefix += Logger.MODIFIERS[style.modifier];
		}
		return `${prefix}${message.replace(Logger.MODIFIERS.reset, Logger.MODIFIERS.reset + prefix)}${Logger.MODIFIERS.reset}`;
	}
}

export function createLogger(options?: LoggerOptions) {
	return new Logger(options);
}

export const logger = createLogger({
	prefix: process.env.DEFAULT_LOGGER_PREFIX
});
