import Joi from 'joi';

// --- Field definitions ---
const idField = Joi.string().uuid().required().messages({
    "string.guid": "Order ID must be a valid UUID",
    "any.required": "Order ID is required"
});

const productIdField = Joi.string().uuid().required().messages({
    "string.guid": "Product ID must be a valid UUID",
    "any.required": "Product ID is required"
});

const categoryField = Joi.string().min(1).max(100).required().messages({
    "string.base": "Category must be a string",
    "string.empty": "Category cannot be empty",
    "string.min": "Category must be at least 1 character long",
    "string.max": "Category cannot exceed 100 characters",
    "any.required": "Category is required"
});

const productNameField = Joi.string().min(1).max(255).required().messages({
    "string.empty": "Product name is required",
    "string.min": "Product name must be at least 1 character long",
    "string.max": "Product name cannot exceed 255 characters",
    "any.required": "Product name is required"
});

const unitPriceField = Joi.number().positive().precision(2).max(Math.pow(2, 53)).unsafe(true).required().messages({
    "number.base": "Unit price must be a number",
    "number.positive": "Unit price must be positive",
    "number.precision": "Unit price can have up to 2 decimal places",
    "number.max": "Unit price exceeds the maximum allowed value",
    "any.required": "Unit price is required"
});

const quantityField = Joi.number().integer().min(1).max(1e9).required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
    "number.max": "Quantity exceeds the maximum allowed value",
    "any.required": "Quantity is required"
});

const totalField = Joi.number().positive().precision(2).max(Math.pow(2, 53)).unsafe(true).required().messages({
    "number.base": "Total must be a number",
    "number.positive": "Total must be positive",
    "number.precision": "Total can have up to 2 decimal places",
    "number.max": "Total exceeds maximum allowed value",
    "any.required": "Total is required"
});

// --- Schemas ---

export const createOrderSchema = Joi.object({
    productId: productIdField,
    category: categoryField,
    quantity: quantityField
});

export const updateOrderSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required().messages({
        "number.base": "Quantity must be a number",
        "number.min": "Quantity must be at least 1",
        "any.required": "Quantity is required",
    }),
});

export const orderKeySchema = Joi.object({
    id: idField,
});

export const queryOrdersSchema = Joi.object({
    category: Joi.string().optional(),
    productId: Joi.string().uuid().optional(),
    minTotal: Joi.number().min(0).optional().messages({
        "number.base": '"minTotal" must be a number',
        "number.min": '"minTotal" must be greater than or equal to 0'
    }).prefs({ convert: true }),
    maxTotal: Joi.number().min(0).optional().messages({
        "number.base": '"maxTotal" must be a number',
        "number.min": '"maxTotal" must be greater than or equal to 0'
    }).prefs({ convert: true }),
    sortOrder: Joi.string().valid("asc", "desc").optional().messages({
        "any.only": '"sortOrder" must be either "asc" or "desc"'
    }),
});
