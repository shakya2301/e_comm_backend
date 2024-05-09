import mongoose, {Schema} from 'mongoose';

const wishlistSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        product_id: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
    }
)

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);