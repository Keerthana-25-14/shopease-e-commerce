const express = require("express");

const db = require("../db/database");

const router = express.Router();


// ========================================
// GET ALL PRODUCTS
// ========================================

router.get("/", async (req, res) => {

    try {

        const [products] = await db.promise().query(
            "SELECT * FROM products ORDER BY id DESC"
        );

        res.json(products);

    } catch (error) {

        console.error("Error fetching products:", error);

        res.status(500).json({
            message: "Failed to fetch products"
        });

    }

});
// ========================================
// ADD NEW PRODUCT
// ========================================

router.post("/", async (req, res) => {

    try {

        const {
            name,
            description,
            price,
            image_url,
            stock,
            category
        } = req.body;

        // Check required fields
        if (!name || price === undefined) {
            return res.status(400).json({
                message: "Product name and price are required"
            });
        }

        // Insert product into database
        const [result] = await db.promise().query(
            `INSERT INTO products
            (name, description, price, image_url, stock, category)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                price,
                image_url || null,
                stock || 0,
                category || null
            ]
        );

        res.status(201).json({
            message: "Product added successfully",
            productId: result.insertId
        });

    } catch (error) {

        console.error("Error adding product:", error);

        res.status(500).json({
            message: "Failed to add product"
        });

    }

});

// ========================================
// UPDATE PRODUCT
// ========================================

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            name,
            description,
            price,
            image_url,
            stock,
            category
        } = req.body;

        const [result] = await db.promise().query(
            `UPDATE products
             SET name = ?,
                 description = ?,
                 price = ?,
                 image_url = ?,
                 stock = ?,
                 category = ?
             WHERE id = ?`,
            [
                name,
                description,
                price,
                image_url,
                stock,
                category,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product updated successfully"
        });

    } catch (error) {

        console.error("Error updating product:", error);

        res.status(500).json({
            message: "Failed to update product"
        });

    }

});

// ========================================
// DELETE PRODUCT
// ========================================

router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const [result] = await db.promise().query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });

    } catch (error) {

        console.error("Error deleting product:", error);

        res.status(500).json({
            message: "Failed to delete product"
        });

    }

});

module.exports = router;