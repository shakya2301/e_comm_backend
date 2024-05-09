import mongoose, {Schema} from 'mongoose';

const shippingSchema = new Schema(
    {
        ship_name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        ship_phone: {
            type: String,
            required: true,
        },
        ship_email: {
            type: String,
            required: true,
        },
        ship_address: {
            type: String,
            required: true,
        },
        ship_city: {
            type: String,
            required: true,
        },
        order_id: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        }
    },
    {
        timestamps: true,
    }
)

export const Shipping= mongoose.model('Shipping', shippingSchema);