import mongoose, {Schema} from "mongoose";

const subcategorySchema = new Schema(
    {
        subcategory_name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        category_id: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        }
    }
)

export const Subcategory= mongoose.model('SubCategory', subcategorySchema);