import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const orderItemsSchema = new Schema({
    orderId : {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },

    user : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    product : {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    quantity : {
        type: Number,
        required: true,
        default: 1
    },

    // price : {
    //     type: Number,
    //     required: true
    // },

    status : {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },

    // seller : {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Seller',
    //     required: true
    // }
},
{timestamps:true})

orderItemsSchema.plugin(mongooseAggregatePaginate);

export const Orderitem = mongoose.model('Orderitem', orderItemsSchema);