


document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.main-nav');
    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            nav.classList.toggle('active');
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
            });
        });
    }

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const targetTabId = this.dataset.tab + 'FormTab';
            document.querySelectorAll('.auth-form-tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById(targetTabId).classList.add('active');
        });
    });

    document.querySelectorAll('[data-tab-switch]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.dataset.tabSwitch;
            document.querySelector(`.tab-button[data-tab="${targetTab}"]`).click();
        });
    });

    let products = [];
    let cart = JSON.parse(localStorage.getItem('foodyWBCart')) || [];

    // Select elements relevant to cart and product pages
    const productListElement = document.getElementById('productGrid');
    const cartItemsElement = document.getElementById('cartItems');
    const cartSubtotalElement = document.getElementById('cartSubtotal');
    const cartDiscountElement = document.getElementById('cartDiscount');
    const totalPriceElement = document.getElementById('cartTotal');
    const totalItemsCountElement = document.getElementById('totalItems');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const notificationBox = document.getElementById('cartNotification');
    let notificationTimeout;

    function isOfferActive(product) {
        if (product.isOnOffer && product.offerValidUntil) {
            const now = new Date();
            const validUntilDate = new Date(product.offerValidUntil);
            return product.isOnOffer && validUntilDate.getTime() > now.getTime();
        }
        return false;
    }

    function getEffectivePrice(product) {
        return isOfferActive(product)
            ? product.price * (1 - product.offerPercentage / 100)
            : product.price;
    }

    function displayProducts() {
    
        if (!productListElement) return;

        productListElement.innerHTML = '';

        if (products.length === 0) {
            productListElement.innerHTML = '<p>No products available at the moment. Please check back later!</p>';
            return;
        }

        products.forEach(product => {
            const effectivePrice = getEffectivePrice(product);
            const onOffer = isOfferActive(product);

            const priceHtml = onOffer
                ? `<p>Price: <span class="original-price">Nrs ${product.price.toFixed(2)}</span> <span class="discounted-price">Nrs ${effectivePrice.toFixed(2)}</span></p>`
                : `<p>Price: Nrs ${product.price.toFixed(2)}</p>`;

            const offerBadge = onOffer
                ? `<span class="offer-badge">${product.offerPercentage}% OFF!</span>`
                : '';

            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                ${offerBadge}
                <h4>${product.name}</h4>
                ${priceHtml}
                <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
            `;
            productListElement.appendChild(productDiv);
        });
    }

    function showNotification(message) {
        if (notificationBox) { 
            clearTimeout(notificationTimeout);
            notificationBox.textContent = message;
            notificationBox.classList.add('show');

            notificationTimeout = setTimeout(() => {
                notificationBox.classList.remove('show');
            }, 3000);
        }
    }

    function addToCart(productId) {
        if (!productId || isNaN(productId)) {
            showNotification("Invalid product ID.");
            return;
        }

        const productToAdd = products.find(p => p.id === productId);
        if (productToAdd) {
            const effectivePrice = getEffectivePrice(productToAdd);
            const existingItemIndex = cart.findIndex(item => item.productId === productId);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    productId: productToAdd.id,
                    name: productToAdd.name,
                    image: productToAdd.image,
                    originalPriceAtTimeOfAdd: productToAdd.price,
                    priceAtTimeOfAdd: effectivePrice,
                    quantity: 1
                });
            }

            saveCart();
            updateCartDisplay();
            const currentQuantity = cart.find(item => item.productId === productId).quantity;
            showNotification(`${productToAdd.name} added to cart! Total: ${currentQuantity}`);
        } else {
            console.error(`Product with ID ${productId} not found.`);
            showNotification('Error: Product not found.');
        }
    }

    function updateCartDisplay() {
        
        if (!cartItemsElement || !cartSubtotalElement || !cartDiscountElement || !totalPriceElement || !totalItemsCountElement) {
           
            return;
        }

        cartItemsElement.innerHTML = '';
        let totalItemsInCart = 0;
        let subtotal = 0;
        let totalDiscountAmount = 0;
        let grandTotal = 0;

        if (cart.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Your cart is empty.';
            cartItemsElement.appendChild(emptyMessage);
        } else {
            cart.forEach(item => {
                totalItemsInCart += item.quantity;

                const originalTotal = item.originalPriceAtTimeOfAdd * item.quantity;
                const discountedTotal = item.priceAtTimeOfAdd * item.quantity;
                const discount = originalTotal - discountedTotal;

                subtotal += originalTotal;
                totalDiscountAmount += discount;
                grandTotal += discountedTotal;

                const li = document.createElement('li');
                li.setAttribute('data-product-id', item.productId);
                li.innerHTML = `
                    <div class="item-info">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div>
                            <span class="item-name">${item.name}</span><br>
                            ${discount > 0
                                ? `<span class="original-item-price">Nrs ${item.originalPriceAtTimeOfAdd.toFixed(2)}</span> <span class="discounted-item-price">Nrs ${item.priceAtTimeOfAdd.toFixed(2)}</span>`
                                : `<span class="item-price">Nrs ${item.priceAtTimeOfAdd.toFixed(2)}</span>`
                            }
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="quantity-btn decrease" data-product-id="${item.productId}">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-product-id="${item.productId}">+</button>
                        <button class="remove-from-cart-btn" data-product-id="${item.productId}">Remove</button>
                    </div>
                `;
                cartItemsElement.appendChild(li);
            });
        }

        totalItemsCountElement.textContent = totalItemsInCart;
        cartSubtotalElement.textContent = subtotal.toFixed(2);
        cartDiscountElement.textContent = totalDiscountAmount.toFixed(2);
        totalPriceElement.textContent = grandTotal.toFixed(2);

    }

    function changeQuantity(productId, delta) {
        const itemIndex = cart.findIndex(item => item.productId === productId);
        if (itemIndex > -1) {
            cart[itemIndex].quantity += delta;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
            saveCart();
            updateCartDisplay();
        }
    }

    function removeFromCart(productId) {
        const initialCartLength = cart.length;
        cart = cart.filter(item => item.productId !== productId);
        if (cart.length < initialCartLength) {
            saveCart();
            updateCartDisplay();
            showNotification('Item removed from cart.');
        }
    }

    function saveCart() {
        localStorage.setItem('foodyWBCart', JSON.stringify(cart));
    }

   
    if (productListElement) {
        productListElement.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-cart-btn')) {
                const productId = parseInt(event.target.dataset.productId);
                if (!isNaN(productId)) {
                    addToCart(productId);
                }
            }
        });
    }

   
    if (cartItemsElement) {
        cartItemsElement.addEventListener('click', (event) => {
            const target = event.target;
            const productId = parseInt(target.dataset.productId);
            if (!isNaN(productId)) {
                if (target.classList.contains('remove-from-cart-btn')) {
                    removeFromCart(productId);
                } else if (target.classList.contains('quantity-btn')) {
                    if (target.classList.contains('increase')) {
                        changeQuantity(productId, 1);
                    } else if (target.classList.contains('decrease')) {
                        changeQuantity(productId, -1);
                    }
                }
            }
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            showNotification('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            showNotification('Registration successful! (This is a demo, no actual registration occurred.)');
            registerForm.reset();
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            showNotification('Login successful! (This is a demo, no actual login occurred.)');
            loginForm.reset();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showNotification("Your cart is empty. Please add items before checking out.");
                return;
            }
            const confirmCheckout = confirm("Proceed to checkout?");
            if (confirmCheckout) {
                showNotification("Proceeding to payment... (Demo: Payment gateway integration needed here!)");
                cart = [];
                saveCart();
                updateCartDisplay();
            }
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the cart?")) {
                cart = [];
                saveCart();
                updateCartDisplay();
                showNotification("Cart cleared.");
            }
        });
    }

    async function fetchProductsFromAPI() {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [
            { id: 1, name: "Fried Rice", price: 120, image: "/assets/fried_rice.jpg" },
            { id: 2, name: "Burger", price: 150, image: "/assets/burger.jpg", isOnOffer: true, offerPercentage: 10, offerValidUntil: "2025-07-31T23:59:59" },
            { id: 3, name: "Ice Cream", price: 80, image: "/assets/ice_cream.jpg" },
            { id: 4, name: "Chicken Roast", price: 200, image: "/assets/chicken.jpg" },
            { id: 5, name: "Pizza", price: 250, image: "/assets/pizza.jpg", isOnOffer: true, offerPercentage: 15, offerValidUntil: "2025-07-15T23:59:59" }, // Note: This offer expires today
            { id: 6, name: "Pasta", price: 180, image: "/assets/pasta.jpg" },
            { id: 7, name: "Sandwich", price: 100, image: "/assets/sandwich.jpg" },
            { id: 8, name: "Salad", price: 90, image: "/assets/salad.jpg" },
            { id: 9, name: "Fried momo", price: 200, image: "/assets/fried_momo.jpeg" },
        ];
    }

    async function initializeApp() {
        try {
            products = await fetchProductsFromAPI();

            if (productListElement) {
                displayProducts();
            }

            updateCartDisplay();
        } catch (error) {
            console.error("Failed to fetch products:", error);
            if (notificationBox) {
                 showNotification("Failed to load products. Please try again later.");
            }
            if (productListElement) {
                productListElement.innerHTML = '<p>Error loading products. Please refresh the page.</p>';
            }
        }
    }

    initializeApp();
});




