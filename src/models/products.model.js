import mongoose, {Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

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
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            trim: true,
            lowercase: true
        },
        subCategory: {
            type: Schema.Types.ObjectId,
            ref: "SubCategory",
            required: true,
            trim: true,
            lowercase: true
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: 'Seller',
            required: true
        },
        ratings: {
            type: Number,
            default: 0
        },
        brand: {
            type: Schema.Types.ObjectId,
            ref: 'Brand',
            default: null
        },
        isDeleted: {
            type: Boolean,
            default: false
        }

    },
    {
        timestamps: true
    }
)

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model('Product', productSchema);