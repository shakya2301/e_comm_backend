import mongoose, {Schema} from 'mongoose';

const categorySchema = new Schema(
    {
        category_name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
    }
)

export const Category= mongoose.model('Category', categorySchema);