# abac

## Description

A type-safe ABAC library.

## Installation

```bash
npm install @l3dev/abac
```

```bash
pnpm add @l3dev/abac
```

## Example

```ts
import { ABAC } from "@l3dev/abac";

type User = {
	id: string;
	username: string;
	admin: boolean;
};

type Organisation = {
	id: string;
	name: string;
	public: boolean;
	owner: User;
};

// Define ABAC resources

const OrganisationABAC = ABAC.createResource("organisation")
	.withSubject<User>()
	.withObject<Organisation>()
	.setActions([
		ABAC.createAction("create").withoutObject(),
		ABAC.createAction("view.public").addTag("public"),
		ABAC.createAction("join")
			.setTitle("Allow Joining")
			.setDescription("Allow users to join the organisation")
			.setConfigurable(true),
		ABAC.createAction("delete")
	]);

// Define ABAC policies

export const abac = ABAC.create([OrganisationABAC])
	.addPolicy((policy) =>
		policy
			.setName("Admins")
			.setMatch(({ subject }) => "admin" in subject && subject.admin)
			.allowAll()
	)
	.addPolicy((policy) =>
		policy
			.setName("Default")
			.allow("organisation.*", ABAC.Filter.ifgranted())
			.allow("organisation:delete", (ctx) => ctx.subject.id === ctx.object.owner.id)
	);

// Getting tagged actions

abac.getTaggedActions("public");
/* [
	{
		path: "organisation:view.public",
		action: ...,
		own: false
	}
] */

abac.getTaggedActions("configurable");
/* [
	{
		path: "organisation:join",
		action: ...,
		own: false
	}
] */

// Checking permissions

const adminUser: User = {
	id: "1",
	username: "Admin",
	admin: true
};

const myUser: User = {
	id: "2",
	username: "User",
	admin: false
};

const otherUser: User = {
	id: "3",
	username: "Other User",
	admin: false
};

const myOrganisation: Organisation = {
	id: "1",
	name: "My Organisation",
	public: false,
	owner: myUser
};

abac.can(myUser, "organisation:delete").granted(myOrganisation); // true

abac.can(otherUser, "organisation:delete").granted(myOrganisation); // false

abac.can(adminUser, "organisation:delete").granted(myOrganisation); // true
```
