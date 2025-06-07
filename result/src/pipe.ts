import type { Err } from "./err.js";
import { ok, type Ok } from "./ok.js";
import type { ResultFn } from "./result.types.js";

export type PipelineResult<TFns> = TFns extends [
	...infer InterFns extends ResultFn[],
	infer LastFn extends ResultFn
]
	? Extract<ReturnType<InterFns[number]>, Err<any, any>> | ReturnType<LastFn>
	: never;

export type PipelineFn<TFns extends ResultFn[]> = (
	...input: Parameters<TFns[0]>
) => PipelineResult<TFns>;

export type StepFn<TPreviousFn extends ResultFn> = ResultFn<
	[Extract<ReturnType<TPreviousFn>, Ok<any>>["value"]]
>;

export function pipe<FnA extends ResultFn, FnB extends StepFn<FnA>>(
	fnA: FnA,
	fnB: FnB
): PipelineFn<[FnA, FnB]>;
export function pipe<FnA extends ResultFn, FnB extends StepFn<FnA>, FnC extends StepFn<FnB>>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC
): PipelineFn<[FnA, FnB, FnC]>;
export function pipe<
	FnA extends ResultFn,
	FnB extends StepFn<FnA>,
	FnC extends StepFn<FnB>,
	FnD extends StepFn<FnC>
>(fnA: FnA, fnB: FnB, fnC: FnC, fnD: FnD): PipelineFn<[FnA, FnB, FnC, FnD]>;
export function pipe<
	FnA extends ResultFn,
	FnB extends StepFn<FnA>,
	FnC extends StepFn<FnB>,
	FnD extends StepFn<FnC>,
	FnE extends StepFn<FnD>
>(fnA: FnA, fnB: FnB, fnC: FnC, fnD: FnD, fnE: FnE): PipelineFn<[FnA, FnB, FnC, FnD, FnE]>;
export function pipe<
	FnA extends ResultFn,
	FnB extends StepFn<FnA>,
	FnC extends StepFn<FnB>,
	FnD extends StepFn<FnC>,
	FnE extends StepFn<FnD>,
	FnF extends StepFn<FnE>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF
): PipelineFn<[FnA, FnB, FnC, FnD, FnE, FnF]>;
export function pipe<
	FnA extends ResultFn,
	FnB extends StepFn<FnA>,
	FnC extends StepFn<FnB>,
	FnD extends StepFn<FnC>,
	FnE extends StepFn<FnD>,
	FnF extends StepFn<FnE>,
	FnG extends StepFn<FnF>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF,
	fnG: FnG
): PipelineFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG]>;
export function pipe<
	FnA extends ResultFn,
	FnB extends StepFn<FnA>,
	FnC extends StepFn<FnB>,
	FnD extends StepFn<FnC>,
	FnE extends StepFn<FnD>,
	FnF extends StepFn<FnE>,
	FnG extends StepFn<FnF>,
	FnH extends StepFn<FnG>
>(
	fnA: FnA,
	fnB: FnB,
	fnC: FnC,
	fnD: FnD,
	fnE: FnE,
	fnF: FnF,
	fnG: FnG,
	fnH: FnH
): PipelineFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG, FnH]>;
export function pipe<
	FnA extends ResultFn,
	FnB extends StepFn<FnA>,
	FnC extends StepFn<FnB>,
	FnD extends StepFn<FnC>,
	FnE extends StepFn<FnD>,
	FnF extends StepFn<FnE>,
	FnG extends StepFn<FnF>,
	FnH extends StepFn<FnG>,
	FnI extends StepFn<FnH>
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
): PipelineFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG, FnH, FnI]>;
export function pipe<
	FnA extends ResultFn,
	FnB extends StepFn<FnA>,
	FnC extends StepFn<FnB>,
	FnD extends StepFn<FnC>,
	FnE extends StepFn<FnD>,
	FnF extends StepFn<FnE>,
	FnG extends StepFn<FnF>,
	FnH extends StepFn<FnG>,
	FnI extends StepFn<FnH>,
	FnJ extends StepFn<FnI>
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
): PipelineFn<[FnA, FnB, FnC, FnD, FnE, FnF, FnG, FnH, FnI, FnJ]>;
export function pipe<const TFns extends ResultFn[]>(...fns: TFns): PipelineFn<TFns> {
	return ((...input: Parameters<TFns[0]>) => {
		let value;
		{
			const result = fns[0](...input);
			if (!result.ok) {
				return result;
			}
			value = result.value;
		}
		for (let i = 1; i < fns.length; i++) {
			const fn = fns[i];
			const result = fn(value);
			if (!result.ok) {
				return result;
			}
			value = result.value;
		}
		return ok(value);
	}) as PipelineFn<TFns>;
}
