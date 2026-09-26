const express = require("express");
const db = require("../db/database");

const router = express.Router();


// ========================================
// ADD PRODUCT TO CART
// ========================================

router.post("/", async (req, res) => {

    try {

        const { user_id, product_id, quantity } = req.body;

        if (!user_id || !product_id) {
            return res.status(400).json({
                message: "user_id and product_id are required"
            });
        }

        const qty = quantity || 1;

        // Check whether product exists
        const [products] = await db.promise().query(
            "SELECT * FROM products WHERE id = ?",
            [product_id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const product = products[0];

        // Check stock
        if (product.stock < qty) {
            return res.status(400).json({
                message: "Not enough stock available"
            });
        }

        // Check whether product is already in cart
        const [existingItems] = await db.promise().query(
            "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
            [user_id, product_id]
        );

        if (existingItems.length > 0) {

            const newQuantity = existingItems[0].quantity + qty;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    message: "Requested quantity exceeds available stock"
                });
            }

            await db.promise().query(
                "UPDATE cart_items SET quantity = ? WHERE id = ?",
                [newQuantity, existingItems[0].id]
            );

        } else {

            await db.promise().query(
                `INSERT INTO cart_items
                (user_id, product_id, quantity)
                VALUES (?, ?, ?)`,
                [user_id, product_id, qty]
            );

        }

        res.status(201).json({
            message: "Product added to cart successfully"
        });

    } catch (error) {

        console.error("Error adding to cart:", error);

        res.status(500).json({
            message: "Failed to add product to cart"
        });

    }

});


// ========================================
// GET USER CART
// ========================================

router.get("/:userId", async (req, res) => {

    try {

        const { userId } = req.params;

        const [cart] = await db.promise().query(
            `SELECT
                cart_items.id,
                cart_items.product_id,
                products.name,
                products.price,
                products.image_url,
                cart_items.quantity,
                (products.price * cart_items.quantity) AS subtotal
             FROM cart_items
             JOIN products
                ON cart_items.product_id = products.id
             WHERE cart_items.user_id = ?`,
            [userId]
        );

        res.json(cart);

    } catch (error) {

        console.error("Error fetching cart:", error);

        res.status(500).json({
            message: "Failed to fetch cart"
        });

    }

});


// ========================================
// UPDATE CART ITEM QUANTITY
// ========================================

router.put("/:cartItemId", async (req, res) => {

    try {

        const { cartItemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be at least 1"
            });
        }

        // Get cart item + product stock
        const [items] = await db.promise().query(
            `SELECT
                cart_items.id,
                cart_items.user_id,
                cart_items.product_id,
                products.stock
             FROM cart_items
             JOIN products
                ON cart_items.product_id = products.id
             WHERE cart_items.id = ?`,
            [cartItemId]
        );

        if (items.length === 0) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        const item = items[0];

        // Check stock
        if (quantity > item.stock) {
            return res.status(400).json({
                message: "Requested quantity exceeds available stock"
            });
        }

        await db.promise().query(
            `UPDATE cart_items
             SET quantity = ?
             WHERE id = ?`,
            [quantity, cartItemId]
        );

        res.json({
            message: "Cart quantity updated successfully"
        });

    } catch (error) {

        console.error("Error updating cart:", error);

        res.status(500).json({
            message: "Failed to update cart"
        });

    }

});


// ========================================
// REMOVE PRODUCT FROM CART
// ========================================

router.delete("/:cartItemId", async (req, res) => {

    try {

        const { cartItemId } = req.params;

        const [result] = await db.promise().query(
            `DELETE FROM cart_items
             WHERE id = ?`,
            [cartItemId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        res.json({
            message: "Product removed from cart successfully"
        });

    } catch (error) {

        console.error("Error removing cart item:", error);

        res.status(500).json({
            message: "Failed to remove product from cart"
        });

    }

});

module.exports = router;