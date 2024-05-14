import mongoose, {Schema} from 'mongoose';

const subCategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        }
    },
    {
        timestamps: true
    }
);

export const Subcategory = mongoose.model('SubCategory', subCategorySchema);