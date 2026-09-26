/* =========================================
   SHOP EASE - FRONTEND JAVASCRIPT
========================================= */

const API_URL = "http://localhost:5000/api";

let currentUser = null;
let products = [];
let cart = [];


/* =========================================
   DOM ELEMENTS
========================================= */

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const productsContainer =
    document.getElementById("productsContainer");

const cartContainer =
    document.getElementById("cartContainer");

const ordersContainer =
    document.getElementById("ordersContainer");

const orderDetailsContainer =
    document.getElementById("orderDetailsContainer");

const cartCount =
    document.getElementById("cartCount");

const userName =
    document.getElementById("userName");

const logoutBtn =
    document.getElementById("logoutBtn");

const toast =
    document.getElementById("toast");

const productSearch =
    document.getElementById("productSearch");

const categoryFilter =
    document.getElementById("categoryFilter");


/* =========================================
   PAGE START
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const savedUser = localStorage.getItem("shopEaseUser");

    if (savedUser) {

        try {

            currentUser = JSON.parse(savedUser);

            showApp();

        } catch (error) {

            localStorage.removeItem("shopEaseUser");

        }

    }

});


/* =========================================
   LOGIN / REGISTER TOGGLE
========================================= */

showRegister.addEventListener("click", () => {

    loginBox.classList.add("hidden");

    registerBox.classList.remove("hidden");

});


showLogin.addEventListener("click", () => {

    registerBox.classList.add("hidden");

    loginBox.classList.remove("hidden");

});


/* =========================================
   REGISTER
========================================= */

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    try {

        const response = await fetch(
            `${API_URL}/auth/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Registration failed"
            );

        }

        showToast("Account created successfully! 🎉");

        registerForm.reset();

        registerBox.classList.add("hidden");

        loginBox.classList.remove("hidden");

        document.getElementById("loginEmail").value = email;

    } catch (error) {

        console.error(error);

        showToast(error.message);

    }

});


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    try {

        const response = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Login failed"
            );

        }

        const token = data.token;

        const user = decodeToken(token);

        currentUser = {
            id: user.id || user.user_id,
            name: user.name || email.split("@")[0],
            email: user.email || email,
            token
        };

        localStorage.setItem(
            "shopEaseUser",
            JSON.stringify(currentUser)
        );

        loginForm.reset();

        showToast("Login successful! 👋");

        showApp();

    } catch (error) {

        console.error(error);

        showToast(error.message);

    }

});


/* =========================================
   DECODE JWT
========================================= */

function decodeToken(token) {

    try {

        const payload =
            token.split(".")[1];

        const decoded =
            atob(
                payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            );

        return JSON.parse(decoded);

    } catch (error) {

        console.error("JWT decode error:", error);

        return {};

    }

}


/* =========================================
   SHOW APPLICATION
========================================= */

function showApp() {

    authScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");

    if (currentUser) {

        userName.textContent =
            `Hi, ${currentUser.name}`;

    }

    loadProducts();

    loadCart();

    loadOrders();

}


/* =========================================
   LOGOUT
========================================= */

logoutBtn.addEventListener("click", () => {

    localStorage.removeItem("shopEaseUser");

    currentUser = null;

    cart = [];

    appScreen.classList.add("hidden");

    authScreen.classList.remove("hidden");

    showToast("Logged out successfully");

});


/* =========================================
   NAVIGATION
========================================= */

document.querySelectorAll(".nav-btn").forEach(button => {

    button.addEventListener("click", () => {

        const viewId = button.dataset.view;

        showView(viewId);

        document.querySelectorAll(".nav-btn")
            .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

    });

});


/* =========================================
   HEADER CART BUTTON
========================================= */

const cartButton =
    document.querySelector(".cart-btn");

if (cartButton) {

    cartButton.addEventListener("click", () => {

        showView("cartView");

        document.querySelectorAll(".nav-btn")
            .forEach(btn => btn.classList.remove("active"));

    });

}


function showView(viewId) {

    document.querySelectorAll(".view")
        .forEach(view => view.classList.add("hidden"));

    const selectedView =
        document.getElementById(viewId);

    if (selectedView) {

        selectedView.classList.remove("hidden");

    }

    if (viewId === "productsView") {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    if (viewId === "cartView") {

        loadCart();

    }

    if (viewId === "ordersView") {

        loadOrders();

    }

}


/* =========================================
   SEARCH + CATEGORY FILTER
========================================= */

if (productSearch) {

    productSearch.addEventListener(
        "input",
        applyProductFilters
    );

}


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        applyProductFilters
    );

}


function applyProductFilters() {

    const searchTerm =
        (productSearch?.value || "")
            .trim()
            .toLowerCase();

    const selectedCategory =
        categoryFilter?.value || "all";

    const filteredProducts =
        products.filter(product => {

            const name =
                String(
                    product.name || ""
                ).toLowerCase();

            const description =
                String(
                    product.description || ""
                ).toLowerCase();

            const category =
                String(
                    product.category || ""
                ).toLowerCase();

            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                description.includes(searchTerm) ||
                category.includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                category ===
                selectedCategory.toLowerCase();

            return (
                matchesSearch &&
                matchesCategory
            );

        });

    renderProducts(filteredProducts);

}


function filterCategory(category) {

    showView("productsView");

    if (categoryFilter) {

        categoryFilter.value =
            category;

    }

    if (productSearch) {

        productSearch.value = "";

    }

    applyProductFilters();

    setTimeout(() => {

        const section =
            document.getElementById(
                "productSection"
            );

        if (section) {

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }, 100);

}


function showAllProducts() {

    showView("productsView");

    if (categoryFilter) {

        categoryFilter.value = "all";

    }

    if (productSearch) {

        productSearch.value = "";

    }

    renderProducts(products);

}


function focusSearch() {

    showView("productsView");

    setTimeout(() => {

        if (productSearch) {

            productSearch.focus();

            productSearch.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    }, 100);

}


function scrollToProducts() {

    showView("productsView");

    setTimeout(() => {

        const section =
            document.getElementById(
                "productSection"
            );

        if (section) {

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }, 100);

}

/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadProducts() {

    try {

        const response =
            await fetch(`${API_URL}/products`);

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load products"
            );

        }

        products = Array.isArray(data)
            ? data
            : data.products || [];

        if (productSearch) {
            productSearch.value = "";
        }

        if (categoryFilter) {
            categoryFilter.value = "all";
        }

        renderProducts(products);

    } catch (error) {

        console.error(error);

        productsContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load products
                </h3>

                <p>
                    Make sure the backend
                    server is running.
                </p>

            </div>
        `;

    }

}


/* =========================================
   RENDER PRODUCTS
========================================= */

function renderProducts(list = products) {

    if (!list.length) {

        productsContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🔎
                </div>

                <h3>
                    No products found
                </h3>

                <p>
                    Try another search
                    or category.
                </p>

                <button
                    class="primary-btn"
                    onclick="showAllProducts()"
                >
                    Show All Products
                </button>

            </div>
        `;

        return;

    }


    productsContainer.innerHTML =
        list.map(product => {

            const stock =
                Number(product.stock || 0);

            const isOutOfStock =
                stock <= 0;

            const stockText =
                isOutOfStock
                    ? "Out of stock"
                    : `${stock} in stock`;


            return `
                <article
                    class="product-card"
                >

                    <div
                        class="product-image-wrap"
                    >

                        <img
                            class="product-image"
                            src="${escapeHTML(
                                product.image_url || ""
                            )}"
                            alt="${escapeHTML(
                                product.name
                            )}"
                            loading="lazy"
                            onerror="
                                this.style.display='none';
                                this.parentElement
                                    .classList
                                    .add('image-fallback')
                            "
                        >

                        <span
                            class="product-badge"
                        >
                            ${escapeHTML(
                                product.category ||
                                "Product"
                            )}
                        </span>

                    </div>


                    <div
                        class="product-info"
                    >

                        <div
                            class="product-category"
                        >
                            ${escapeHTML(
                                product.category ||
                                "Product"
                            )}
                        </div>


                        <h3
                            class="product-name"
                        >
                            ${escapeHTML(
                                product.name
                            )}
                        </h3>


                        <p
                            class="product-description"
                        >
                            ${escapeHTML(
                                product.description ||
                                "Quality product from ShopEase."
                            )}
                        </p>


                        <div
                            class="product-bottom"
                        >

                            <div>

                                <div
                                    class="product-price"
                                >
                                    ₹${Number(
                                        product.price || 0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </div>


                                <div
                                    class="stock ${
                                        isOutOfStock
                                            ? "out-of-stock"
                                            : ""
                                    }"
                                >
                                    ${stockText}
                                </div>

                            </div>


                            <button
                                class="add-cart-btn"
                                ${
                                    isOutOfStock
                                        ? "disabled"
                                        : ""
                                }
                                onclick="
                                    addToCart(
                                        ${Number(product.id)}
                                    )
                                "
                            >
                                ${
                                    isOutOfStock
                                        ? "Sold Out"
                                        : "Add to Cart"
                                }
                            </button>

                        </div>

                    </div>

                </article>
            `;

        }).join("");

}


/* =========================================
   ADD TO CART
========================================= */

async function addToCart(productId) {

    if (!currentUser) {

        showToast(
            "Please login first"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/cart`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        user_id:
                            currentUser.id,

                        product_id:
                            productId,

                        quantity: 1
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not add product"
            );

        }


        showToast(
            "Product added to cart 🛒"
        );


        loadCart();


    } catch (error) {

        console.error(error);

        showToast(
            error.message
        );

    }

}


/* =========================================
   LOAD CART
========================================= */

async function loadCart() {

    if (!currentUser) return;


    try {

        const response =
            await fetch(
                `${API_URL}/cart/${currentUser.id}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load cart"
            );

        }


        cart =
            Array.isArray(data)
                ? data
                : data.items ||
                  data.cart ||
                  [];


        renderCart();

        updateCartCount();


    } catch (error) {

        console.error(error);

        cart = [];

        renderCart();

        updateCartCount();

    }

}


/* =========================================
   CART COUNT
========================================= */

function updateCartCount() {

    const count =
        cart.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 1
                ),
            0
        );


    cartCount.textContent =
        count;

}


/* =========================================
   RENDER CART
========================================= */

function renderCart() {

    if (!cart.length) {

        cartContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🛒
                </div>

                <h3>
                    Your cart is empty
                </h3>

                <p>
                    Add some products
                    to start shopping.
                </p>

                <button
                    class="primary-btn"
                    onclick="goToProducts()"
                >
                    Browse Products
                </button>

            </div>
        `;

        return;
    }


    let total = 0;


    const itemsHTML =
        cart.map(item => {

            const quantity =
                Number(item.quantity || 1);

            const price =
                Number(
                    item.price ||
                    item.product_price ||
                    0
                );

            const subtotal =
                price * quantity;

            total += subtotal;


            return `
                <div class="cart-item">

                    <div class="cart-item-info">

                        <h3>
                            ${escapeHTML(
                                item.name ||
                                item.product_name ||
                                "Product"
                            )}
                        </h3>

                        <p>
                            ₹${price.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2
                                }
                            )}
                            each
                        </p>

                        <div class="quantity-controls">

                            <button
                                class="quantity-btn"
                                onclick="updateCartQuantity(
                                    ${item.id},
                                    ${quantity - 1}
                                )"
                                ${quantity <= 1 ? "disabled" : ""}
                            >
                                −
                            </button>

                            <span class="quantity-number">
                                ${quantity}
                            </span>

                            <button
                                class="quantity-btn"
                                onclick="updateCartQuantity(
                                    ${item.id},
                                    ${quantity + 1}
                                )"
                            >
                                +
                            </button>

                        </div>

                    </div>


                    <div class="cart-item-right">

                        <div class="cart-price">
                            ₹${subtotal.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2
                                }
                            )}
                        </div>

                        <button
                            class="remove-cart-btn"
                            onclick="removeFromCart(${item.id})"
                        >
                            Remove
                        </button>

                    </div>

                </div>
            `;

        }).join("");


    cartContainer.innerHTML = `

        ${itemsHTML}


        <div class="cart-summary">

            <div class="summary-row">

                <span>
                    Items
                </span>

                <span>
                    ${cart.reduce(
                        (sum, item) =>
                            sum + Number(item.quantity || 1),
                        0
                    )}
                </span>

            </div>


            <div class="summary-total">

                <span>
                    Total
                </span>

                <span>
                    ₹${total.toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2
                        }
                    )}
                </span>

            </div>


            <button
                class="checkout-btn"
                onclick="checkout()"
            >
                Proceed to Checkout
            </button>

        </div>
    `;
}

// ========================================
// UPDATE CART QUANTITY
// ========================================

async function updateCartQuantity(cartItemId, newQuantity) {

    if (newQuantity < 1) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/cart/${cartItemId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    quantity: newQuantity
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            showToast(
                data.message ||
                "Unable to update quantity"
            );

            return;
        }


        showToast(
            "Cart quantity updated"
        );


        // Reload cart from backend
        await loadCart();

        updateCartCount();

    } catch (error) {

        console.error(
            "Update cart error:",
            error
        );

        showToast(
            "Unable to update cart"
        );

    }

}



// ========================================
// REMOVE PRODUCT FROM CART
// ========================================

async function removeFromCart(cartItemId) {

    try {

        const response = await fetch(
            `${API_URL}/cart/${cartItemId}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            showToast(
                data.message ||
                "Unable to remove product"
            );

            return;
        }


        showToast(
            "Product removed from cart"
        );


        // Reload cart from backend
        await loadCart();

        updateCartCount();

    } catch (error) {

        console.error(
            "Remove cart error:",
            error
        );

        showToast(
            "Unable to remove product"
        );

    }

}


/* =========================================
   CHECKOUT
========================================= */

async function checkout() {

    if (!currentUser) {

        showToast(
            "Please login first"
        );

        return;

    }


    if (!cart.length) {

        showToast(
            "Your cart is empty"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/orders/checkout`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        user_id:
                            currentUser.id
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Checkout failed"
            );

        }


        showToast(
            `Order #${data.orderId} placed successfully! 🎉`
        );


       cart = [];

await loadCart();

updateCartCount();


        setTimeout(() => {

            showView(
                "ordersView"
            );


            document
                .querySelectorAll(
                    ".nav-btn"
                )
                .forEach(btn =>
                    btn.classList.remove(
                        "active"
                    )
                );


            const ordersButton =
                document.querySelector(
                    '[data-view="ordersView"]'
                );


            if (ordersButton) {

                ordersButton.classList.add(
                    "active"
                );

            }


            loadOrders();

        }, 800);


    } catch (error) {

        console.error(error);

        showToast(
            error.message
        );

    }

}

/* =========================================
   LOAD ORDERS
========================================= */

async function loadOrders() {

    if (!currentUser) return;


    try {

        const response =
            await fetch(
                `${API_URL}/orders/user/${currentUser.id}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load orders"
            );

        }


        const orders =
            Array.isArray(data)
                ? data
                : data.orders || [];


        renderOrders(orders);


    } catch (error) {

        console.error(error);


        ordersContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📦
                </div>

                <h3>
                    Unable to load orders
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


/* =========================================
   RENDER ORDERS
========================================= */

function renderOrders(orders) {

    if (!orders.length) {

        ordersContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📦
                </div>

                <h3>
                    No orders yet
                </h3>

                <p>
                    Your orders will appear here.
                </p>

                <button
                    class="primary-btn"
                    onclick="goToProducts()"
                >
                    Start Shopping
                </button>

            </div>
        `;

        return;

    }


    ordersContainer.innerHTML =
        orders.map(order => {

            const status =
                order.status ||
                "Placed";


            return `
                <div
                    class="order-card"
                >

                    <div>

                        <div
                            class="order-id"
                        >
                            Order #${order.id}
                        </div>


                        <div
                            class="order-date"
                        >
                            ${formatDate(
                                order.created_at
                            )}
                        </div>

                    </div>


                    <div>

                        <div
                            class="order-amount"
                        >
                            ₹${Number(
                                order.total_amount ||
                                0
                            ).toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2
                                }
                            )}
                        </div>


                        <span
                            class="
                                status
                                ${getStatusClass(
                                    status
                                )}
                            "
                        >
                            ${escapeHTML(
                                status
                            )}
                        </span>

                    </div>


                    <button
                        class="view-order-btn"
                        onclick="
                            viewOrder(
                                ${order.id}
                            )
                        "
                    >
                        View Order
                    </button>

                </div>
            `;

        }).join("");

}


/* =========================================
   VIEW ORDER
========================================= */

async function viewOrder(orderId) {

    try {

        const response =
            await fetch(
                `${API_URL}/orders/${orderId}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load order"
            );

        }


        renderOrderDetails(data);


        document
            .querySelectorAll(".view")
            .forEach(view =>
                view.classList.add(
                    "hidden"
                )
            );


        document
            .getElementById(
                "orderDetailsView"
            )
            .classList.remove(
                "hidden"
            );


    } catch (error) {

        console.error(error);

        showToast(
            error.message
        );

    }

}


/* =========================================
   RENDER ORDER DETAILS
========================================= */

function renderOrderDetails(data) {

    const order =
        data.order ||
        data;


    const items =
        data.items ||
        order.items ||
        [];


    const status =
        order.status ||
        "Placed";


    let itemsHTML = "";


    if (items.length) {

        itemsHTML =
            items.map(item => {

                const quantity =
                    Number(
                        item.quantity || 1
                    );


                const itemPrice =
                    Number(
                        item.price || 0
                    );


                const subtotal =
                    Number(
                        item.subtotal ||
                        (
                            itemPrice *
                            quantity
                        )
                    );


                return `
                    <div
                        class="detail-item"
                    >

                        <span
                            class="detail-label"
                        >
                            ${escapeHTML(
                                item.name ||
                                item.product_name ||
                                "Product"
                            )}

                            × ${quantity}
                        </span>


                        <span
                            class="detail-value"
                        >
                            ₹${subtotal.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2
                                }
                            )}
                        </span>

                    </div>
                `;

            }).join("");

    }


    orderDetailsContainer.innerHTML = `

        <div
            class="order-details-card"
        >

            <div
                class="order-details-header"
            >

                <div>

                    <h2>
                        Order #${order.id}
                    </h2>


                    <p>
                        ${formatDate(
                            order.created_at
                        )}
                    </p>

                </div>


                <span
                    class="
                        status
                        ${getStatusClass(
                            status
                        )}
                    "
                >
                    ${escapeHTML(
                        status
                    )}
                </span>

            </div>


            <h3>
                Order Items
            </h3>


            <div
                class="order-items"
            >
                ${itemsHTML}
            </div>


            <div
                class="detail-item total-detail"
            >

                <span
                    class="detail-label"
                >
                    Total Amount
                </span>


                <span
                    class="detail-value"
                >
                    ₹${Number(
                        order.total_amount ||
                        0
                    ).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2
                        }
                    )}
                </span>

            </div>

        </div>
    `;


    const backButton =
        document.getElementById(
            "backToOrders"
        );


    if (backButton) {

        backButton.onclick = () => {

            showView(
                "ordersView"
            );


            document
                .querySelectorAll(
                    ".nav-btn"
                )
                .forEach(btn =>
                    btn.classList.remove(
                        "active"
                    )
                );


            const ordersButton =
                document.querySelector(
                    '[data-view="ordersView"]'
                );


            if (ordersButton) {

                ordersButton.classList.add(
                    "active"
                );

            }


            loadOrders();

        };

    }

}


/* =========================================
   GO TO PRODUCTS
========================================= */

function goToProducts() {

    showView(
        "productsView"
    );


    if (productSearch) {

        productSearch.value = "";

    }


    if (categoryFilter) {

        categoryFilter.value =
            "all";

    }


    renderProducts(
        products
    );


    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(btn =>
            btn.classList.remove(
                "active"
            )
        );


    const productsButton =
        document.querySelector(
            '[data-view="productsView"]'
        );


    if (productsButton) {

        productsButton.classList.add(
            "active"
        );

    }

}


/* =========================================
   STATUS CLASS
========================================= */

function getStatusClass(status) {

    return `status-${String(
        status
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        )}`;

}


/* =========================================
   DATE FORMAT
========================================= */

function formatDate(date) {

    if (!date) return "";


    const parsedDate =
        new Date(date);


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return "";

    }


    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   TOAST MESSAGE
========================================= */

function showToast(message) {

    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3000);

}


/* =========================================
   HTML SAFETY
========================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}