"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supply = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SupplySchema = new mongoose_1.Schema({
    unit: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Unit',
        required: true
    },
    category: {
        type: String,
        ref: 'Category',
        required: true
    },
    product: {
        type: String,
        ref: 'Product',
        required: true
    },
    supplyQuantity: {
        type: Number,
        required: true
    },
    stationEntryDate: {
        type: Date,
        default: null
    },
    requestedQuantity: {
        type: Number,
        default: null
    },
    receivedQuantity: {
        type: Number,
        default: null
    },
    actualQuantity: {
        type: Number,
        default: null
    },
    unitPrice: {
        type: Number,
        default: null
    },
    totalPrice: {
        type: Number,
        default: null
    },
    expiryDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'deleted', 'received'],
        default: 'pending'
    },
    note: {
        type: String,
        default: ''
    },
    createdBy: {
        id: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String
    },
    approvedBy: {
        id: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String
    }
}, {
    timestamps: true
});
// Add any middleware or methods here
// Create and export the model
exports.Supply = mongoose_1.default.model('Supply', SupplySchema);
