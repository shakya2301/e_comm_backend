import mongoose, {Schema} from 'mongoose';

const productSchema = new Schema(
    {
        product_code: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        product_name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        product_description: {
            type: String,
            required: true,
        },
        product_price: {
            type: Number,
            required: true,
        },
        product_image: {
            type: String,
            required: true,
        },
        product_brand: {
            type: Schema.Types.ObjectId,
            ref: 'Brand',
            required: true,
        },
        product_category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        product_subcategory: {
            type: Schema.Types.ObjectId,
            ref: 'Subcategory',
            required: true,
        },
        product_countInStock: {
            type: Number,
            required: true,
        },

        isoutofstock: {
            type: Boolean,
            required: true,
        },

        rating: {
            type: Number
        }
    }
)

export const Product = mongoose.model('Product', productSchema);