import { describe, it, expect } from "vitest";
import { ABAC } from "../src/abac";

describe("ABAC tests", () => {
	it("should return a the correct list of configurable actions", () => {
		const abac = createABAC();
		const actions = abac.getConfigurableActions();

		expect(actions).toEqual([
			{
				path: "user:info",
				own: false,
				action: expect.objectContaining({
					_name: "info",
					_title: "Get user info"
				})
			},
			{
				path: "user:info.public",
				own: false,
				action: expect.objectContaining({
					_name: "info.public",
					_title: "Get public user info"
				})
			},
			{
				path: "shop:view",
				own: false,
				action: expect.objectContaining({
					_name: "view",
					_title: "View the shop"
				})
			},
			{
				path: "shop.product:create",
				own: false,
				action: expect.objectContaining({
					_name: "create",
					_title: "Create products"
				})
			},
			{
				path: "shop.product:edit",
				own: false,
				action: expect.objectContaining({
					_name: "edit",
					_title: "Edit products"
				})
			},
			{
				path: "shop.product:delete",
				own: false,
				action: expect.objectContaining({
					_name: "delete",
					_title: "Delete products"
				})
			}
		]);
	});

	it("should return the correct configurable actions tree", () => {
		const abac = createABAC();
		const tree = abac.getConfigurableActionsTree();

		expect(tree).toEqual([
			{
				meta: expect.objectContaining({
					_name: "user",
					_title: "Users"
				}),
				children: [
					{
						path: "user:info",
						own: false,
						action: expect.objectContaining({
							_name: "info",
							_title: "Get user info"
						})
					},
					{
						path: "user:info.public",
						own: false,
						action: expect.objectContaining({
							_name: "info.public",
							_title: "Get public user info"
						})
					}
				]
			},
			{
				meta: expect.objectContaining({
					_name: "shop",
					_title: "Shops"
				}),
				children: [
					{
						path: "shop:view",
						own: false,
						action: expect.objectContaining({
							_name: "view",
							_title: "View the shop"
						})
					},
					{
						meta: expect.objectContaining({
							_name: "product",
							_title: "Products"
						}),
						children: [
							{
								path: "shop.product:create",
								own: false,
								action: expect.objectContaining({
									_name: "create",
									_title: "Create products"
								})
							},
							{
								path: "shop.product:edit",
								own: false,
								action: expect.objectContaining({
									_name: "edit",
									_title: "Edit products"
								})
							},
							{
								path: "shop.product:delete",
								own: false,
								action: expect.objectContaining({
									_name: "delete",
									_title: "Delete products"
								})
							}
						]
					}
				]
			}
		]);
	});
});

function createABAC() {
	return ABAC.create([
		ABAC.createResource("user")
			.setTitle("Users")
			.setActions([
				ABAC.createAction("info").setTitle("Get user info").setConfigurable(true),
				ABAC.createAction("info.public").setTitle("Get public user info").setConfigurable(true),
				ABAC.createAction("delete").setTitle("Delete user")
			]),
		ABAC.createResource("shop")
			.setTitle("Shops")
			.setActions([
				ABAC.createAction("view").setTitle("View the shop").setConfigurable(true),
				ABAC.createAction("delete").setTitle("Delete the shop")
			])
			.setSubResources([
				ABAC.createResource("product")
					.setTitle("Products")
					.setActions([
						ABAC.createAction("create").setTitle("Create products").setConfigurable(true),
						ABAC.createAction("edit").setTitle("Edit products").setConfigurable(true),
						ABAC.createAction("delete").setTitle("Delete products").setConfigurable(true)
					])
			])
	]);
}
