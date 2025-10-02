const API_BASE = "https://swbm3u0ur0.execute-api.us-east-1.amazonaws.com/dev/products";

// Toast notification functions
function showToast(message, type = 'success') {
    const toast = document.getElementById(type === 'success' ? 'successToast' : 'errorToast');
    const messageElement = document.getElementById('errorMessage');

    if (type === 'error' && messageElement) {
        messageElement.textContent = message;
    }

    toast.style.visibility = 'visible';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.visibility = 'hidden';
        }, 500);
    }, 3000);
};

// Format validation errors from backend
function formatValidationErrors(errorData) {
    if (typeof errorData === 'string') {
        return errorData;
    }

    if (errorData.errors && Array.isArray(errorData.errors)) {
        // return errorData.errors.map(err => `${err.field}: ${err.message}`).join(', ');
        return errorData.errors.map(err => `${err.message}`).join(', ');
    }

    if (errorData.error) {
        return errorData.error;
    }

    return 'Validation failed';
};

// Create product
async function createProduct() {
    try {
        const product = {
            name: document.getElementById("name").value,
            price: document.getElementById("price").value ? parseFloat(document.getElementById("price").value) : undefined,
            category: document.getElementById("category").value,
            available: document.getElementById("available").value ? parseFloat(document.getElementById("available").value) : undefined
        };

        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        const responseData = await res.json();

        if (!res.ok) {
            showToast(`Error: ${formatValidationErrors(responseData)}`, 'error');
            return;
        }

        // Clear form and show success
        document.getElementById("name").value = '';
        document.getElementById("price").value = '';
        document.getElementById("category").value = '';
        document.getElementById("available").value = '0';

        showToast('Product created successfully!');
        listProducts();
    } catch (error) {
        console.error('Error creating product:', error);
        showToast('Failed to create product. Please try again.', 'error');
    }
};

// List all products with editable name, price, category, and availability
async function listProducts() {
    const container = document.getElementById("products");
    try {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading products...</p>
            </div>
        `;

        const res = await fetch(API_BASE);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const products = await res.json();
        container.innerHTML = "";

        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3>No products found</h3>
                    <p>Create your first product to get started!</p>
                </div>
            `;
            return;
        }

        // Create table
        const table = document.createElement("table");
        table.className = "product-table";
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Price ($)</th>
                    <th>Category</th>
                    <th>Available Qty</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        container.appendChild(table);
        const tbody = table.querySelector("tbody");

        products.forEach(product => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <input type="text" id="name-${product.id}" value="${escapeHtml(product.name)}" class="input-field">
                </td>
                <td>
                    <input type="number" id="price-${product.id}" value="${product.price}" class="input-field" step="0.01">
                </td>
                <td>
                    <input type="text" id="category-${product.id}" value="${escapeHtml(product.category || '')}" class="input-field">
                </td>
                <td>
                    <input type="number" id="available-${product.id}" value="${product.available}" class="input-field" step="0.001">
                </td>
                <td class="actions-cell">
                    <button onclick='updateProduct("${product.id}")' class="btn update-btn">Update</button>
                    <button onclick='deleteProduct("${product.id}")' class="btn delete-btn">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error listing products:", error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Error loading products</h3>
                <p>Please check your connection and try again.</p>
                <button onclick="listProducts()" class="btn primary" style="margin-top: 1rem;">
                    ↻ Retry
                </button>
            </div>
        `;
    }
};

// Update product now reads name, price, category, available
async function updateProduct(id) {
    try {
        const product = {
            name: document.getElementById(`name-${id}`).value,
            price: document.getElementById(`price-${id}`).value ? parseFloat(document.getElementById(`price-${id}`).value) : undefined,
            category: document.getElementById(`category-${id}`).value,
            available: document.getElementById(`available-${id}`).value ? parseFloat(document.getElementById(`available-${id}`).value) : undefined
        };

        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        const responseData = await res.json();

        if (!res.ok) {
            showToast(`Error: ${formatValidationErrors(responseData)}`, 'error');
            return;
        }

        showToast('Product updated successfully!');
        listProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Failed to update product', 'error');
    }
};

// Delete product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(formatValidationErrors(errorData));
        }

        showToast('Product deleted successfully!');
        listProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(`Failed to delete product: ${error.message}`, 'error');
    }
};

// Utility function to escape HTML
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Add enter key support for form
document.addEventListener('DOMContentLoaded', function () {
    // Enter key support for create form
    const inputs = document.querySelectorAll('#name, #price, #category, #available');
    inputs.forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                createProduct();
            }
        });
    });

    // Initial load
    listProducts();
});

/**
 * Restrict input to numbers with optional decimals.
 * @param {HTMLInputElement} input - The input element
 * @param {number} decimals - Max decimals allowed
 */
function enforceNumeric(input, decimals = 2) {
    let value = input.value.replace(/[^0-9.]/g, '');

    const parts = value.split('.');

    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    if (parts[1] && parts[1].length > decimals) {
        value = parts[0] + '.' + parts[1].slice(0, decimals);
    }

    input.value = value;
}
