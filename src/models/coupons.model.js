import mongoose, {Schema} from 'mongoose';

const couponSchema = new Schema(
    {
        coupon_name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        discount: {
            type: Number,
            required: true,
        },
        expiry: {
            type: Date,
            required: true,
        },
        min_order: {
            type: Number,
            required: false,
        },

        brand_id: {
            type: Schema.Types.ObjectId,
            ref: 'Brand',
            required: false,
        }
    }
)