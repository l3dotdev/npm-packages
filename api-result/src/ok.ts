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

export type OkResponse<TValue, TStatus extends OkStatusCode> = {
	ok: true;
	value: TValue;
	status: TStatus;
};

export type EmptyResponse = OkResponse<null, 204>;

export function ok<TValue>(value: TValue): OkResponse<TValue, 200>;
export function ok<TValue, TStatus extends OkStatus>(
	value: TValue,
	status: TStatus
): OkResponse<TValue, OkStatusToCode<TStatus>>;
export function ok(value: any, status?: OkStatus): OkResponse<any, any> {
	if (typeof status === "string") {
		status = SUCCESS_STATUS[status as keyof typeof SUCCESS_STATUS] as OkStatusCode;
	}

	return { ok: true, value, status: (status ?? 200) as OkStatusCode };
}

export const EMPTY = ok(null, 204) as EmptyResponse;
