import type { Ok } from "@l3dev/result";

const SUCCESS_STATUS = {
	OK: 200,
	CREATED: 201,
	ACCEPTED: 202,
	NON_AUTHORITATIVE_INFORMATION: 203,
	NO_CONTENT: 204,
	RESET_CONTENT: 205,
	PARTIAL_CONTENT: 206,
	MULTI_STATUS: 207,
	ALREADY_REPORTED: 208,
	IM_USED: 226
} as const;

type OkStatus =
	| keyof typeof SUCCESS_STATUS
	| (typeof SUCCESS_STATUS)[keyof typeof SUCCESS_STATUS]
	| (number & {});
type OkStatusCode = (typeof SUCCESS_STATUS)[keyof typeof SUCCESS_STATUS] | (number & {});

type OkStatusToCode<TStatus extends OkStatus> = TStatus extends keyof typeof SUCCESS_STATUS
	? (typeof SUCCESS_STATUS)[TStatus]
	: TStatus;

export type OkResponse<TData, TStatus extends OkStatusCode> = {
	ok: true;
	data: TData;
	status: TStatus;
};

export type EmptyResponse = OkResponse<null, 204>;

export function ok<TData>(data: TData): OkResponse<TData, 200>;
export function ok<TData, TStatus extends OkStatus>(
	data: TData,
	status: TStatus
): OkResponse<TData, OkStatusToCode<TStatus>>;
export function ok(data: any, status?: OkStatus): OkResponse<any, any> {
	if (typeof status === "string") {
		status = SUCCESS_STATUS[status as keyof typeof SUCCESS_STATUS] as OkStatusCode;
	}

	return { ok: true, data, status: (status ?? 200) as OkStatusCode };
}

export const EMPTY = ok(null, 204) as EmptyResponse;

export function fromOk<TOk extends Ok<any>>(ok: TOk): OkResponse<TOk["value"], 200>;
export function fromOk<TOk extends Ok<any>, TStatus extends OkStatus>(
	ok: TOk,
	status: TStatus
): OkResponse<TOk["value"], OkStatusToCode<TStatus>>;
export function fromOk<TOk extends Ok<any>>(
	result: TOk,
	status?: OkStatus
): OkResponse<TOk["value"], any> {
	return ok(result.value, status ?? 500);
}
