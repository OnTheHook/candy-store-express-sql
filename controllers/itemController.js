const queries = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.index = asyncHandler(async (req, res, next) => {
  const [itemCount, categoryCount] = await Promise.all([
    queries.getItemCount(),
    queries.getCategoryCount(),
  ]);

  res.render("index", {
    title: "Candy Shop",
    item_count: itemCount,
    category_count: categoryCount,
  });
});

exports.item_list = asyncHandler(async (req, res, next) => {
  const allItems = await queries.getAllItems();
  allItems.forEach((item) => (item.url = queries.getItemUrl(item.id)));
  res.render("item_list", { title: "Candy List", item_list: allItems });
});

exports.item_detail = asyncHandler(async (req, res, next) => {
  const item = await queries.getItemById(req.params.id);
  item.url = queries.getItemUrl(item.id);
  if (item === null) {
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }

  res.render("item_detail", { title: item.name, item: item });
});

exports.item_create_get = asyncHandler(async (req, res, next) => {
  const allCategories = await queries.getAllCategories();
  res.render("item_form", {
    title: "Create Item",
    categories: allCategories,
  });
});

exports.item_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category =
        typeof req.body.category === "undefined" ? [] : [req.body.category];
    }
    next();
  },

  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must be a number between below 1000")
    .exists()
    .withMessage("Price is required")
    .custom((value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        throw new Error("Price must have maximum of two decimal places");
      }
      return true;
    })
    .isFloat({ min: 0, max: 999.99 })
    .withMessage("Price must be between 0 and 1000")
    .trim(),
  body("amount")
    .exists()
    .withMessage("Amount is required")
    .isInt({ min: 0, max: 10000 })
    .withMessage("Amount must be an integer with between 0 and 10000"),
  body("category.*").escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      amount: req.body.amount,
      category: req.body.category,
    };

    if (!errors.isEmpty()) {
      const allCategories = await queries.getAllCategories();
      res.render("item_form", {
        title: "Create Item",
        categories: allCategories,
        item: item,
        errors: errors.array(),
      });
    } else {
      const newItemId = await queries.createItem(
        item.name,
        item.description,
        item.price,
        item.amount,
        item.category
      );
      res.redirect(queries.getItemUrl(newItemId));
    }
  }),
];

exports.item_delete_get = asyncHandler(async (req, res, next) => {
  const item = await queries.getItemById(req.params.id);

  if (item === null) {
    res.redirect("/catalog/items");
  }
  res.render("item_delete", {
    title: "Delete Item",
    item: item,
  });
});

exports.item_delete_post = asyncHandler(async (req, res, next) => {
  const item = await queries.getItemById(req.params.id);

  if (item === null) {
    res.redirect("/catalog/items");
  }

  await queries.deleteItem(req.params.id);
  res.redirect("/catalog/items");
});

exports.item_update_get = asyncHandler(async (req, res, next) => {
  const [item, allCategories] = await Promise.all([
    queries.getItemById(req.params.id),
    queries.getAllCategories(),
  ]);

  if (item === null) {
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }

  allCategories.forEach((category) => {
    if (item.categories.some((c) => c.id === category.id))
      category.checked = "true";
  });

  res.render("item_form", {
    title: "Update Item",
    item: item,
    categories: allCategories,
  });
});

exports.item_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category =
        typeof req.body.category === "undefined" ? [] : [req.body.category];
    }
    next();
  },

  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must be a number between below 1000")
    .exists()
    .withMessage("Price is required")
    .custom((value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        throw new Error("Price must have maximum of two decimal places");
      }
      return true;
    })
    .isFloat({ min: 0, max: 999.99 })
    .withMessage("Price must be between 0 and 1000")
    .trim(),
  body("amount")
    .exists()
    .withMessage("Amount is required")
    .isInt({ min: 0, max: 10000 })
    .withMessage("Amount must be an integer with between 0 and 10000"),
  body("category.*").escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      amount: req.body.amount,
      category: req.body.category,
      id: req.params.id,
    };

    if (!errors.isEmpty()) {
      const allCategories = await queries.getAllCategories();

      allCategories.forEach((category) => {
        if (item.category.includes(category.id.toString())) {
          category.checked = "true";
        }
      });

      res.render("item_form", {
        title: "Update Item",
        categories: allCategories,
        item: item,
        errors: errors.array(),
      });
      return;
    } else {
      await queries.updateItem(
        item.id,
        item.name,
        item.description,
        item.price,
        item.amount,
        item.category
      );
      res.redirect(queries.getItemUrl(item.id));
    }
  }),
];
