import mongoose, {Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const cartSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        
        isBlocked : {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true
    }
)

cartSchema.plugin(mongooseAggregatePaginate);

export const Cart = mongoose.model('Cart', cartSchema);