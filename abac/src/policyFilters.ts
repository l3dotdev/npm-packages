function allowPredicate() {
	return true;
}

function denyPredicate() {
	return false;
}

function ifgrantedPredicate() {
	return "ifgranted" as const;
}

export abstract class PolicyFilters {
	public static allow() {
		return allowPredicate;
	}

	public static deny() {
		return denyPredicate;
	}

	public static ifgranted() {
		return ifgrantedPredicate;
	}
}
