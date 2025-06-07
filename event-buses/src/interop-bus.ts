import type { FlowJob, FlowQueuesOpts, Processor, Queue } from "bullmq";

import type { Bus, CreateWorkerOptions, InferQueueName, TreeJobChildConfig } from "./bus.js";

export type QueueInOut<TIn, TOut> = {
	data: TIn;
	result: TOut;
};

type StringKeyOf<T> = Exclude<keyof T, number | symbol>;

export type ServiceTreeJobConfig<
	TGlobalQueues extends object,
	TGlobalQueue extends keyof TGlobalQueues,
	TServices extends string
> = {
	jobName: string;
	rootData: TGlobalQueues[TGlobalQueue] extends QueueInOut<any, any>
		? TGlobalQueues[TGlobalQueue]["data"]
		: never;
	children: {
		[TService in TServices]?: Omit<TreeJobChildConfig, "queueName">;
	};
	rootOptions?: FlowJob["opts"];
	queuesOptions?: FlowQueuesOpts;
};

export class InteropBus<
	TServices extends string,
	TGlobalQueues extends object,
	TServiceQueues extends object
> {
	protected readonly bus: Bus;
	protected readonly prefix: string;

	constructor(bus: Bus, prefix: string) {
		this.bus = bus;
		this.prefix = prefix;
	}

	public createServiceTreeJob<TQueue extends StringKeyOf<TGlobalQueues>>(
		globalQueueName: TQueue,
		config: ServiceTreeJobConfig<TGlobalQueues, TQueue, TServices>
	) {
		return this.bus.createTreeJob(globalQueueName, {
			prefix: this.prefix,
			jobName: config.jobName,
			rootData: config.rootData,
			rootOptions: config.rootOptions,
			children: (Object.entries(config.children) as [TServices, TreeJobChildConfig][]).map(
				([serviceName, childConfig]) => ({
					...childConfig,
					queueName: this.getServiceQueueName(globalQueueName, serviceName)
				})
			),
			queuesOptions: config.queuesOptions
		});
	}

	public createGlobalQueue<const TQueueName extends StringKeyOf<TGlobalQueues>>(
		queueName: TQueueName
	) {
		return this.bus.createQueue(queueName as `${TQueueName}`, {
			prefix: this.prefix
		});
	}

	public createServiceQueue<
		const TQueueName extends StringKeyOf<TServiceQueues>,
		const TService extends TServices
	>(queueName: TQueueName, service: TService) {
		return this.bus.createQueue(this.getServiceQueueName(queueName, service), {
			prefix: this.prefix
		});
	}

	public createGlobalInteropWorker<
		TQueue extends Queue<any, any, StringKeyOf<TGlobalQueues>>,
		TQueueName extends
			StringKeyOf<TGlobalQueues> = InferQueueName<TQueue> extends `${infer T extends StringKeyOf<TGlobalQueues>}`
			? T
			: never,
		TQueueTypes extends TGlobalQueues[TQueueName] = TGlobalQueues[TQueueName]
	>(
		queue: TQueue,
		processor: TQueueTypes extends QueueInOut<any, any>
			? Processor<TQueueTypes["data"], TQueueTypes["result"], string>
			: never,
		options?: Omit<CreateWorkerOptions, "prefix">
	) {
		return this.bus.createWorker(queue, processor, {
			...options,
			prefix: this.prefix
		});
	}

	public createServiceInteropWorker<
		TQueue extends Queue<any, any, `${StringKeyOf<TServiceQueues>}@${TServices}`>,
		TQueueName extends
			StringKeyOf<TServiceQueues> = InferQueueName<TQueue> extends `${infer T extends StringKeyOf<TServiceQueues>}@${TServices}`
			? T
			: never,
		TQueueTypes extends TServiceQueues[TQueueName] = TServiceQueues[TQueueName]
	>(
		queue: TQueue,
		processor: TQueueTypes extends QueueInOut<any, any>
			? Processor<TQueueTypes["data"], TQueueTypes["result"], string>
			: never,
		options?: Omit<CreateWorkerOptions, "prefix">
	) {
		return this.bus.createWorker(queue, processor, {
			...options,
			prefix: this.prefix
		});
	}

	protected getServiceQueueName<TQueueName extends string, TService extends TServices>(
		queueName: TQueueName,
		service: TService
	): `${TQueueName}@${TService}` {
		return `${queueName}@${service}`;
	}
}
