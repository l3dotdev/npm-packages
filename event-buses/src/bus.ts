import { Logger, logger } from "@l3dev/logger";
import {
	FlowProducer,
	Job,
	Queue,
	Worker,
	type ConnectionOptions,
	type FlowChildJob,
	type FlowJob,
	type FlowQueuesOpts,
	type JobSchedulerTemplateOptions,
	type Processor,
	type QueueBaseOptions,
	type QueueOptions,
	type RepeatOptions,
	type WorkerOptions
} from "bullmq";

export type BusConfig = {
	defaultPrefix: string;
	redisUrl: string;
};

export type CreateQueueOptions = Omit<QueueOptions, "connection">;

export type CreateWorkerOptions = Omit<WorkerOptions, "connection">;

export type CreateFlowProducerOptions = Omit<QueueBaseOptions, "connection">;

export type CreateScheduleOptions = {
	repeat: RepeatOptions;
	template?: {
		name?: string | undefined;
		data?: any;
		opts?: JobSchedulerTemplateOptions;
	};
	queueOptions?: CreateQueueOptions;
	workerOptions?: CreateWorkerOptions;
};

export type ScheduleProcessor<T = any, R = any, N extends string = string> = (args: {
	logger: Logger;
	job: Job<T, R, N>;
	token?: string;
}) => Promise<R>;

export type TreeJobChildConfig = {
	jobName: string;
	queueName: string;
	data: any;
	children?: TreeJobChildConfig[];
	options?: FlowChildJob["opts"];
};

export type TreeJobConfig = {
	jobName: string;
	rootData: any;
	children: TreeJobChildConfig[];
	prefix?: string;
	rootOptions?: FlowJob["opts"];
	queuesOptions?: FlowQueuesOpts;
};

export type InferQueueData<TQueue> = TQueue extends Queue<any, any, any, infer D> ? D : never;
export type InferQueueResult<TQueue> =
	TQueue extends Queue<any, any, any, any, infer R> ? R : never;
export type InferQueueName<TQueue> =
	TQueue extends Queue<any, any, any, any, any, infer N> ? N : never;

export class Bus {
	private readonly config: BusConfig;
	private readonly connection: ConnectionOptions;

	public readonly flow: FlowProducer;

	constructor(config: BusConfig) {
		this.config = config;
		this.connection = {
			url: config.redisUrl
		};
		this.flow = this.createFlowProducer();
	}

	public createQueue<T = any, R = any, TName extends string = string>(
		name: TName,
		options?: CreateQueueOptions
	) {
		return new Queue<T, R, TName>(name, {
			prefix: this.config.defaultPrefix,
			...options,
			connection: this.connection
		});
	}

	public createWorker<TQueue extends Queue<any, any, string>>(
		queue: TQueue,
		processor: Processor<InferQueueData<TQueue>, InferQueueResult<TQueue>, InferQueueName<TQueue>>,
		options?: CreateWorkerOptions
	) {
		return new Worker(queue.name, processor, {
			prefix: this.config.defaultPrefix,
			...options,
			connection: this.connection
		});
	}

	public createThreadedWorker<TQueue extends Queue<any, any, string>>(
		queue: TQueue,
		processor: string | URL,
		options?: CreateWorkerOptions
	) {
		return new Worker(queue.name, processor, {
			prefix: this.config.defaultPrefix,
			useWorkerThreads: true,
			...options,
			connection: this.connection
		});
	}

	public createFlowProducer(options?: CreateFlowProducerOptions) {
		return new FlowProducer({
			...options,
			connection: this.connection
		});
	}

	public createSchedule<TName extends string>(
		scheduleName: TName,
		options: CreateScheduleOptions,
		processor: ScheduleProcessor<any, any, string>
	) {
		const queue = this.createQueue(scheduleName, options.queueOptions);

		queue.upsertJobScheduler(`${scheduleName}-scheduler`, options.repeat, {
			...options.template,
			opts: {
				removeOnComplete: 3,
				removeOnFail: 30,
				...options.template?.opts
			}
		});

		const scheduleLogger = logger.extend({
			prefix: `[${scheduleName}]`
		});

		const worker = this.createWorker(
			queue,
			async (job, token) => {
				scheduleLogger.log(`Processing schedule: ${scheduleName}...`);
				processor({
					logger: scheduleLogger,
					job,
					token
				});
			},
			options.workerOptions
		);

		return {
			scheduleName,
			queue,
			worker
		};
	}

	public createTreeJob(globalQueueName: string, config: TreeJobConfig) {
		const prefix = config.prefix ?? this.config.defaultPrefix;
		function createChildJobs(children: TreeJobChildConfig[]): FlowChildJob[] {
			return children.map((childConfig) => ({
				prefix,
				name: childConfig.jobName,
				queueName: childConfig.queueName,
				data: childConfig.data,
				children: childConfig.children ? createChildJobs(childConfig.children) : undefined,
				opts: childConfig.options
			}));
		}

		return this.flow.add(
			{
				prefix,
				name: config.jobName,
				data: config.rootData,
				queueName: globalQueueName,
				children: createChildJobs(config.children),
				opts: config.rootOptions
			},
			{
				queuesOptions: {
					[globalQueueName]: {
						defaultJobOptions: {
							removeOnComplete: true,
							removeOnFail: 50
						}
					},
					...config.queuesOptions
				}
			}
		);
	}
}

export function createBus(config: BusConfig) {
	return new Bus(config);
}
