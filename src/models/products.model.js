import mongoose, {Schema} from 'mongoose'

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        description: {
            type: String,
            required: true,
            lowercase: true
        },
        price: {
            type: Number,
            required: true,
        },
        countInStock: {
            type: Number,
            required: true,
        },
        images: [
            {
                type: String,
                default: null
            }
        ],
        category: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        subCategory: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        ratings: {
            type: Number,
            default: 0
        },
        brand: {
            type: Schema.Types.ObjectId,
            default: null
        }

    },
    {
        timestamps: true
    }
)

export const Product = mongoose.model('Product', productSchema);