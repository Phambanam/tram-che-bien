"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dish_controller_1 = require("../controllers/dish.controller");
// import { protect, authorize } from "../middleware/auth.middleware" // Temporarily disabled for development
const router = (0, express_1.Router)();
// Public routes (temporarily without auth for development)
router.get("/", dish_controller_1.getDishes);
router.get("/:id", dish_controller_1.getDishById);
router.get("/by-ingredient/:lttpId", dish_controller_1.getDishesByIngredient);
router.get("/by-main-lttp/:lttpId", dish_controller_1.getDishesByMainLTTP);
// Protected routes (temporarily public for development)
router.post("/", dish_controller_1.createDish);
router.patch("/:id", dish_controller_1.updateDish);
// Admin only routes (temporarily public for development)
router.delete("/:id", dish_controller_1.deleteDish);
exports.default = router;
