const REDIRECT_STATUS = {
	MULTIPLE_CHOICES: 300,
	MOVED_PERMANENTLY: 301,
	MOVED_TEMPORARILY: 302,
	SEE_OTHER: 303,
	NOT_MODIFIED: 304,
	TEMPORARY_REDIRECT: 307,
	PERMANENT_REDIRECT: 308
} as const;

type RedirectStatus =
	| keyof typeof REDIRECT_STATUS
	| (typeof REDIRECT_STATUS)[keyof typeof REDIRECT_STATUS]
	| (number & {});
type RedirectStatusCode = (typeof REDIRECT_STATUS)[keyof typeof REDIRECT_STATUS] | (number & {});

type RedirectStatusToCode<TStatus extends RedirectStatus> =
	TStatus extends keyof typeof REDIRECT_STATUS ? (typeof REDIRECT_STATUS)[TStatus] : TStatus;

export type RedirectResponse<TTarget extends string | URL, TStatus extends RedirectStatusCode> = {
	ok: true;
	redirect: true;
	value: {
		target: TTarget;
	};
	status: TStatus;
};

export function redirect<TTarget extends string | URL, TStatus extends RedirectStatus>(
	target: TTarget,
	status: TStatus
): RedirectResponse<TTarget, RedirectStatusToCode<TStatus>> {
	if (typeof status === "string") {
		status = REDIRECT_STATUS[status as keyof typeof REDIRECT_STATUS] as TStatus;
	}

	return {
		ok: true,
		redirect: true,
		value: { target },
		status: status as RedirectStatusToCode<TStatus>
	};
}
