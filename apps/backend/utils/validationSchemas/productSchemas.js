import Joi from 'joi';

// --- Schema fragments ---
const nameField = Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 1 character long',
    'string.max': 'Product name cannot exceed 255 characters',
    'any.required': 'Product name is required'
});

const priceField = Joi.number().positive().precision(2).max(Math.pow(2, 53)).unsafe(true).required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number',
    'number.precision': 'Price can have up to 2 decimal places',
    'number.max': 'Price exceeds maximum allowed value',
    'any.required': 'Price is required'
});

const categoryField = Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Category is required',
    'string.min': 'Category must be at least 1 character long',
    'string.max': 'Category cannot exceed 100 characters',
    'any.required': 'Category is required'
});

const availableField = Joi.number().min(0).precision(3).max(Math.pow(2, 53)).unsafe(true).messages({
    'number.base': 'Available quantity must be a number',
    'number.min': 'Available quantity cannot be negative',
    'number.max': 'Available quantity exceeds maximum allowed value',
    'number.precision': 'Available quantity can have up to 3 decimal places'
});

// --- Schemas ---
export const createProductSchema = Joi.object({
    name: nameField,
    price: priceField,
    category: categoryField,
    available: availableField
});

export const updateProductSchema = Joi.object({
    name: nameField,
    price: priceField,
    category: categoryField,
    available: availableField
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

export const productKeySchema = Joi.object({
    id: Joi.string().uuid().required().messages({
        'string.guid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
    }),
    category: Joi.string().min(1).required().messages({
        'string.base': 'Category must be a string',
        'string.empty': 'Category cannot be empty',
        'any.required': 'Category is required'
    })
});

export const queryParamsSchema = Joi.object({
    category: Joi.string().optional(),
    name: Joi.string().optional(),
    // Price range
    minPrice: Joi.number().min(0).optional().messages({
        "number.base": '"minPrice" must be a number',
        "number.min": '"minPrice" must be greater than or equal to 0'
    }).prefs({ convert: true }),
    maxPrice: Joi.number().min(0).optional().messages({
        "number.base": '"maxPrice" must be a number',
        "number.min": '"maxPrice" must be greater than or equal to 0'
    }).prefs({ convert: true }),
    // Availability filters
    availableStatus: Joi.string().valid("inStock", "outOfStock").optional()
        .messages({ "any.only": '"availableStatus" must be either "inStock" or "outOfStock"' }),
    minAvailable: Joi.number().min(0).optional().messages({
        "number.base": '"minAvailable" must be a number',
        "number.min": '"minAvailable" must be greater than or equal to 0'
    }).prefs({ convert: true }),
    maxAvailable: Joi.number().min(0).optional().messages({
        "number.base": '"maxAvailable" must be a number',
        "number.min": '"maxAvailable" must be greater than or equal to 0'
    }).prefs({ convert: true }),
    // Sorting
    sortOrder: Joi.string().valid("asc", "desc").optional()
        .messages({ "any.only": '"sortOrder" must be either "asc" or "desc"' }),
});
