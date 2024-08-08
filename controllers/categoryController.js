const queries = require("../db/queries");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.category_list = asyncHandler(async (req, res, next) => {
  const allCategories = await queries.getAllCategories();
  allCategories.forEach(
    (category) => (category.url = queries.getCategoryUrl(category.id))
  );
  res.render("category_list", {
    title: "Category List",
    category_list: allCategories,
  });
});

exports.category_detail = asyncHandler(async (req, res, next) => {
  const category = await queries.getCategoryById(req.params.id);
  if (category === null) {
    const err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }
  category.url = queries.getCategoryUrl(category.id);
  const allItemsInCategory = await queries.getItemsInCategory(req.params.id);
  allItemsInCategory.forEach(
    (item) => (item.url = queries.getItemUrl(item.id))
  );
  console.log(allItemsInCategory);
  res.render("category_detail", {
    title: "Category Detail",
    category: category,
    category_items: allItemsInCategory,
  });
});

exports.category_create_get = asyncHandler(async (req, res, next) => {
  res.render("category_form", { title: "Create Category" });
});

exports.category_create_post = [
  body("name", "Category name must be between 3 and 100 characters")
    .trim()
    .isLength({ min: 3, max: 100 })
    .escape(),
  body("description", "Description must be between 3 and 300 characters")
    .trim()
    .isLength({ min: 3, max: 300 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const category = {
      name: req.body.name,
      description: req.body.description,
    };

    if (!errors.isEmpty()) {
      res.render("category_form", {
        title: "Create Category",
        category: category,
        errors: errors.array(),
      });
      return;
    } else {
      const existingCategory = await queries.getCategoryByName(category.name);
      if (existingCategory) {
        res.redirect(queries.getCategoryUrl(existingCategory.id));
      } else {
        const newCategoryId = await queries.createCategory(
          category.name,
          category.description
        );
        res.redirect(queries.getCategoryUrl(newCategoryId));
      }
    }
  }),
];

exports.category_delete_get = asyncHandler(async (req, res, next) => {
  const category = await queries.getCategoryById(req.params.id);
  if (category === null) {
    res.redirect("/catalog/categories");
  }
  category.url = queries.getCategoryUrl(category.id);
  const itemsInCategory = await queries.getItemsInCategory(req.params.id);
  res.render("category_delete", {
    title: "Delete Category",
    category: category,
    category_items: itemsInCategory,
  });
});

exports.category_delete_post = asyncHandler(async (req, res, next) => {
  const category = await queries.getCategoryById(req.params.id);
  const itemsInCategory = await queries.getItemsInCategory(req.params.id);

  if (itemsInCategory.length > 0) {
    res.render("category_delete", {
      title: "Delete Category",
      category: category,
      category_items: itemsInCategory,
    });
    return;
  } else {
    await queries.deleteCategory(req.params.id);
    res.redirect("/catalog/categories");
  }
});

exports.category_update_get = asyncHandler(async (req, res, next) => {
  const category = await queries.getCategoryById(req.params.id);
  if (category === null) {
    const err = new Error("Category not found");
    err.status = 404;
    return next(err);
  }
  res.render("category_form", { title: "Update Category", category: category });
});

exports.category_update_post = [
  body("name", "Category name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body("description", "Description must be between 3 and 300 characters")
    .trim()
    .isLength({ min: 3, max: 300 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const category = {
      name: req.body.name,
      description: req.body.description,
      id: req.params.id,
    };

    if (!errors.isEmpty()) {
      res.render("category_form", {
        title: "Update Category",
        category: category,
        errors: errors.array(),
      });
      return;
    } else {
      await queries.updateCategory(
        category.id,
        category.name,
        category.description
      );
      res.redirect(queries.getCategoryUrl(category.id));
    }
  }),
];
