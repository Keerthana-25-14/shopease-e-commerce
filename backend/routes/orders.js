const express = require("express");
const db = require("../db/database");

const router = express.Router();


// ========================================
// CREATE ORDER / CHECKOUT
// ========================================

router.post("/checkout", async (req, res) => {

    const connection = await db.promise().getConnection();

    try {

        const { user_id } = req.body;

        if (!user_id) {
            connection.release();

            return res.status(400).json({
                message: "user_id is required"
            });
        }

        // Start database transaction
        await connection.beginTransaction();

        // Get user's cart
        const [cartItems] = await connection.query(
            `SELECT
                cart_items.product_id,
                cart_items.quantity,
                products.name,
                products.price,
                products.stock
             FROM cart_items
             JOIN products
                ON cart_items.product_id = products.id
             WHERE cart_items.user_id = ?`,
            [user_id]
        );

        // Check if cart is empty
        if (cartItems.length === 0) {

            await connection.rollback();
            connection.release();

            return res.status(400).json({
                message: "Cart is empty"
            });
        }

        // Check stock and calculate total
        let totalAmount = 0;

        for (const item of cartItems) {

            if (item.quantity > item.stock) {

                await connection.rollback();
                connection.release();

                return res.status(400).json({
                    message: `Not enough stock for ${item.name}`
                });
            }

            totalAmount += Number(item.price) * item.quantity;
        }

        // Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (user_id, total_amount, status)
            VALUES (?, ?, 'Placed')`,
            [user_id, totalAmount]
        );

        const orderId = orderResult.insertId;

        // Add cart items to order_items
        for (const item of cartItems) {

            await connection.query(
                `INSERT INTO order_items
                (order_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price
                ]
            );

            // Reduce product stock
            await connection.query(
                `UPDATE products
                 SET stock = stock - ?
                 WHERE id = ?`,
                [
                    item.quantity,
                    item.product_id
                ]
            );
        }

        // Clear user's cart
        await connection.query(
            "DELETE FROM cart_items WHERE user_id = ?",
            [user_id]
        );

        // Commit transaction
        await connection.commit();

        connection.release();

        res.status(201).json({
            message: "Order placed successfully",
            orderId: orderId,
            totalAmount: totalAmount
        });

    } catch (error) {

        // Rollback if something goes wrong
        await connection.rollback();

        connection.release();

        console.error("Checkout error:", error);

        res.status(500).json({
            message: "Failed to place order"
        });
    }

});


// ========================================
// GET USER ORDERS
// ========================================

router.get("/user/:userId", async (req, res) => {

    try {

        const { userId } = req.params;

        const [orders] = await db.promise().query(
            `SELECT
                id,
                total_amount,
                status,
                created_at
             FROM orders
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json(orders);

    } catch (error) {

        console.error("Error fetching orders:", error);

        res.status(500).json({
            message: "Failed to fetch orders"
        });
    }

});

// ========================================
// GET ORDER DETAILS
// ========================================

router.get("/:orderId", async (req, res) => {

    try {

        const { orderId } = req.params;

        const [orders] = await db.promise().query(
            `SELECT
                orders.id,
                orders.user_id,
                orders.total_amount,
                orders.status,
                orders.created_at
             FROM orders
             WHERE orders.id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const [items] = await db.promise().query(
            `SELECT
                order_items.id,
                order_items.product_id,
                products.name,
                order_items.quantity,
                order_items.price,
                (order_items.quantity * order_items.price) AS subtotal
             FROM order_items
             JOIN products
                ON order_items.product_id = products.id
             WHERE order_items.order_id = ?`,
            [orderId]
        );

        res.json({
            order: orders[0],
            items: items
        });

    } catch (error) {

        console.error("Error fetching order details:", error);

        res.status(500).json({
            message: "Failed to fetch order details"
        });

    }

});

router.put("/:orderId/status", async (req, res) => {

    try {

        const { orderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "Placed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        const [result] = await db.promise().query(
            `UPDATE orders
             SET status = ?
             WHERE id = ?`,
            [status, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.json({
            message: "Order status updated successfully",
            status: status
        });

    } catch (error) {

        console.error("Error updating order status:", error);

        res.status(500).json({
            message: "Failed to update order status"
        });

    }

});

module.exports = router;