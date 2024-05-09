import mongoose, {Schema} from 'mongoose';

const brandSchema = new Schema(
    {
        brand_name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        brand_logo: {
            type: String,
            required: true,
        }
    }
)

export const Brand = mongoose.model('Brand', brandSchema);