import type { Err } from "./err.js";
import { ok, type Ok } from "./ok.js";
import type { ResultAsyncFn } from "./result.types.js";

export type PipelineResultAsync<TFns> = TFns extends [
	...infer InterFns extends ResultAsyncFn[],
	infer LastFn extends ResultAsyncFn
]
	? Promise<
			Extract<Awaited<ReturnType<InterFns[number]>>, Err<any, any>> | Awaited<ReturnType<LastFn>>
		>
	: never;

export type PipelineAsyncFn<TFns extends ResultAsyncFn[]> = (
	...input: Parameters<TFns[0]>
) => PipelineResultAsync<TFns>;

export type StepAsyncFn<TPreviousFn extends ResultAsyncFn> = ResultAsyncFn<
	[Extract<Awaited<ReturnType<TPreviousFn>>, Ok<any>>["value"]]
>;

export function pipeAsync<FnA extends ResultAsyncFn, FnB extends StepAsyncFn<FnA>>(
	fnA: FnA,
	fnB: FnB
): PipelineAsyncFn<[FnA, FnB]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>
>(fnA: FnA, fnB: FnB, fnC: FnC): PipelineAsyncFn<[FnA, FnB, FnC]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>,
	FnD extends StepAsyncFn<FnC>
>(fnA: FnA, fnB: FnB, fnC: FnC, fnD: FnD): PipelineAsyncFn<[FnA, FnB, FnC, FnD]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>,
	FnD extends StepAsyncFn<FnC>,
	FnE extends StepAsyncFn<FnD>
>(fnA: FnA, fnB: FnB, fnC: FnC, fnD: FnD, fnE: FnE): PipelineAsyncFn<[FnA, FnB, FnC, FnD, FnE]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>,
	FnD extends StepAsyncFn<FnC>,
	FnE extends StepAsyncFn<FnD>,
	FnF extends StepAsyncFn<FnE>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF
): PipelineAsyncFn<[FnA, FnB, FnC, FnD, FnE, FnF]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>,
	FnD extends StepAsyncFn<FnC>,
	FnE extends StepAsyncFn<FnD>,
	FnF extends StepAsyncFn<FnE>,
	FnG extends StepAsyncFn<FnF>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF,
	fnG: FnG
): PipelineAsyncFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>,
	FnD extends StepAsyncFn<FnC>,
	FnE extends StepAsyncFn<FnD>,
	FnF extends StepAsyncFn<FnE>,
	FnG extends StepAsyncFn<FnF>,
	FnH extends StepAsyncFn<FnG>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF,
	fnG: FnG,
	fnH: FnH
): PipelineAsyncFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG, FnH]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>,
	FnD extends StepAsyncFn<FnC>,
	FnE extends StepAsyncFn<FnD>,
	FnF extends StepAsyncFn<FnE>,
	FnG extends StepAsyncFn<FnF>,
	FnH extends StepAsyncFn<FnG>,
	FnI extends StepAsyncFn<FnH>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF,
	fnG: FnG,
	fnH: FnH,
	fnI: FnI
): PipelineAsyncFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG, FnH, FnI]>;
export function pipeAsync<
	FnA extends ResultAsyncFn,
	FnB extends StepAsyncFn<FnA>,
	FnC extends StepAsyncFn<FnB>,
	FnD extends StepAsyncFn<FnC>,
	FnE extends StepAsyncFn<FnD>,
	FnF extends StepAsyncFn<FnE>,
	FnG extends StepAsyncFn<FnF>,
	FnH extends StepAsyncFn<FnG>,
	FnI extends StepAsyncFn<FnH>,
	FnJ extends StepAsyncFn<FnI>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF,
	fnG: FnG,
	fnH: FnH,
	fnI: FnI,
	fnJ: FnJ
): PipelineAsyncFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG, FnH, FnI, FnJ]>;
export function pipeAsync<const TFns extends ResultAsyncFn[]>(...fns: TFns): PipelineAsyncFn<TFns> {
	return (async (...input: Parameters<TFns[0]>) => {
		let value;
		{
			const result = await fns[0](...input);
			if (!result.ok) {
				return result;
			}
			value = result.value;
		}
		for (let i = 1; i < fns.length; i++) {
			const fn = fns[i];
			const result = await fn(value);
			if (!result.ok) {
				return result;
			}
			value = result.value;
		}
		return ok(value);
	}) as PipelineAsyncFn<TFns>;
}
