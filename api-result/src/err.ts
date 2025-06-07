import type { Err } from "@l3dev/result";

const ERROR_STATUS = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	PAYMENT_REQUIRED: 402,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	NOT_ACCEPTABLE: 406,
	REQUEST_TIMEOUT: 408,
	CONFLICT: 409,
	GONE: 410,
	PRECONDITION_FAILED: 412,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	MISDIRECTED_REQUEST: 421,
	UPGRADE_REQUIRED: 426,
	PRECONDITION_REQUIRED: 428,
	TOO_MANY_REQUESTS: 429,
	UNAVAILABLE_FOR_LEGAL_REASONS: 451,
	INTERNAL_SERVER_ERROR: 500,
	NOT_IMPLEMENTED: 501,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504
} as const;

type ErrStatus =
	| keyof typeof ERROR_STATUS
	| (typeof ERROR_STATUS)[keyof typeof ERROR_STATUS]
	| (number & {});
type ErrStatusCode = (typeof ERROR_STATUS)[keyof typeof ERROR_STATUS] | (number & {});

type ErrStatusToCode<TStatus extends ErrStatus> = TStatus extends keyof typeof ERROR_STATUS
	? (typeof ERROR_STATUS)[TStatus]
	: TStatus;

export type ErrResponse<TType, TContext extends object | null, TStatus extends ErrStatusCode> = {
	ok: false;
	type: TType;
	context: TContext;
	status: TStatus;
};

export function err<const TType>(type: TType): ErrResponse<TType, null, 500>;
export function err<const TType, TStatus extends ErrStatus>(
	type: TType,
	status: TStatus
): ErrResponse<TType, null, ErrStatusToCode<TStatus>>;
export function err<const TType, TContext extends object | null>(
	type: TType,
	context: TContext
): ErrResponse<TType, TContext, 500>;
export function err<const TType, TContext extends object | null, TStatus extends ErrStatus>(
	type: TType,
	context: TContext,
	status: TStatus
): ErrResponse<TType, TContext, ErrStatusToCode<TStatus>>;
export function err<const TType>(
	type: TType,
	contextOrStatus?: object | null | ErrStatus,
	status?: ErrStatus
): ErrResponse<TType, any, any> {
	let context = contextOrStatus;
	if (typeof contextOrStatus !== "object") {
		status = contextOrStatus;
		context = null;
	}

	if (typeof status === "string") {
		status = ERROR_STATUS[status as keyof typeof ERROR_STATUS] as ErrStatusCode;
	}

	return {
		ok: false,
		type,
		context,
		status: (status ?? 500) as ErrStatusCode
	};
}

export function fromErr<TErr extends Err<any, any>>(
	err: TErr
): ErrResponse<TErr["type"], TErr["context"], 500>;
export function fromErr<TErr extends Err<any, any>, TStatus extends ErrStatus>(
	err: TErr,
	status: TStatus
): ErrResponse<TErr["type"], TErr["context"], ErrStatusToCode<TStatus>>;
export function fromErr<TErr extends Err<any, any>>(
	error: TErr,
	status?: ErrStatus
): ErrResponse<TErr["type"], TErr["context"], any> {
	return err(error.type, error.context, status ?? 500);
}
