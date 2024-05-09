import mongoose, {Schema} from 'mongoose';

const orderDetailsSchema = new Schema(
    {
        order_id: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        product_id: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        totalprice: {
            type: Number,
            required: true,
        },
    }
)

export const OrderDetails = mongoose.model('OrderDetails', orderDetailsSchema);