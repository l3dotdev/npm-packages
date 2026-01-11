import { describe, expect, it } from "vitest";
import { ABAC } from "../src/abac";

type User = { id: number; username: string; email: string; role: "admin" | "user" };

type Shop = { id: number; name: string };

type Product = { id: number; name: string; price: number; shopId: number };

describe("Policy tests", () => {
	const user: User = { id: 1, username: "User", email: "user@example.com", role: "user" };

	it("should deny permission if no policy matches", () => {
		const abac = createABAC();

		const permission = abac.can(user, "user:info.public");

		expect(permission.granted(user)).toBeFalsy();
	});

	it("should allow the user to edit a product in the same shop", () => {
		const abac = createABAC();

		const shop: Shop = { id: 1, name: "Shop" };
		const product: Product = { id: 1, name: "Product", price: 10, shopId: 1 };

		const permission = abac.can(user, "shop.product:edit");

		expect(permission.policies.length).toBeGreaterThanOrEqual(1);
		expect(
			permission.granted(product, {
				shop
			})
		).toBeTruthy();
	});

	it("should deny the user from editing a product in a different shop", () => {
		const abac = createABAC();

		const shop: Shop = { id: 1, name: "Shop" };
		const product: Product = { id: 1, name: "Product", price: 10, shopId: 12 };

		const permission = abac.can(user, "shop.product:edit");

		expect(permission.policies.length).toBeGreaterThanOrEqual(1);
		expect(
			permission.granted(product, {
				shop
			})
		).toBeFalsy();
	});
});

function createABAC() {
	return ABAC.create([
		ABAC.createResource("user")
			.withSubject<User>()
			.withObject<User>()
			.setOwnable(true)
			.setTitle("Users")
			.setActions([
				ABAC.createAction("info").setTitle("Get user info").setConfigurable(true),
				ABAC.createAction("info.public").setTitle("Get public user info").setConfigurable(true),
				ABAC.createAction("delete").setTitle("Delete user")
			]),
		ABAC.createResource("shop")
			.withSubject<User>()
			.withObject<Shop>()
			.setOwnable(true)
			.setTitle("Shops")
			.setActions([
				ABAC.createAction("view").setTitle("View the shop").setConfigurable(true),
				ABAC.createAction("delete").setTitle("Delete the shop")
			])
			.setSubResources([
				ABAC.createResource("product")
					.withSubject<User>()
					.withObject<Product>()
					.setTitle("Products")
					.setActions([
						ABAC.createAction("create").setTitle("Create products").setConfigurable(true),
						ABAC.createAction("edit")
							.withAdditionalContext<{ shop: Shop }>()
							.setTitle("Edit products")
							.setConfigurable(true),
						ABAC.createAction("delete").setTitle("Delete products").setConfigurable(true)
					])
			])
	]).addPolicy((policy) =>
		policy.allow("shop.product:edit", (ctx) => ctx.object.shopId === ctx.shop.id)
	);
}
