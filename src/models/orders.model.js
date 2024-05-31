import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

export const ordersSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },

    address: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },

    paymentId: {
        type: String,
        default: null
    },

    orderId: {
        type: String,
        default: null,
        unique: true
    }

},
{timestamps: true});

ordersSchema.plugin(mongooseAggregatePaginate);

export const Order = mongoose.model('Order', ordersSchema);