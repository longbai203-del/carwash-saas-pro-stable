// 04-products/products.js
console.log('📄 04-products/products page loaded');

export function init() {
    console.log('04-products/products initialized');
    
    // 加载商品数据
    const saved = localStorage.getItem('product_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            console.log('已加载商品数据:', data.length);
            if (typeof window.ProductModule !== 'undefined') {
                window.ProductModule.products = data;
                window.ProductModule.filteredProducts = [...data];
                window.ProductModule.render();
            }
        } catch (e) {
            console.warn('加载商品数据失败');
        }
    }
}

export function getProducts() {
    try {
        const data = localStorage.getItem('product_data');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export function getProductById(id) {
    try {
        const products = getProducts();
        return products.find(p => p.id === id) || null;
    } catch (e) {
        return null;
    }
}

export function addProduct(product) {
    try {
        const products = getProducts();
        products.push(product);
        localStorage.setItem('product_data', JSON.stringify(products));
        return true;
    } catch (e) {
        return false;
    }
}

export function updateProduct(id, data) {
    try {
        const products = getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index >= 0) {
            products[index] = { ...products[index], ...data };
            localStorage.setItem('product_data', JSON.stringify(products));
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export function deleteProduct(id) {
    try {
        const products = getProducts();
        const filtered = products.filter(p => p.id !== id);
        localStorage.setItem('product_data', JSON.stringify(filtered));
        return true;
    } catch (e) {
        return false;
    }
}

export function getProductsByCategory(category) {
    try {
        const products = getProducts();
        return products.filter(p => p.category === category);
    } catch (e) {
        return [];
    }
}

export function getActiveProducts() {
    try {
        const products = getProducts();
        return products.filter(p => p.status === 'active');
    } catch (e) {
        return [];
    }
}

export function getLowStockProducts(threshold = 10) {
    try {
        const products = getProducts();
        return products.filter(p => p.stock < threshold);
    } catch (e) {
        return [];
    }
}

export default {
    init,
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getActiveProducts,
    getLowStockProducts
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('04-products/products DOM ready');
    init();
});