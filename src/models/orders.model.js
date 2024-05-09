import mongoose, {Schema} from "mongoose";

const orderSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        payment_id: {
            type: Schema.Types.ObjectId,
            ref: 'Payment',
            required: true,
        },
        payment_type: {
            type: String,
            required: true,
        },
        payment_amount: {
            type: Number,
            required: true,
        },
        coupon_id: {
            type: Schema.Types.ObjectId,
            ref: 'Coupon',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
        },
        shipping_charge: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        return_order: {
            type: Boolean,
            required: true,
        }, 
    },
    {
        timestamps: true,
    }
)