"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supply_output_controller_1 = require("../controllers/supply-output.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Protected routes
router.use(auth_middleware_1.protect);
// Routes for all authenticated users
router.get("/", supply_output_controller_1.getAllSupplyOutputs);
router.get("/planned-vs-actual", supply_output_controller_1.getPlannedVsActual);
router.get("/:id", supply_output_controller_1.getSupplyOutputById);
// Routes for brigade assistant (for planned outputs)
router.post("/generate-planned", (0, auth_middleware_1.authorize)("brigadeAssistant"), supply_output_controller_1.generatePlannedOutputs);
router.patch("/planned/:id", (0, auth_middleware_1.authorize)("brigadeAssistant"), supply_output_controller_1.updatePlannedOutput);
// Routes for admin/station manager (for actual outputs)
router.post("/", (0, auth_middleware_1.authorize)("admin", "stationManager"), supply_output_controller_1.createSupplyOutput);
router.patch("/:id", (0, auth_middleware_1.authorize)("admin", "stationManager"), supply_output_controller_1.updateSupplyOutput);
router.delete("/:id", (0, auth_middleware_1.authorize)("admin", "stationManager"), supply_output_controller_1.deleteSupplyOutput);
exports.default = router;
