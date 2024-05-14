import mongoose, {Schema} from 'mongoose';
import slugify from 'slugify';

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
    }
},
{timestamps: true});

categorySchema.pre('save', function(next){
    const slug = slugify(this.name, {lower: true});
    this.name = slug;
    next();
});

export const Category = mongoose.model('Category', categorySchema);