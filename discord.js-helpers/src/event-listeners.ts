import type { ILogger } from "@l3dev/logger";
import { logger as defaultLogger } from "@l3dev/logger";
import { NONE, type ResultAsyncFn, type ResultFn } from "@l3dev/result";
// @ts-expect-error Exports don't work for workspace packages
import { ReturnResultSchema } from "@l3dev/result/zod";
import { Client, Collection, Events, type ClientEvents } from "discord.js";
import { z } from "zod";

type EventListenerFn<Event extends keyof ClientEvents> =
	| ResultFn<ClientEvents[Event]>
	| ResultAsyncFn<ClientEvents[Event]>;

export type EventListenerConfig<Event extends keyof ClientEvents> = {
	event: Event;
	once?: boolean;
	listener: EventListenerFn<Event>;
};

export type EventListenerModule<Event extends keyof ClientEvents> = {
	default: EventListenerConfig<Event>;
};

export const ListenerFunctionSchema = z.function({
	input: z.any().array(),
	output: z.union([ReturnResultSchema, z.promise(ReturnResultSchema)])
});

export const EventListenerConfigSchema = z.object({
	event: z.enum(Events),
	once: z.boolean().optional(),
	listener: ListenerFunctionSchema
});

export function defineEventListener<Event extends keyof ClientEvents>(
	config: EventListenerConfig<Event>
) {
	return config;
}

type LoadEventListenersOptions = {
	getModules: <T>() => Record<string, T>;
	logger?: ILogger;
};

export function loadEventListeners({
	getModules,
	logger = defaultLogger
}: LoadEventListenersOptions) {
	const modules = getModules<EventListenerModule<any>>();
	const eventListeners = new Collection<string, EventListenerConfig<any>>();

	for (const [file, module] of Object.entries(modules)) {
		const eventListener = module.default;
		const result = EventListenerConfigSchema.safeParse(eventListener);
		if (!result.success) {
			throw new Error(`Event listener file at ${file} is invalid:`, result.error);
		}

		eventListeners.set(file, eventListener);
		logger.log(`Loaded event listener for '${eventListener.event}' (${file})`);
	}

	return eventListeners;
}

type EventListeners = Collection<string, EventListenerConfig<any>>;
type RegisterEventListenersOptions = {
	client: Client;
	eventListeners: EventListeners;
	logger?: ILogger;
};

export function registerEventListeners({
	client,
	eventListeners,
	logger = defaultLogger
}: RegisterEventListenersOptions) {
	for (const [file, eventListener] of eventListeners.entries()) {
		const wrappedListener = async (...args: any[]) => {
			try {
				const result = await eventListener.listener(...args);
				if (result.ok) return;

				logger.error(`Error in event listener ${file}:`, result);
			} catch (error) {
				logger.fatal(`Error in event listener ${file}:`, error);
			}
		};

		if (eventListener.once) {
			client.once(eventListener.event, wrappedListener);
			logger.log(`Registered event listener ${file} to once:${eventListener.event}`);
		} else {
			client.on(eventListener.event, wrappedListener);
			logger.log(`Registered event listener ${file} to on:${eventListener.event}`);
		}
	}

	return NONE;
}
